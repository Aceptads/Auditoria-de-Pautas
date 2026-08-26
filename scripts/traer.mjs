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

/* La tabla de Meta no marca sus filas con role="row" —sólo el encabezado
   lo hace; el cuerpo entero es role="presentation"—, así que no hay un
   selector con el que agarrar una fila. Lo que sí sale ordenado y
   completo es el innerText, y de ahí se parsea. */
const LEER_TEXTO = `document.body ? document.body.innerText : ""`;

const HAY_FILAS = `(() => {
  const t = document.body ? document.body.innerText : "";
  return /\\n\\d{4}-\\d{2}-\\d{2}\\n/.test(t);
})()`;

/* Facebook interrumpe de varias formas distintas, no sólo con el login:
   al entrar al Administrador desde un perfil nuevo pide reautenticar
   ("sensitive_action/reauth"), y a veces mete un checkpoint o un código.
   Cada una necesita que Eder actúe en la ventana, así que se distinguen
   para poder decirle exactamente qué le está pidiendo. */
const QUE_PIDE = `(() => {
  const u = location.href;
  if (/sensitive_action|reauth/.test(u)) return "reauth";
  if (/checkpoint/.test(u)) return "checkpoint";
  if (/two_step|login\\/device/.test(u)) return "codigo";
  if (/\\/login/.test(u) || document.querySelector('input[name="email"]')) return "login";
  return null;
})()`;

const EXPLICA = {
  login: "El Chrome de la app no tiene sesión en Facebook. Inicia sesión en esa ventana y vuelve a intentar.",
  reauth: "Facebook está pidiendo que confirmes tu contraseña para entrar al Administrador de Anuncios: es el paso extra que pide la primera vez desde un navegador nuevo. Complétalo en la ventana que se abrió y vuelve a intentar.",
  checkpoint: "Facebook puso un punto de verificación en la cuenta. Resuélvelo en la ventana que se abrió y vuelve a intentar.",
  codigo: "Facebook está pidiendo el código de verificación en dos pasos. Métele el código en la ventana que se abrió y vuelve a intentar."
};

const money = (v) => (v == null ? "—" : "$" + v.toFixed(2));

const aNumero = (s) => {
  if (!s) return null;
  const t = String(s).replace(/[^\d.,-]/g, "").replace(/,/g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

/* Cada fila de día en el innerText tiene siempre la misma forma:

     2026-08-22
     7 días tras clic o 1 días tras visualización     <- o "-"
     Todas las conversiones
     4          <- conversaciones ("—" cuando son cero)
     2,319      <- alcance
     1.20       <- frecuencia
     $15.22     <- costo por conversación ("—" si no hubo)
     $60.86     <- gasto

   El ancla es "Todas las conversiones": después vienen exactamente
   cinco valores, en ese orden. Las líneas de campaña se reconocen
   por empezar con «Publicación:» y traen su estado en la siguiente,
   lo que sirve para desambiguar campañas del mismo nombre. */
export function parsearFilas(texto) {
  const lin = String(texto || "").split("\n").map((l) => l.trim());
  const salida = [];
  let campana = null, estado = null;

  for (let i = 0; i < lin.length; i++) {
    if (/^(Publicación:|Campaña de)/.test(lin[i])) {
      campana = lin[i];
      estado = lin[i + 1] || null;
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lin[i])) continue;

    const anclaIdx = lin.indexOf("Todas las conversiones", i);
    if (anclaIdx === -1 || anclaIdx > i + 3) continue;
    const v = lin.slice(anclaIdx + 1, anclaIdx + 6);
    if (v.length < 5) continue;

    const gasto = aNumero(v[4]);
    if (gasto == null) continue;

    salida.push({
      fecha: lin[i],
      campana_texto: campana,
      estado_texto: estado,
      conv: aNumero(v[0]) ?? 0,
      alcance: aNumero(v[1]),
      frec: aNumero(v[2]),
      costo: aNumero(v[3]),
      gasto
    });
    i = anclaIdx + 5;
  }
  return salida;
}

/* Tres campañas comparten el nombre «¡NO TE QUEDES FUERA! ¡COMIENZA A
   PREPARARTE!», así que el nombre no basta. Lo que sí distingue es la
   fecha: cada campaña tiene su ventana y no se traslapan. */
function asignarCampana(fila, campanas) {
  const porNombre = campanas.filter(
    (c) => fila.campana_texto && fila.campana_texto.includes(c.nombre)
  );
  if (porNombre.length === 1) return porNombre[0];
  if (!porNombre.length) return null;

  const dentro = porNombre.filter(
    (c) => c.inicio && fila.fecha >= c.inicio && (!c.fin || fila.fecha <= c.fin)
  );
  if (dentro.length === 1) return dentro[0];

  /* Última red: una campaña abierta (sin fecha de fin) que ya empezó. */
  const abiertas = porNombre.filter((c) => c.inicio && !c.fin && fila.fecha >= c.inicio);
  return abiertas.length === 1 ? abiertas[0] : null;
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

    const pide = await p.evaluar(QUE_PIDE);
    if (pide) return { necesita_login: true, pide, mensaje: EXPLICA[pide] };

    const cargo = await p.esperarA(HAY_FILAS, { intentos: 40, cada: 1500 });
    if (!cargo) {
      return { error: "La tabla de Meta no terminó de cargar. Suele pasar con rangos largos: intenta con menos días." };
    }

    const filas = parsearFilas(await p.evaluar(LEER_TEXTO));
    log(`Leí ${filas.length} fila(s) con fecha.`);

    /* Sólo se guardan los días que no estaban. */
    const yaHay = new Set(DATOS.dias.map((d) => d.fecha + "|" + d.campana));
    const agregados = [];
    const ambiguas = [];

    for (const f of filas) {
      if (f.fecha < desde || f.fecha > hasta) continue;
      const camp = asignarCampana(f, DATOS.campanas);
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
      /* Filas reales que no se pudieron atribuir: casi siempre una campaña
         nueva que todavía no está dada de alta en pautas.js. Se reportan
         en vez de adivinar a cuál pertenecen. */
      ambiguas: ambiguas.map(
        (a) => `${a.fecha} · ${a.campana_texto || "sin campaña"} (${a.estado_texto || "?"}) · ` +
               `${a.conv} conv, ${money(a.gasto)}`),
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
