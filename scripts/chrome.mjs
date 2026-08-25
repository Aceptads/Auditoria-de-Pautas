/* ============================================================
   Cliente mínimo del protocolo de Chrome (CDP), sin dependencias.

   Lanza un Chrome con perfil propio —separado del de siempre, para
   no pelearse con la ventana que ya está abierta— y permite navegar
   y leer el DOM. La sesión de Facebook vive en ese perfil: se inicia
   a mano una vez y queda guardada.
   ============================================================ */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PUERTO_CDP = Number(process.env.PUERTO_CDP || 9333);

const RUTAS_CHROME = [
  process.env.CHROME_BIN,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium"
].filter(Boolean);

export function rutaChrome() {
  const r = RUTAS_CHROME.find((p) => existsSync(p));
  if (!r) throw new Error("No encontré Chrome. Define CHROME_BIN con la ruta al ejecutable.");
  return r;
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedir(ruta) {
  const r = await fetch(`http://127.0.0.1:${PUERTO_CDP}${ruta}`);
  if (!r.ok) throw new Error(`CDP ${ruta} respondió ${r.status}`);
  return r.json();
}

/* ¿Ya hay un Chrome de automatización escuchando? */
export async function vivo() {
  try {
    await pedir("/json/version");
    return true;
  } catch {
    return false;
  }
}

/* Lanza el Chrome dedicado si no está corriendo. `visible` en false
   sólo lo manda al fondo: headless de verdad hace que Facebook pida
   verificación cada vez. */
export async function abrirChrome({ perfil, visible = true, url = "about:blank" } = {}) {
  if (await vivo()) return { yaEstaba: true };

  mkdirSync(perfil, { recursive: true });
  const args = [
    `--remote-debugging-port=${PUERTO_CDP}`,
    `--user-data-dir=${perfil}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-features=Translate,OptimizationHints",
    "--remote-allow-origins=*"
  ];
  if (!visible) args.push("--window-position=-32000,-32000");
  args.push(url);

  const p = spawn(rutaChrome(), args, { detached: true, stdio: "ignore" });
  p.unref();

  for (let i = 0; i < 60; i++) {
    if (await vivo()) return { yaEstaba: false };
    await dormir(500);
  }
  throw new Error("Chrome no levantó el puerto de depuración en 30 segundos.");
}

/* Una pestaña con la que se puede hablar. */
export class Pestana {
  constructor(ws) { this.ws = ws; this.n = 0; this.pendientes = new Map(); }

  static async abrir() {
    const lista = await pedir("/json/list");
    let pagina = lista.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    if (!pagina) {
      /* /json/new sólo acepta PUT en Chrome moderno. */
      const r = await fetch(`http://127.0.0.1:${PUERTO_CDP}/json/new?about:blank`, { method: "PUT" });
      pagina = await r.json();
    }
    const ws = new WebSocket(pagina.webSocketDebuggerUrl);
    await new Promise((ok, mal) => {
      ws.addEventListener("open", ok, { once: true });
      ws.addEventListener("error", () => mal(new Error("No me pude conectar a la pestaña.")), { once: true });
    });
    const t = new Pestana(ws);
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      const p = t.pendientes.get(m.id);
      if (!p) return;
      t.pendientes.delete(m.id);
      m.error ? p.mal(new Error(m.error.message)) : p.ok(m.result);
    });
    await t.enviar("Page.enable");
    await t.enviar("Runtime.enable");
    return t;
  }

  enviar(method, params = {}) {
    const id = ++this.n;
    return new Promise((ok, mal) => {
      this.pendientes.set(id, { ok, mal });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pendientes.delete(id)) mal(new Error(`${method} no respondió en 60 s`));
      }, 60000);
    });
  }

  async ir(url) {
    await this.enviar("Page.navigate", { url });
    await dormir(1500);
  }

  async evaluar(expresion) {
    const r = await this.enviar("Runtime.evaluate", {
      expression: expresion,
      returnByValue: true,
      awaitPromise: true
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || "Error evaluando en la página");
    return r.result?.value;
  }

  get url() { return this.evaluar("location.href"); }

  /* Meta pinta la tabla en varias pasadas: se reintenta hasta que la
     condición se cumple en vez de dormir un rato fijo y cruzar los dedos. */
  async esperarA(condicion, { intentos = 40, cada = 1500 } = {}) {
    for (let i = 0; i < intentos; i++) {
      try { if (await this.evaluar(condicion)) return true; } catch {}
      await dormir(cada);
    }
    return false;
  }

  cerrar() { try { this.ws.close(); } catch {} }
}

export { dormir, PUERTO_CDP };
