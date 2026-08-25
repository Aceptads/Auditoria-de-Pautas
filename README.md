# Auditoría de Pautas — Aceptados

Tablero para revisar día con día la publicidad de **Aceptados: Exámenes de Admisión** en Meta Ads
(cuenta `229885267550030`).

No es un reporte: es una herramienta de decisión. Cada gráfico responde una pregunta concreta que
ya nos hicimos al menos una vez.

## Qué contesta

| Sección | Pregunta |
|---|---|
| **Hoy** | ¿Corto la campaña o la dejo un día más? |
| **Curva del ciclo** | ¿Dónde muere cada anuncio? |
| **Línea de tiempo** | ¿Sigue saliendo dinero sin comprar nada? |
| **Comparar ciclos** | ¿Vamos mejorando o empeorando? |
| **Patrones** | ¿Fue el día de la semana o se agotó el creativo? |
| **Día a día** | El dato crudo, sin interpretación |
| **Aprendizajes** | Lo que ya no hay que volver a descubrir |
| **Revisión** | La lista de antes de publicar |
| **Orgánico** | Lo que no se evapora al apagar la pauta |

## Cómo se ve

Doble clic en **`iniciar.cmd`**. Levanta el servidor local y abre http://localhost:4321.

También se puede abrir `index.html` directo, o entrar a
[la versión publicada](https://aceptads.github.io/Auditoria-de-Pautas/) — pero en esos dos casos
la pestaña **Analizar** no funciona, porque necesita el servidor.

## El botón Actualizar datos

Trae de Meta **sólo los días que faltan**. Antes de abrir nada compara el último día cargado
contra ayer —Meta nunca reporta el día en curso— y si ya está al día no hace absolutamente nada:
el trabajo más barato es el que no se hace. Los huecos viejos aparecen como enlaces; cada uno se
pide con un clic.

Usa un **Chrome aparte**, con su propio perfil en `.chrome-perfil/`, manejado por el protocolo de
depuración. No toca el Chrome de siempre ni pelea con la ventana que ya tengas abierta.

### Antes de la primera vez: iniciar sesión

Ese Chrome empieza sin sesión. La primera vez el botón te lo dirá y aparecerá **Iniciar sesión en
Facebook**: se abre la ventana, entras a tu cuenta ahí, y la cookie queda guardada en ese perfil.
Se hace una sola vez, y sólo hay que repetirlo si Facebook cierra la sesión.

> `.chrome-perfil/` está en `.gitignore`. Lleva las cookies de tu sesión y este repositorio es
> público: **nunca** debe subirse.

### Qué escribe

Agrega los renglones nuevos a `dias`, recalcula los totales de las campañas que tienen desglose
diario, y mueve `meta.ultimo_dia_con_datos`. Lo curado a mano no lo toca.

No sobrescribe días que ya estén cargados, así que apretarlo de más es inofensivo.

Si una fila no se puede asignar a una campaña sin ambigüedad —hay tres campañas con el mismo
nombre— la reporta en vez de adivinar.

También corre desde la terminal:

```bash
node scripts/traer.mjs                                  # lo que falte
node scripts/traer.mjs --que-falta                      # sólo dice qué falta
node scripts/traer.mjs --desde 2026-08-21 --hasta 2026-08-21
node scripts/traer.mjs --login                          # abre Chrome para iniciar sesión
```

Con rangos largos la tabla de Meta a veces no termina de renderizar. Si pasa, se pide en tramos
de tres a seis días.

## La pestaña Analizar

Manda todos los datos de la app a **Claude Opus 5** y devuelve hallazgos, acciones y preguntas
abiertas. No usa API key ni token: invoca el `claude` que ya está instalado en la máquina, o sea
la misma suscripción de Claude Code de siempre.

```
[navegador] → servidor.mjs → claude -p --model claude-opus-5 → data/memoria.json
```

Cada análisis tarda entre 30 s y 3 min y cuesta unos centavos de dólar (la app muestra cuánto).

### La memoria

`data/memoria.json` guarda **todo**: cada análisis completo con su fecha, hasta qué día tenía datos,
la pregunta que se hizo y cuánto costó. En la siguiente corrida, Claude recibe los últimos cuatro
como contexto, así que puede decir qué cambió, si lo que predijo se cumplió y corregirse cuando un
hallazgo viejo ya no se sostiene.

También guarda **notas**: contexto que los números no traen — qué imagen se subió, qué se cambió en
la configuración, qué pasó ese día. Se escriben desde la misma pestaña y Claude las lee. Sin eso,
un día malo es sólo un número; con eso, es un número con causa.

### Cambiar cómo analiza

El prompt vive en **`analisis/prompt.md`** y es texto plano. Se edita y la siguiente corrida ya usa
la versión nueva — no hay que reiniciar el servidor. Ahí están las reglas de análisis (comparar
siempre contra algo, separar causas, decir cuándo no se puede saber) y el formato de salida.

Para cambiar de modelo: `set MODELO=claude-sonnet-5 && node servidor.mjs`.
Para cambiar de puerto: `set PUERTO=5000`.

## Cómo se actualiza

Toda la información vive en **`data/pautas.js`**. La app no guarda nada más: semáforos, alertas,
gráficos, promedios y patrones se recalculan solos a partir de ese archivo.

Para cargar un día nuevo se agrega un renglón al arreglo `dias`:

```js
{ fecha: "2026-08-24", campana: "UAEH-C3", dia_ciclo: 3, conv: 9, alcance: 4100,
  frec: 1.41, gasto: 128.40, clics: 30, cpc: 4.28, ctr: 0.52, clics_todos: 110, ctr_todos: 1.9 },
```

Los campos `conv`, `alcance`, `frec` y `gasto` son obligatorios; los de clics son opcionales.
`impresiones` y `clic→chat` **no se escriben**: se derivan (`alcance × frecuencia` y `conv ÷ clics`).

Y se actualiza el total de la campaña en `campanas` más `meta.ultimo_dia_con_datos`.

### De dónde salen los números

Administrador de Anuncios → **Desglose: Día** → columnas *Rendimiento y clics*. La URL directa,
con el orden que hace que las campañas con gasto queden hasta arriba:

```
https://adsmanager.facebook.com/adsmanager/manage/campaigns
  ?act=229885267550030
  &column_preset=PERFORMANCE_LEGACY
  &date=2026-08-22_2026-08-25
  &time_breakdown=days_1
  &sort=spend~0
```

Rangos cortos (3–6 días). Con rangos largos la tabla no termina de renderizar.

> **Meta nunca reporta el día en curso.** Aunque se pida un rango que incluya hoy, la tabla llega
> hasta ayer. Un dato de "hoy" no existe.

## Umbrales

Están en `data/pautas.js` → `umbrales`. Cambiar uno recalcula toda la app.

| Umbral | Valor | De dónde salió |
|---|---|---|
| Costo por conversación bueno | $6.00 | El Ciclo A cerró en $6.01, el mejor hasta ahora |
| Costo de alerta | $8.00 | Por encima de aquí el ciclo se cortó tarde |
| CTR mínimo | 0.80% | Debajo de esto el anuncio dejó de enganchar en los tres ciclos |
| Clic → chat sano | 35% | Los días buenos van de 42% a 61% |
| Clic → chat crítico | 20% | Dos días seguidos debajo = apagar |
| Frecuencia de agotamiento | 1.9 | Los ciclos 0, A y B murieron en 2.10, 2.02 y 1.90 |
| Vida útil | 4 días | Días 1–3 a $4.25; días 4–5 a $13.33 |

## Actualización automática — pendiente de activar

Está escrito y listo: `.github/workflows/actualizar.yml` corre todos los días a las **3:00 p.m.**
hora de la Ciudad de México (21:00 UTC), llama a la Graph API, actualiza `data/pautas.js` y hace push.
Sólo toca `campanas` y `dias`; lo curado a mano se preserva.

Faltan dos cosas y ninguna la puedo hacer yo:

**1. El token de acceso.** En [developers.facebook.com](https://developers.facebook.com/tools/explorer/)
generar un token con permisos `ads_read` y `business_management`, convertirlo a token de larga duración
(60 días) y guardarlo en el repo como secreto `META_TOKEN`:

```
gh secret set META_TOKEN --body "EAA..."
```

> El `--body` va explícito. Pasarlo por pipe en PowerShell le mete un BOM y corrompe el valor.

**2. El `meta_id` de cada campaña.** El script sólo actualiza campañas que ya estén dadas de alta,
porque la clasificación por ciclo y universidad es manual: hay tres campañas distintas con el nombre
*«¡NO TE QUEDES FUERA! ¡COMIENZA A PREPARARTE!»* y sólo el ID las distingue. La primera corrida
imprime los IDs de las campañas con gasto que aún no están registradas; se copian a `campanas`:

```js
{ id:"UAEH-C3", meta_id:"120212…", uni:"UAEH", ciclo:"Ciclo C", inicio:"2026-08-22", … }
```

Probar antes de dejarlo solo:

```bash
gh workflow run "Actualizar pautas" -f desde=2026-08-20
```

Mientras tanto la carga es manual, como se describe arriba.

## Estructura

```
iniciar.cmd                       doble clic: levanta todo
index.html                        la app entera, sin dependencias
servidor.mjs                      sirve la app, trae datos y conecta con Claude Code
analisis/prompt.md                cómo analiza — editable
data/pautas.js                    todos los datos y umbrales
data/memoria.json                 análisis guardados y notas
scripts/traer.mjs                 saca de Meta sólo los días que faltan
scripts/chrome.mjs                cliente del protocolo de Chrome, sin dependencias
scripts/actualizar.mjs            alternativa por Graph API, si algún día hay token
.github/workflows/actualizar.yml  lo correría diario a las 3 p.m.
```

Node sin dependencias, nada que instalar. El servidor escucha sólo en `127.0.0.1`.
