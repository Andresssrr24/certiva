# Resultados sobre el set sintético

Fecha: 2026-09-10T16:23:34.261Z · Capturas: 120 · Tiempo total: 1028 s

## Veredicto

| Métrica | Valor |
|---|---|
| Exactitud global del veredicto | 97.5% |
| Precisión en fraude | 100.0% |
| Exhaustividad en fraude | 95.3% |
| Exactitud en «fraude» | 95.3% (61/64) |
| Exactitud en «sin_senales» | 100.0% (48/48) |
| Exactitud en «sospechoso» | 100.0% (8/8) |

Confusión esperado → obtenido: `{"fraude":{"fraude":61,"sin_senales":3},"sin_senales":{"sin_senales":48},"sospechoso":{"sospechoso":8}}`

## Extracción (VisionPsy) sobre 120 capturas legibles

| Campo | Exactitud |
|---|---|
| canal | 84.2% |
| remitente | 87.5% |
| enlaces | 80.8% |
| telefonos | 95.0% |
| pide_datos_sensibles | 94.2% |
| urgencia | 84.2% |
| texto (1 − CER medio) | 61.8% |

## Tiempos (mediana, ms)

| Etapa | TTFT | Total |
|---|---|---|
| Extracción con VisionPsy | 1249 | 1879 |
| Veredicto con Qwen3 | 2359 | 5557 |

Registro por llamada: `eval/perf.jsonl`.

## Fallos

- fraude-ejecutivo_whatsapp-01: esperado fraude, obtenido sin_senales
- fraude-pide_codigo-01: esperado fraude, obtenido sin_senales
- fraude-pide_codigo-03: esperado fraude, obtenido sin_senales

## Errores de ejecución (0)
