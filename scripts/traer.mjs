/* ============================================================
   Trae de Meta únicamente los días que faltan.

   Si ya está todo al día ni siquiera abre Chrome: el trabajo más
   barato es el que no se hace.

   Uso:
     node scripts/traer.mjs              actualiza lo que falte
     node scripts/traer.mjs --que-falta  sólo dice qué falta
     node scripts/traer.mjs --login      abre Chrome para iniciar sesión
     node scripts/traer.mjs --desde 2026-08-17 --hasta 2026-08-21
   ============================================================ */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { abrirChrome, Pestana, dormir } from "./chrome.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVO = join(RAIZ, "data", "pautas.js");
const PERFIL = join(RAIZ, ".chrome-perfil");
const CUENTA = "229885267550030";

/* ---------------- fechas ---------------- */
const dia = 864e5;
export const iso = (d) => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const dePuntoIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
/* Meta nunca reporta el día en curso: lo último que puede existir es ayer. */
export const ayer = () => iso(new Date(Date.now() - dia));
const sumar = (s, n) => iso(new Date(dePuntoIso(s).getTime() + n * dia));

/* ---------------- leer el estado actual ---------------- */
export async function leerDatos() {
  const fuente = await readFile(ARCHIVO, "utf8");
  const DATOS = new Function("window", fuente + "\nreturn window.DATOS;")({});
  return { fuente, DATOS };
}

/* Qué días no tenemos. Sólo mira hacia adelante desde el último día
   cargado: los huecos viejos se piden a mano con --desde/--hasta. */
export function queFalta(DATOS) {
  const ult = DATOS.meta.ultimo_dia_con_datos;
  const fin = ayer();
  const dias = [];
  for (let f = sumar(ult, 1); f <= fin; f = sumar(f, 1)) dias.push(f);
  return {
    dias,
    desde: dias[0] || null,
    hasta: dias[dias.length - 1] || null,
    ultimo_cargado: ult,
    al_dia: dias.length === 0,
    /* Los huecos se declaran como texto legible; aquí se parten en
       fechas para que la app pueda pedirlos con un clic. */
    huecos_viejos: DATOS.huecos.map((h) => {
      const f = h.rango.match(/\d{4}-\d{2}-\d{2}/g) || [];
      return { rango: h.rango, desde: f[0] || null, hasta: f[1] || f[0] || null, motivo: h.motivo };
    })
  };
}

/* ---------------- extracción ---------------- */
const url = (desde, hasta) =>
  `https://adsmanager.facebook.com/adsmanager/manage/campaigns` +
  `?act=${CUENTA}&column_preset=PERFORMANCE_LEGACY` +
  `&date=${desde}_${hasta}&time_breakdown=days_1&sort=spend~0`;

/* Se corre dentro de la página. Devuelve las filas de la tabla como
   listas de celdas: el innerText suelto del body mezcla las columnas. */
const LEER_TABLA = `(() => {
  const filas = [...document.querySelectorAll('[role="row"]')];
  if (!filas.length) return null;
  return filas.map(f => [...f.querySelectorAll('[role="gridcell"],[role="cell"],[role="columnheader"]')]
    .map(c => (c.innerText || "").replace(/\\s+/g, " ").trim()));
})()`;

const HAY_FILAS = `(() => {
  const f = document.querySelectorAll('[role="row"]');
  if (f.length < 2) return false;
  return [...f].some(r => /\\d{4}-\\d{2}-\\d{2}/.test(r.innerText || ""));
})()`;

const PIDE_LOGIN = `/login|checkpoint/.test(location.href) ||
  !!document.querySelector('input[name="pass"]')`;

const aNumero = (s) => {
  if (!s) return null;
  const t = String(s).replace(/[^\d.,-]/g, "").replace(/,/g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

/* De la matriz de celdas saca las filas con fecha. El orden de columnas
   es el del preset "Rendimiento y clics"; se localiza por forma, no por
   índice fijo, porque Meta mueve las columnas entre vistas. */
export function parsearFilas(tabla) {
  const salida = [];
  let campanaActual = null;

  for (const celdas of tabla) {
    const texto = celdas.join(" | ");
    const fecha = celdas.find((c) => /^\d{4}-\d{2}-\d{2}$/.test(c));

    if (!fecha) {
      const nom = celdas.find((c) => /^Publicación:|^Campaña/.test(c));
      if (nom) campanaActual = nom;
      continue;
    }
    /* Números de la fila, en el orden en el que aparecen:
       conversaciones, alcance, frecuencia, costo, gasto. */
    const nums = celdas
      .filter((c) => c !== fecha && /\d/.test(c) && !/tras clic|conversion|Todas las/i.test(c))
      .map((c) => ({ txt: c, val: aNumero(c), money: c.includes("$"), pct: c.includes("%") }));

    const simples = nums.filter((n) => !n.money && !n.pct && n.val != null);
    const dinero = nums.filter((n) => n.money && n.val != null);
    if (simples.length < 2 || !dinero.length) continue;

    salida.push({
      fecha,
      campana_texto: campanaActual,
      conv: simples[0].val,
      alcance: simples[1].val,
      frec: simples[2]?.val ?? null,
      costo: dinero[0]?.val ?? null,
      gasto: dinero[dinero.length - 1]?.val ?? null,
      _crudo: texto
    });
  }
  return salida;
}

/* ---------------- flujo principal ---------------- */
export async function traer({ desde, hasta, visible = true, log = console.log } = {}) {
  const { DATOS } = await leerDatos();
  const falta = queFalta(DATOS);

  if (!desde && falta.al_dia) {
    return { al_dia: true, mensaje: `Ya está al día: el último día cargado es el ${falta.ultimo_cargado} y Meta todavía no reporta nada más nuevo.`, agregados: [] };
  }
  desde = desde || falta.desde;
  hasta = hasta || falta.hasta;

  log(`Faltan ${falta.dias.length || "?"} día(s): ${desde} → ${hasta}`);
  await abrirChrome({ perfil: PERFIL, visible, url: "about:blank" });
  const p = await Pestana.abrir();

  try {
    await p.ir(url(desde, hasta));
    await dormir(4000);

    if (await p.evaluar(PIDE_LOGIN)) {
      return { necesita_login: true, mensaje: "El Chrome de la app no tiene sesión en Facebook. Ábrelo con el botón de iniciar sesión, entra a tu cuenta y vuelve a intentar." };
    }

    const cargo = await p.esperarA(HAY_FILAS, { intentos: 40, cada: 1500 });
    if (!cargo) {
      return { error: "La tabla de Meta no terminó de cargar. Suele pasar con rangos largos: intenta con menos días." };
    }

    const tabla = await p.evaluar(LEER_TABLA);
    const filas = parsearFilas(tabla || []);
    log(`Leí ${filas.length} fila(s) con fecha.`);

    /* Sólo se guardan los días que no estaban. Emparejar la campaña
       por nombre no sirve —hay tres con el mismo— así que se usa la
       campaña activa cuando el nombre no desambigua. */
    const yaHay = new Set(DATOS.dias.map((d) => d.fecha + "|" + d.campana));
    const activa = DATOS.campanas.find((c) => c.estado === "Activa");
    const agregados = [];
    const ambiguas = [];

    for (const f of filas) {
      if (f.fecha < desde || f.fecha > hasta) continue;
      const candidatas = DATOS.campanas.filter(
        (c) => f.campana_texto && f.campana_texto.includes(c.nombre)
      );
      const camp = candidatas.length === 1 ? candidatas[0]
                 : candidatas.find((c) => c.estado === "Activa") || (candidatas.length ? null : activa);
      if (!camp) { ambiguas.push(f); continue; }
      const clave = f.fecha + "|" + camp.id;
      if (yaHay.has(clave)) continue;

      const inicio = camp.inicio || f.fecha;
      const fila = {
        fecha: f.fecha,
        campana: camp.id,
        dia_ciclo: Math.round((dePuntoIso(f.fecha) - dePuntoIso(inicio)) / dia) + 1,
        conv: f.conv,
        alcance: f.alcance,
        frec: f.frec,
        gasto: f.gasto
      };
      DATOS.dias.push(fila);
      yaHay.add(clave);
      agregados.push(fila);
    }

    if (agregados.length) {
      DATOS.dias.sort((a, b) =>
        a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.campana < b.campana ? -1 : 1);
      DATOS.meta.ultimo_dia_con_datos = DATOS.dias[DATOS.dias.length - 1].fecha;
      DATOS.meta.actualizado = iso(new Date());

      /* Los totales de la campaña se rehacen sumando sus días, para que
         la ficha no quede contando un ciclo viejo. */
      for (const c of DATOS.campanas) {
        const suyos = DATOS.dias.filter((d) => d.campana === c.id);
        if (!suyos.length || c.desglose_diario !== true) continue;
        c.conv = suyos.reduce((a, b) => a + b.conv, 0);
        c.gasto = Math.round(suyos.reduce((a, b) => a + b.gasto, 0) * 100) / 100;
        c.costo_conv = c.conv ? Math.round((c.gasto / c.conv) * 100) / 100 : null;
      }
      await guardar(DATOS);
    }

    return {
      agregados,
      ambiguas: ambiguas.map((a) => a.fecha + " · " + (a.campana_texto || "sin campaña")),
      mensaje: agregados.length
        ? `Agregué ${agregados.length} registro(s): ${[...new Set(agregados.map((a) => a.fecha))].join(", ")}.`
        : "Meta no reportó días nuevos en ese rango."
    };
  } finally {
    p.cerrar();
  }
}

async function guardar(DATOS) {
  const cab = `/* ============================================================
   Auditoría de Pautas — Aceptados: Exámenes de Admisión

   Actualizado por scripts/traer.mjs el ${new Date().toISOString()}

   Las secciones curadas a mano (umbrales, aprendizajes, checklist,
   pendientes, pagina, huecos) se preservan entre corridas.
   ============================================================ */

window.DATOS = `;
  await writeFile(ARCHIVO, cab + JSON.stringify(DATOS, null, 2) + ";\n", "utf8");
}

export async function abrirParaLogin() {
  await abrirChrome({ perfil: PERFIL, visible: true, url: "https://www.facebook.com/login" });
  const p = await Pestana.abrir();
  await p.ir("https://www.facebook.com/login");
  p.cerrar();
  return { mensaje: "Abrí el Chrome de la app en la página de Facebook. Inicia sesión ahí y deja la ventana abierta." };
}

/* ---------------- línea de comandos ---------------- */
if (process.argv[1] && process.argv[1].endsWith("traer.mjs")) {
  const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
  if (process.argv.includes("--que-falta")) {
    const { DATOS } = await leerDatos();
    console.log(JSON.stringify(queFalta(DATOS), null, 2));
  } else if (process.argv.includes("--login")) {
    console.log((await abrirParaLogin()).mensaje);
  } else {
    const r = await traer({ desde: arg("--desde"), hasta: arg("--hasta") });
    console.log(r.mensaje || r.error);
    if (r.ambiguas?.length) console.log("Sin poder asignar campaña:", r.ambiguas);
  }
}
