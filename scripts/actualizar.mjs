/* ============================================================
   Actualiza data/pautas.js con lo que reporta la Graph API.

   Sólo toca `campanas` y `dias` (lo que Meta mide). Todo lo
   curado a mano — umbrales, aprendizajes, checklist, pendientes,
   página, huecos — se preserva tal cual.

   Uso:
     META_TOKEN=EAA... node scripts/actualizar.mjs
     META_TOKEN=EAA... node scripts/actualizar.mjs --desde 2026-07-25
   ============================================================ */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVO = join(RAIZ, "data", "pautas.js");

const TOKEN = process.env.META_TOKEN;
const CUENTA = process.env.META_ACT || "229885267550030";
const API = "v21.0";
const CONVERSACION = "onsite_conversion.messaging_conversation_started_7d";

if (!TOKEN) {
  console.error("Falta META_TOKEN. Ver README → Actualización automática.");
  process.exit(1);
}

/* ---------- fechas ---------- */
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const iso = (d) => d.toISOString().slice(0, 10);
/* Meta nunca reporta el día en curso: se pide hasta ayer. */
const ayer = new Date(Date.now() - 864e5);
const desde = arg("--desde") || iso(new Date(ayer - 13 * 864e5));
const hasta = arg("--hasta") || iso(ayer);

/* ---------- Graph API ---------- */
async function insights(level, extra = {}) {
  const p = new URLSearchParams({
    level,
    time_increment: extra.diario ? "1" : "all_days",
    time_range: JSON.stringify({ since: desde, until: hasta }),
    fields: [
      "campaign_id", "campaign_name", "spend", "reach", "frequency", "impressions",
      "inline_link_clicks", "inline_link_click_ctr", "cost_per_inline_link_click",
      "clicks", "ctr", "actions", "cost_per_action_type", "date_start"
    ].join(","),
    limit: "500",
    access_token: TOKEN
  });
  const filas = [];
  let url = `https://graph.facebook.com/${API}/act_${CUENTA}/insights?${p}`;
  while (url) {
    const r = await fetch(url);
    const j = await r.json();
    if (j.error) throw new Error(`${j.error.message} (código ${j.error.code})`);
    filas.push(...(j.data || []));
    url = j.paging?.next || null;
  }
  return filas;
}

const n = (v) => (v == null || v === "" ? null : Number(v));
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
function conversaciones(fila) {
  const a = (fila.actions || []).find((x) => x.action_type === CONVERSACION);
  return a ? Number(a.value) : 0;
}

/* ---------- leer el archivo actual ---------- */
const fuente = readFileSync(ARCHIVO, "utf8");
const DATOS = new Function(
  "window",
  fuente + "\nreturn window.DATOS;"
)({});

/* ---------- traer datos ---------- */
console.log(`Pidiendo ${desde} → ${hasta} de la cuenta ${CUENTA}…`);
const [resumen, diarias] = await Promise.all([
  insights("campaign"),
  insights("campaign", { diario: true })
]);
console.log(`  ${resumen.length} campañas, ${diarias.length} filas día x campaña.`);

/* Sólo las campañas que ya están registradas: la clasificación por ciclo y
   universidad es manual y no se puede inferir del nombre (hay campañas
   distintas con el mismo nombre). */
const porNombre = new Map();
DATOS.campanas.forEach((c) => {
  if (c.meta_id) porNombre.set(c.meta_id, c);
});

let act = 0, nuevos = 0;
const sinRegistrar = new Set();

for (const f of resumen) {
  const c = porNombre.get(f.campaign_id);
  if (!c) { sinRegistrar.add(`${f.campaign_id} · ${f.campaign_name}`); continue; }
  const conv = conversaciones(f);
  Object.assign(c, {
    conv,
    alcance: n(f.reach),
    frecuencia: r2(n(f.frequency)),
    gasto: r2(n(f.spend)),
    costo_conv: conv > 0 ? r2(n(f.spend) / conv) : null,
    clics_enlace: n(f.inline_link_clicks),
    cpc: r2(n(f.cost_per_inline_link_click)),
    ctr: r2(n(f.inline_link_click_ctr)),
    clics_todos: n(f.clicks),
    ctr_todos: r2(n(f.ctr))
  });
  act++;
}

const clave = (d) => `${d.fecha}|${d.campana}`;
const indice = new Map(DATOS.dias.map((d) => [clave(d), d]));

for (const f of diarias) {
  const c = porNombre.get(f.campaign_id);
  if (!c) continue;
  const fecha = f.date_start;
  const inicio = c.inicio || fecha;
  const dia_ciclo =
    Math.round((Date.parse(fecha) - Date.parse(inicio)) / 864e5) + 1;
  const fila = {
    fecha, campana: c.id, dia_ciclo,
    conv: conversaciones(f),
    alcance: n(f.reach),
    frec: r2(n(f.frequency)),
    gasto: r2(n(f.spend)),
    clics: n(f.inline_link_clicks),
    cpc: r2(n(f.cost_per_inline_link_click)),
    ctr: r2(n(f.inline_link_click_ctr)),
    clics_todos: n(f.clicks),
    ctr_todos: r2(n(f.ctr))
  };
  const previo = indice.get(clave(fila));
  if (previo) Object.assign(previo, fila);
  else { DATOS.dias.push(fila); indice.set(clave(fila), fila); nuevos++; }
}

DATOS.dias.sort((a, b) =>
  a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.campana < b.campana ? -1 : 1);
DATOS.meta.actualizado = iso(new Date());
DATOS.meta.ultimo_dia_con_datos = DATOS.dias[DATOS.dias.length - 1].fecha;

/* ---------- escribir ---------- */
const salida =
`/* ============================================================
   Auditoría de Pautas — Aceptados: Exámenes de Admisión

   Generado por scripts/actualizar.mjs el ${new Date().toISOString()}
   Rango pedido: ${desde} → ${hasta}

   `+`Las secciones curadas a mano (umbrales, aprendizajes, checklist,
   pendientes, pagina, huecos) se preservan entre corridas: se pueden
   editar aquí directamente.
   ============================================================ */

window.DATOS = ${JSON.stringify(DATOS, null, 2)};
`;
writeFileSync(ARCHIVO, salida, "utf8");

console.log(`Listo: ${act} campañas actualizadas, ${nuevos} días nuevos.`);
console.log(`Último día con datos: ${DATOS.meta.ultimo_dia_con_datos}`);
if (sinRegistrar.size) {
  console.log("\nCampañas con gasto que no están dadas de alta en pautas.js:");
  sinRegistrar.forEach((s) => console.log("  · " + s));
  console.log("Agregarlas al arreglo `campanas` con su `meta_id`, `uni` y `ciclo`.");
}
