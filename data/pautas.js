/* ============================================================
   Auditoría de Pautas — Aceptados: Exámenes de Admisión

   Actualizado por scripts/traer.mjs el 2026-08-26T01:28:11.469Z

   Las secciones curadas a mano (umbrales, aprendizajes, checklist,
   pendientes, pagina, huecos) se preservan entre corridas.
   ============================================================ */

window.DATOS = {
  "meta": {
    "negocio": "Aceptados: Exámenes de Admisión",
    "cuenta": "229885267550030",
    "pagina_asset_id": "422291290961768",
    "business_id": "424581000732797",
    "moneda": "MXN",
    "objetivo": "Conversaciones con mensajes iniciadas",
    "whatsapp": "+52 1 55 7646 6741",
    "actualizado": "2026-08-25",
    "ultimo_dia_con_datos": "2026-08-24",
    "nota_reporte": "Meta no reporta el día en curso: la tabla siempre llega hasta ayer. Un dato de 'hoy' nunca existe."
  },
  "umbrales": {
    "costo_conv_bueno": 6,
    "costo_conv_alerta": 8,
    "costo_conv_malo": 12,
    "ctr_minimo": 0.8,
    "clic_chat_bueno": 35,
    "clic_chat_critico": 20,
    "frecuencia_agotamiento": 1.9,
    "alcance_agotamiento": 20000,
    "vida_util_dias": 4
  },
  "campanas": [
    {
      "id": "UAEH-C0",
      "nombre": "¡COMIENZA A PREPARARTE!",
      "uni": "UAEH",
      "ciclo": "Ciclo 0",
      "inicio": "2026-07-30",
      "fin": "2026-08-07",
      "estado": "Completado",
      "presupuesto_diario": 100,
      "conv": 76,
      "alcance": 20200,
      "frecuencia": 2.1,
      "costo_conv": 10.52,
      "gasto": 799.55,
      "desglose_diario": false
    },
    {
      "id": "UACH-C0",
      "nombre": "¡NO DEJES PASAR MÁS TIEMPO! ¡COMIENZA A…",
      "uni": "UACH",
      "ciclo": "Ciclo 0",
      "inicio": "2026-07-30",
      "fin": "2026-08-07",
      "estado": "Completado",
      "presupuesto_diario": 100,
      "conv": 50,
      "alcance": null,
      "frecuencia": null,
      "costo_conv": 15.98,
      "gasto": 798.94,
      "desglose_diario": false
    },
    {
      "id": "UAEH-C1",
      "nombre": "¡NO TE QUEDES FUERA! ¡COMIENZA A PREPARARTE!",
      "uni": "UAEH",
      "ciclo": "Ciclo A",
      "inicio": "2026-08-11",
      "fin": "2026-08-16",
      "estado": "Desactivado",
      "presupuesto_diario": 100,
      "conv": 75,
      "alcance": 11535,
      "frecuencia": 2.02,
      "costo_conv": 6.01,
      "gasto": 450.96,
      "clics_enlace": 182,
      "cpc": 2.48,
      "ctr": 0.78,
      "clics_todos": 620,
      "ctr_todos": 2.66,
      "desglose_diario": true
    },
    {
      "id": "UACH-C1",
      "nombre": "¡NO DEJES PASAR MÁS TIEMPO!",
      "uni": "UACH",
      "ciclo": "Ciclo A",
      "inicio": "2026-08-11",
      "fin": "2026-08-16",
      "estado": "Desactivado",
      "presupuesto_diario": 100,
      "conv": 39,
      "alcance": 13774,
      "frecuencia": 1.77,
      "costo_conv": 11.69,
      "gasto": 456.02,
      "clics_enlace": 154,
      "cpc": 2.96,
      "ctr": 0.63,
      "clics_todos": 450,
      "ctr_todos": 1.84,
      "desglose_diario": true
    },
    {
      "id": "UAEH-C2",
      "nombre": "¡NO TE QUEDES FUERA! ¡COMIENZA A PREPARARTE!",
      "uni": "UAEH",
      "ciclo": "Ciclo B",
      "inicio": "2026-08-17",
      "fin": "2026-08-21",
      "estado": "Completado",
      "presupuesto_diario": 100,
      "conv": 55,
      "alcance": 10738,
      "frecuencia": 1.9,
      "costo_conv": 9.01,
      "gasto": 495.64,
      "desglose_diario": "parcial"
    },
    {
      "id": "UACH-C2",
      "nombre": "¡NO DEJES PASAR MÁS TIEMPO!",
      "uni": "UACH",
      "ciclo": "Ciclo B",
      "inicio": "2026-08-17",
      "fin": "2026-08-21",
      "estado": "Completado",
      "presupuesto_diario": 100,
      "conv": 32,
      "alcance": 11949,
      "frecuencia": 1.7,
      "costo_conv": 15.57,
      "gasto": 498.36,
      "desglose_diario": "parcial"
    },
    {
      "id": "UAEH-C3",
      "nombre": "¡NO TE QUEDES FUERA! ¡COMIENZA A PREPARARTE!",
      "uni": "UAEH",
      "ciclo": "Ciclo C",
      "inicio": "2026-08-22",
      "fin": null,
      "estado": "Activa",
      "presupuesto_diario": 130,
      "conv": 24,
      "alcance": 6880,
      "frecuencia": 1.47,
      "costo_conv": 15.06,
      "gasto": 361.45,
      "clics_enlace": 49,
      "cpc": 4.39,
      "ctr": 0.48,
      "clics_todos": 172,
      "ctr_todos": 1.7,
      "desglose_diario": true
    },
    {
      "id": "MIX-A",
      "nombre": "¡NO TE QUEDES FUERA! ¡SOMOS TU MEJOR OPCIÓN!",
      "uni": "Mixta",
      "ciclo": "Sin fechar",
      "inicio": null,
      "fin": null,
      "estado": "Desactivado",
      "presupuesto_diario": 100,
      "conv": 21,
      "alcance": 6529,
      "frecuencia": 1.44,
      "costo_conv": 10.21,
      "gasto": 214.36,
      "desglose_diario": false
    },
    {
      "id": "MIX-B",
      "nombre": "¡SOMOS TU MEJOR OPCIÓN!",
      "uni": "Mixta",
      "ciclo": "Sin fechar",
      "inicio": null,
      "fin": null,
      "estado": "Desactivado",
      "presupuesto_diario": 100,
      "conv": 18,
      "alcance": 5963,
      "frecuencia": 1.46,
      "costo_conv": 10.59,
      "gasto": 190.57,
      "desglose_diario": false
    }
  ],
  "dias": [
    {
      "fecha": "2026-08-11",
      "campana": "UACH-C1",
      "dia_ciclo": 1,
      "conv": 6,
      "alcance": 2982,
      "frec": 1.21,
      "gasto": 59.14
    },
    {
      "fecha": "2026-08-11",
      "campana": "UAEH-C1",
      "dia_ciclo": 1,
      "conv": 20,
      "alcance": 3316,
      "frec": 1.21,
      "gasto": 74.86,
      "clics": 47,
      "cpc": 1.59,
      "ctr": 1.17,
      "clics_todos": 127,
      "ctr_todos": 3.17
    },
    {
      "fecha": "2026-08-12",
      "campana": "UACH-C1",
      "dia_ciclo": 2,
      "conv": 9,
      "alcance": 4043,
      "frec": 1.27,
      "gasto": 96.64
    },
    {
      "fecha": "2026-08-12",
      "campana": "UAEH-C1",
      "dia_ciclo": 2,
      "conv": 25,
      "alcance": 3994,
      "frec": 1.35,
      "gasto": 101.84,
      "clics": 49,
      "cpc": 2.08,
      "ctr": 0.91,
      "clics_todos": 152,
      "ctr_todos": 2.81
    },
    {
      "fecha": "2026-08-13",
      "campana": "UACH-C1",
      "dia_ciclo": 3,
      "conv": 7,
      "alcance": 3580,
      "frec": 1.23,
      "gasto": 85.69
    },
    {
      "fecha": "2026-08-13",
      "campana": "UAEH-C1",
      "dia_ciclo": 3,
      "conv": 17,
      "alcance": 3131,
      "frec": 1.31,
      "gasto": 87.07,
      "clics": 28,
      "cpc": 3.11,
      "ctr": 0.68,
      "clics_todos": 117,
      "ctr_todos": 2.86
    },
    {
      "fecha": "2026-08-14",
      "campana": "UACH-C1",
      "dia_ciclo": 4,
      "conv": 9,
      "alcance": 4147,
      "frec": 1.17,
      "gasto": 93.52
    },
    {
      "fecha": "2026-08-14",
      "campana": "UAEH-C1",
      "dia_ciclo": 4,
      "conv": 11,
      "alcance": 3722,
      "frec": 1.25,
      "gasto": 82.71,
      "clics": 26,
      "cpc": 3.18,
      "ctr": 0.56,
      "clics_todos": 112,
      "ctr_todos": 2.41
    },
    {
      "fecha": "2026-08-15",
      "campana": "UACH-C1",
      "dia_ciclo": 5,
      "conv": 8,
      "alcance": 5200,
      "frec": 1.11,
      "gasto": 105.66
    },
    {
      "fecha": "2026-08-15",
      "campana": "UAEH-C1",
      "dia_ciclo": 5,
      "conv": 2,
      "alcance": 3823,
      "frec": 1.23,
      "gasto": 90.63,
      "clics": 29,
      "cpc": 3.13,
      "ctr": 0.62,
      "clics_todos": 94,
      "ctr_todos": 2
    },
    {
      "fecha": "2026-08-16",
      "campana": "UACH-C1",
      "dia_ciclo": 6,
      "conv": 0,
      "alcance": 286,
      "frec": null,
      "gasto": 15.37,
      "derivado": true,
      "nota": "Derivado: total del ciclo menos los días 11–15"
    },
    {
      "fecha": "2026-08-16",
      "campana": "UAEH-C1",
      "dia_ciclo": 6,
      "conv": 0,
      "alcance": 435,
      "frec": 1.07,
      "gasto": 13.85,
      "clics": 3,
      "cpc": 4.62,
      "ctr": 0.64,
      "clics_todos": 18,
      "ctr_todos": 3.85,
      "nota": "Pausada a media mañana"
    },
    {
      "fecha": "2026-08-17",
      "campana": "UACH-C2",
      "dia_ciclo": 1,
      "conv": 13,
      "alcance": 4051,
      "frec": 1.22,
      "gasto": 120.07
    },
    {
      "fecha": "2026-08-17",
      "campana": "UAEH-C2",
      "dia_ciclo": 1,
      "conv": 11,
      "alcance": 3632,
      "frec": 1.34,
      "gasto": 121.13
    },
    {
      "fecha": "2026-08-18",
      "campana": "UACH-C2",
      "dia_ciclo": 2,
      "conv": 5,
      "alcance": 2142,
      "frec": 1.31,
      "gasto": 98.3
    },
    {
      "fecha": "2026-08-18",
      "campana": "UAEH-C2",
      "dia_ciclo": 2,
      "conv": 12,
      "alcance": 2606,
      "frec": 1.39,
      "gasto": 97.11
    },
    {
      "fecha": "2026-08-19",
      "campana": "UACH-C2",
      "dia_ciclo": 3,
      "conv": 5,
      "alcance": 2811,
      "frec": 1.25,
      "gasto": 88.83
    },
    {
      "fecha": "2026-08-19",
      "campana": "UAEH-C2",
      "dia_ciclo": 3,
      "conv": 16,
      "alcance": 2454,
      "frec": 1.31,
      "gasto": 97.51
    },
    {
      "fecha": "2026-08-20",
      "campana": "UACH-C2",
      "dia_ciclo": 4,
      "conv": 6,
      "alcance": 2650,
      "frec": 1.22,
      "gasto": 78.71
    },
    {
      "fecha": "2026-08-20",
      "campana": "UAEH-C2",
      "dia_ciclo": 4,
      "conv": 7,
      "alcance": 1448,
      "frec": 1.26,
      "gasto": 62.93
    },
    {
      "fecha": "2026-08-22",
      "campana": "UAEH-C3",
      "dia_ciclo": 1,
      "conv": 4,
      "alcance": 2319,
      "frec": 1.2,
      "gasto": 60.86,
      "clics": 14,
      "cpc": 4.35,
      "ctr": 0.5,
      "clics_todos": 41,
      "ctr_todos": 1.47
    },
    {
      "fecha": "2026-08-23",
      "campana": "UAEH-C3",
      "dia_ciclo": 2,
      "conv": 12,
      "alcance": 5534,
      "frec": 1.33,
      "gasto": 154.37,
      "clics": 35,
      "cpc": 4.41,
      "ctr": 0.48,
      "clics_todos": 131,
      "ctr_todos": 1.78
    },
    {
      "fecha": "2026-08-24",
      "campana": "UAEH-C3",
      "dia_ciclo": 3,
      "conv": 8,
      "alcance": 4567,
      "frec": 1.34,
      "gasto": 146.22
    }
  ],
  "huecos": [
    {
      "rango": "2026-07-25 a 2026-08-10",
      "motivo": "Rango largo: la tabla de Meta no terminó de renderizar. Sólo hay agregados por campaña.",
      "gasto_total": 2450.65,
      "alcance_total": 54041
    },
    {
      "rango": "2026-08-21",
      "motivo": "Cifras contradictorias entre el total de campaña y el total del rango. Se deja sin cargar en vez de inventar el dato.",
      "gasto_total": null
    }
  ],
  "aprendizajes": [
    {
      "id": 1,
      "titulo": "La vida útil del anuncio es de 4 días, no de 10",
      "estado": "confirmado",
      "fecha": "2026-08-16",
      "texto": "En el ciclo A la campaña de UAEH pasó de $3.74 por conversación el día 1 a $45.32 el día 5. Los días 1–3 promediaron $4.25 y los días 4–5, $13.33: 3.1× más caro por el mismo resultado. Pautar 4 días y rotar creativo con imagen nueva.",
      "matiz": "El ciclo B no siguió esta curva: arrancó caro ($11.01) y mejoró hasta el día 3 ($6.09). La regla aplica a la caída, no al arranque."
    },
    {
      "id": 2,
      "titulo": "Apagar y prender la misma publicación no la refresca",
      "estado": "confirmado",
      "fecha": "2026-08-16",
      "texto": "Reinicia el aprendizaje pero la saturación del público sigue donde quedó. Para refrescar hace falta imagen nueva, no sólo texto nuevo."
    },
    {
      "id": 3,
      "titulo": "La caída del sábado 15 no fue efecto de fin de semana",
      "estado": "resuelto",
      "fecha": "2026-08-24",
      "texto": "Ese mismo sábado la campaña de UACH costó $13.21, en línea con su promedio de $11.30, mientras la de UAEH se disparó a $45.32. Si hubiera sido el día de la semana, las dos habrían caído. Fue agotamiento del creativo de UAEH.",
      "cierra_pendiente": 5
    },
    {
      "id": 4,
      "titulo": "La frecuencia predice el agotamiento mejor que el alcance",
      "estado": "nuevo",
      "fecha": "2026-08-24",
      "texto": "El umbral de 20,000 de alcance venía de la campaña de julio, que cerró en 20,200. Pero los ciclos A y B se agotaron con 11,535 y 10,738 de alcance. Lo que sí se repite es la frecuencia: 2.10, 2.02 y 1.90 al momento de morir. Vigilar frecuencia ≥ 1.9."
    },
    {
      "id": 5,
      "titulo": "UAEH rinde mejor que UACH en todos los ciclos",
      "estado": "nuevo",
      "fecha": "2026-08-24",
      "texto": "UAEH: $10.52 → $6.01 → $9.01 → $13.45. UACH: $15.98 → $11.69 → $15.57. UACH nunca ha bajado de $10 por conversación y en el ciclo B costó 73% más que UAEH con el mismo presupuesto."
    },
    {
      "id": 6,
      "titulo": "El destino de mensajes debe ir manual, sólo WhatsApp",
      "estado": "vigilar",
      "fecha": "2026-08-15",
      "texto": "En automático Meta manda mucha gente a Messenger, que no se atiende. El 15 de agosto casi toda la entrega cayó en Facebook Feed in-app, donde el botón abre Messenger."
    },
    {
      "id": 7,
      "titulo": "El número sólo se vuelve enlace si no lleva 'Whatsapp' pegado antes",
      "estado": "vigilar",
      "fecha": "2026-08-15",
      "texto": "«o al 55 7646 6741» se convierte en enlace azul. «o al Whatsapp 55 7646 6741» rompe la detección."
    },
    {
      "id": 8,
      "titulo": "Las sugerencias de presupuesto de Meta son una trampa al final del ciclo",
      "estado": "vigilar",
      "fecha": "2026-08-16",
      "texto": "Se calculan con el promedio de 7 días, que incluye los días buenos. El 16 de agosto Meta ofrecía +$124 diarios por «77% más resultados» cuando el día anterior costaba $45.30 por conversación."
    }
  ],
  "checklist": [
    {
      "texto": "Destino de mensajes en manual, sólo WhatsApp (nunca automático)",
      "critico": true
    },
    {
      "texto": "El número en el texto va sin la palabra «Whatsapp» pegada antes",
      "critico": true
    },
    {
      "texto": "Imagen nueva, no sólo texto nuevo, al rotar creativo",
      "critico": true
    },
    {
      "texto": "Presupuesto diario en $100 (no aceptar la sugerencia de subirlo)",
      "critico": false
    },
    {
      "texto": "Fecha de fin puesta a 4 días desde el arranque",
      "critico": false
    },
    {
      "texto": "Un solo anuncio por campaña",
      "critico": false
    },
    {
      "texto": "Revisar la clasificación de calidad del anuncio a partir del día 3",
      "critico": false
    }
  ],
  "pagina": {
    "fecha": "2026-08-16",
    "seguidores": 588,
    "pct_no_seguidores": 99.1,
    "seguidores_netos_mes": 10,
    "tasa_interaccion": 0.12,
    "interacciones": 173,
    "vistas": 140800,
    "reels": 0,
    "instagram_conectado": false,
    "publicaciones_semana": 2,
    "indice_respuesta": 94.9,
    "diagnostico": "Está rentando audiencia en vez de construirla: toda la visibilidad es pagada y se evapora al apagar la pauta."
  },
  "pendientes": [
    {
      "id": 1,
      "texto": "Conectar Instagram a la página",
      "impacto": "alto",
      "esfuerzo": "bajo",
      "estado": "abierto"
    },
    {
      "id": 2,
      "texto": "Arrancar reels, 1 por semana",
      "impacto": "alto",
      "esfuerzo": "medio",
      "estado": "abierto"
    },
    {
      "id": 3,
      "texto": "Confirmar que el destino del ciclo C está en WhatsApp manual",
      "impacto": "alto",
      "esfuerzo": "bajo",
      "estado": "abierto"
    },
    {
      "id": 4,
      "texto": "Decidir si UACH sigue con presupuesto propio o se reasigna a UAEH",
      "impacto": "alto",
      "esfuerzo": "bajo",
      "estado": "abierto"
    },
    {
      "id": 5,
      "texto": "Confirmar si la caída del sábado 15 tuvo componente de fin de semana",
      "impacto": "medio",
      "esfuerzo": "bajo",
      "estado": "resuelto",
      "resuelto_en": "2026-08-24"
    },
    {
      "id": 6,
      "texto": "Cargar el desglose diario del 25 jul – 10 ago y del 21 ago",
      "impacto": "medio",
      "esfuerzo": "medio",
      "estado": "abierto"
    },
    {
      "id": 7,
      "texto": "Explicar por qué el ciclo C arrancó con CTR de 0.48% (menos de la mitad del ciclo A)",
      "impacto": "alto",
      "esfuerzo": "medio",
      "estado": "abierto"
    }
  ]
};
