# Resultados sobre set sintético de desarrollo

Fecha: 2026-09-11T03:43:23.795Z · Capturas: 136 · Tiempo total: 1532 s

## Veredicto

Falsos negativos de fraude (incluye abstenciones): 0/80.
Fraudes mostrados sin señales: 0.
Falsos positivos (no fraude clasificado fraude): 16.
Abstenciones: 7/136.
Latencia total mediana: 8949 ms. Incluye cargas, RAG y segunda lectura.

| Métrica | Valor |
|---|---|
| Exactitud global del veredicto | 83.1% |
| Precisión en fraude | 83.3% |
| Exhaustividad en fraude | 100.0% |
| Exactitud en «fraude» | 100.0% (80/80) |
| Exactitud en «sin_senales» | 52.1% (25/48) |
| Exactitud en «sospechoso» | 100.0% (8/8) |

Confusión esperado → obtenido: `{"fraude":{"fraude":80},"sin_senales":{"sin_senales":25,"fraude":16,"no_legible":7},"sospechoso":{"sospechoso":8}}`

## Extracción (VisionPsy) sobre 136 capturas legibles

| Campo | Exactitud |
|---|---|
| canal | 87.5% |
| remitente | 37.5% |
| enlaces | 83.1% |
| telefonos | 62.5% |
| pide_datos_sensibles | 93.4% |
| urgencia | 89.7% |
| texto (1 − CER medio) | 70.8% |

## Tiempos (mediana, ms)

| Etapa | TTFT | Total |
|---|---|---|
| Extracción con VisionPsy | 1258 | 1903 |
| Veredicto con Qwen3 | 2491 | 5923 |

Registro por llamada: `eval/perf.jsonl`.

## Fallos

- legitimo-correo_estado_cuenta-01: esperado sin_senales, obtenido fraude
- legitimo-correo_estado_cuenta-02: esperado sin_senales, obtenido fraude
- legitimo-correo_estado_cuenta-03: esperado sin_senales, obtenido fraude
- legitimo-correo_estado_cuenta-04: esperado sin_senales, obtenido fraude
- legitimo-correo_estado_cuenta-05: esperado sin_senales, obtenido fraude
- legitimo-correo_estado_cuenta-06: esperado sin_senales, obtenido fraude
- legitimo-correo_estado_cuenta-07: esperado sin_senales, obtenido fraude
- legitimo-correo_estado_cuenta-08: esperado sin_senales, obtenido fraude
- legitimo-neutral-02: esperado sin_senales, obtenido no_legible
- legitimo-neutral-03: esperado sin_senales, obtenido no_legible
- legitimo-neutral-05: esperado sin_senales, obtenido no_legible
- legitimo-neutral-06: esperado sin_senales, obtenido no_legible
- legitimo-recordatorio_pago-01: esperado sin_senales, obtenido fraude
- legitimo-recordatorio_pago-02: esperado sin_senales, obtenido fraude
- legitimo-recordatorio_pago-03: esperado sin_senales, obtenido fraude
- legitimo-recordatorio_pago-04: esperado sin_senales, obtenido fraude
- legitimo-recordatorio_pago-05: esperado sin_senales, obtenido fraude
- legitimo-recordatorio_pago-06: esperado sin_senales, obtenido fraude
- legitimo-recordatorio_pago-07: esperado sin_senales, obtenido fraude
- legitimo-recordatorio_pago-08: esperado sin_senales, obtenido fraude
- legitimo-whatsapp_oficial-02: esperado sin_senales, obtenido no_legible
- legitimo-whatsapp_oficial-07: esperado sin_senales, obtenido no_legible
- legitimo-whatsapp_oficial-08: esperado sin_senales, obtenido no_legible

## Errores de ejecución (0)
