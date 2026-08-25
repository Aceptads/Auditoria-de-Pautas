/* ============================================================
   Servidor local de Auditoría de Pautas.

   Sirve la app y conecta el botón "Analizar" con Claude Code que
   ya está instalado en esta máquina — no usa API key ni token:
   invoca el CLI `claude -p`, igual que una sesión normal.

   Escucha sólo en 127.0.0.1: no queda expuesto en la red.

   Arrancar:  node servidor.mjs          (o doble clic en iniciar.cmd)
   ============================================================ */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, extname } from "node:path";
import { randomUUID } from "node:crypto";
import { traer, queFalta, leerDatos, abrirParaLogin } from "./scripts/traer.mjs";

const RAIZ = dirname(fileURLToPath(import.meta.url));
const PUERTO = Number(process.env.PUERTO || 4321);
const MODELO = process.env.MODELO || "claude-opus-5";
const MEMORIA = join(RAIZ, "data", "memoria.json");
const PROMPT = join(RAIZ, "analisis", "prompt.md");
const DATOS = join(RAIZ, "data", "pautas.js");

/* En Windows el `claude` del PATH es un .cmd que sólo llama al .exe.
   Apuntarle al binario evita tener que lanzar todo dentro de un shell. */
function resolverClaude() {
  if (process.env.CLAUDE_BIN) return { cmd: process.env.CLAUDE_BIN, shell: false };
  if (process.platform === "win32") {
    const exe = join(
      process.env.APPDATA || "",
      "npm/node_modules/@anthropic-ai/claude-code/bin/claude.exe"
    );
    if (existsSync(exe)) return { cmd: exe, shell: false };
    return { cmd: "claude.cmd", shell: true };
  }
  return { cmd: "claude", shell: false };
}
const CLAUDE = resolverClaude();

/* Trabajos en curso. Se consultan por polling: un análisis tarda
   entre 30 s y 3 min y un fetch abierto todo ese rato se cae solo. */
const trabajos = new Map();

/* ---------------- memoria ---------------- */
async function leerMemoria() {
  try {
    return JSON.parse(await readFile(MEMORIA, "utf8"));
  } catch {
    return { analisis: [], notas: [] };
  }
}
async function guardarMemoria(m) {
  await writeFile(MEMORIA, JSON.stringify(m, null, 2), "utf8");
}

/* Para el prompt sólo van los análisis anteriores en versión corta:
   mandar el histórico completo lo hace crecer sin aportar nada. */
function resumirParaPrompt(m) {
  const ult = m.analisis.slice(-4).map((a) => ({
    fecha: a.fecha,
    hasta: a.datos_hasta,
    titular: a.resultado?.titular,
    estado: a.resultado?.estado,
    hallazgos: (a.resultado?.hallazgos || []).map((h) => h.titulo),
    acciones: (a.resultado?.acciones || []).map((x) => x.que)
  }));
  const notas = m.notas.slice(-10);
  return JSON.stringify({ analisis_previos: ult, notas_de_eder: notas }, null, 2);
}

/* ---------------- invocar a Claude ---------------- */
function correrClaude(prompt) {
  return new Promise((resolve, reject) => {
    const args = ["-p", "--model", MODELO, "--output-format", "json"];
    const p = spawn(CLAUDE.cmd, args, { cwd: RAIZ, shell: CLAUDE.shell, windowsHide: true });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", (e) =>
      reject(new Error(
        `No se pudo ejecutar "${CLAUDE.cmd}": ${e.message}\n` +
        `Revisa que Claude Code esté instalado (claude --version), ` +
        `o define CLAUDE_BIN con la ruta al ejecutable.`
      ))
    );
    p.on("close", (code) => {
      if (code !== 0) return reject(new Error(err.trim() || `claude terminó con código ${code}`));
      try {
        resolve(JSON.parse(out));
      } catch {
        reject(new Error("La respuesta de claude no vino en JSON:\n" + out.slice(0, 600)));
      }
    });
    p.stdin.write(prompt, "utf8");
    p.stdin.end();
  });
}

/* El modelo a veces envuelve el JSON en ```json … ``` o le antepone una
   línea. Se rescata el objeto más externo antes de rendirse. */
function extraerJSON(texto) {
  const limpio = texto.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try { return JSON.parse(limpio); } catch {}
  const i = limpio.indexOf("{"), f = limpio.lastIndexOf("}");
  if (i > -1 && f > i) {
    try { return JSON.parse(limpio.slice(i, f + 1)); } catch {}
  }
  return null;
}

async function analizar(pregunta) {
  const [plantilla, datos, memoria] = await Promise.all([
    readFile(PROMPT, "utf8"),
    readFile(DATOS, "utf8"),
    leerMemoria()
  ]);

  /* Sólo la parte de instrucciones: lo de arriba del separador es
     documentación del archivo, no va al modelo. */
  const cuerpo = plantilla.includes("\n---\n")
    ? plantilla.split("\n---\n").slice(1).join("\n---\n")
    : plantilla;

  /* El reemplazo va como función: si se pasara el texto directo, un "$&"
     o un "$'" dentro de los datos se expandiría en vez de copiarse. */
  const meter = (t, marca, valor) => t.replace(marca, () => valor);
  /* Fecha local, no UTC: de noche en México ya es el día siguiente en
     UTC y el análisis creería que la campaña lleva un día más. */
  const d = new Date();
  const hoy = new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  let prompt = meter(cuerpo, "{{DATOS}}", datos);
  prompt = meter(prompt, "{{MEMORIA}}", resumirParaPrompt(memoria));
  prompt = meter(prompt, "{{PREGUNTA}}", pregunta?.trim() || "Ninguna: haz la revisión general.");
  prompt = meter(prompt, "{{FECHA}}", hoy);

  const r = await correrClaude(prompt);
  if (r.is_error) throw new Error(r.result || "Claude devolvió un error.");

  const resultado = extraerJSON(r.result || "");
  if (!resultado) throw new Error("No se pudo leer el JSON del análisis:\n" + (r.result || "").slice(0, 600));

  /* Fecha del último día con datos, para saber sobre qué se analizó. */
  const m = datos.match(/ultimo_dia_con_datos:\s*"([^"]+)"/);

  const registro = {
    id: randomUUID(),
    fecha: new Date().toISOString(),
    datos_hasta: m ? m[1] : null,
    pregunta: pregunta?.trim() || null,
    modelo: MODELO,
    costo_usd: r.total_cost_usd ?? null,
    duracion_ms: r.duration_ms ?? null,
    resultado
  };

  memoria.analisis.push(registro);
  await guardarMemoria(memoria);
  return registro;
}

/* ---------------- HTTP ---------------- */
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml"
};

function json(res, code, obj) {
  const b = Buffer.from(JSON.stringify(obj), "utf8");
  res.writeHead(code, { "content-type": TIPOS[".json"], "content-length": b.length });
  res.end(b);
}
function leerCuerpo(req) {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => { try { resolve(JSON.parse(d || "{}")); } catch { resolve({}); } });
  });
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const ruta = decodeURIComponent(url.pathname);

  try {
    /* ---- API ---- */
    if (ruta === "/api/estado") {
      return json(res, 200, { ok: true, modelo: MODELO, local: true });
    }

    if (ruta === "/api/analizar" && req.method === "POST") {
      const { pregunta } = await leerCuerpo(req);
      const id = randomUUID();
      trabajos.set(id, { estado: "corriendo", desde: Date.now() });
      analizar(pregunta)
        .then((r) => trabajos.set(id, { estado: "listo", registro: r }))
        .catch((e) => trabajos.set(id, { estado: "error", error: e.message }));
      return json(res, 202, { id });
    }

    if (ruta.startsWith("/api/analizar/")) {
      const t = trabajos.get(ruta.slice("/api/analizar/".length));
      if (!t) return json(res, 404, { error: "Ese análisis ya no está en memoria." });
      return json(res, 200, t);
    }

    /* ---- traer datos de Meta ---- */
    if (ruta === "/api/pendiente") {
      const { DATOS } = await leerDatos();
      return json(res, 200, queFalta(DATOS));
    }

    if (ruta === "/api/actualizar" && req.method === "POST") {
      const { desde, hasta } = await leerCuerpo(req);
      const id = randomUUID();
      const pasos = [];
      trabajos.set(id, { estado: "corriendo", pasos });
      traer({ desde, hasta, log: (m) => { pasos.push(m); trabajos.get(id).pasos = [...pasos]; } })
        .then((r) => trabajos.set(id, { estado: "listo", resultado: r, pasos }))
        .catch((e) => trabajos.set(id, { estado: "error", error: e.message, pasos }));
      return json(res, 202, { id });
    }

    if (ruta.startsWith("/api/actualizar/")) {
      const t = trabajos.get(ruta.slice("/api/actualizar/".length));
      if (!t) return json(res, 404, { error: "Ese trabajo ya no está en memoria." });
      return json(res, 200, t);
    }

    if (ruta === "/api/login" && req.method === "POST") {
      return json(res, 200, await abrirParaLogin());
    }

    if (ruta === "/api/memoria" && req.method === "GET") {
      return json(res, 200, await leerMemoria());
    }

    /* Notas que escribe Eder: contexto que los datos no traen
       (qué creativo se subió, qué se cambió, qué pasó ese día). */
    if (ruta === "/api/nota" && req.method === "POST") {
      const { texto } = await leerCuerpo(req);
      if (!texto?.trim()) return json(res, 400, { error: "Nota vacía." });
      const m = await leerMemoria();
      const nota = { id: randomUUID(), fecha: new Date().toISOString(), texto: texto.trim() };
      m.notas.push(nota);
      await guardarMemoria(m);
      return json(res, 200, nota);
    }

    if (ruta.startsWith("/api/borrar/") && req.method === "POST") {
      const id = ruta.slice("/api/borrar/".length);
      const m = await leerMemoria();
      m.analisis = m.analisis.filter((a) => a.id !== id);
      m.notas = m.notas.filter((n) => n.id !== id);
      await guardarMemoria(m);
      return json(res, 200, { ok: true });
    }

    /* ---- estáticos ---- */
    let archivo = normalize(join(RAIZ, ruta === "/" ? "index.html" : ruta));
    if (!archivo.startsWith(RAIZ)) { res.writeHead(403); return res.end("No"); }
    const info = await stat(archivo).catch(() => null);
    if (!info?.isFile()) { res.writeHead(404); return res.end("No encontrado"); }
    const buf = await readFile(archivo);
    res.writeHead(200, {
      "content-type": TIPOS[extname(archivo)] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(buf);
  } catch (e) {
    json(res, 500, { error: e.message });
  }
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  console.log(`\n  Auditoría de Pautas`);
  console.log(`  http://localhost:${PUERTO}`);
  console.log(`  Analizando con ${MODELO} vía Claude Code local.\n`);
  console.log(`  Ctrl+C para detener.\n`);
});
