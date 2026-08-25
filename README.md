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

Abrir `index.html` con doble clic. No necesita servidor ni instalar nada.
Publicado también en GitHub Pages (Settings → Pages → rama `main`, carpeta raíz).

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
index.html                        la app entera, sin dependencias
data/pautas.js                    todos los datos y umbrales
scripts/actualizar.mjs            trae los datos de la Graph API
.github/workflows/actualizar.yml  lo corre diario a las 3 p.m.
```
