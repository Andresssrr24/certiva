# Resultados sobre el set sintético

Fecha: 2026-09-10T13:22:22.950Z · Capturas: 120 · Tiempo total: 1054 s

## Veredicto

| Métrica | Valor |
|---|---|
| Exactitud global del veredicto | 92.5% |
| Precisión en fraude | 96.9% |
| Exhaustividad en fraude | 98.4% |
| Exactitud en «fraude» | 98.4% (63/64) |
| Exactitud en «sin_senales» | 97.9% (47/48) |
| Exactitud en «sospechoso» | 12.5% (1/8) |

Confusión esperado → obtenido: `{"fraude":{"fraude":63,"sin_senales":1},"sin_senales":{"sin_senales":47,"fraude":1},"sospechoso":{"sin_senales":6,"fraude":1,"sospechoso":1}}`

## Extracción (VisionPsy) sobre 120 capturas legibles

| Campo | Exactitud |
|---|---|
| canal | 84.2% |
| remitente | 90.8% |
| enlaces | 85.0% |
| telefonos | 95.0% |
| pide_datos_sensibles | 94.2% |
| urgencia | 88.3% |
| texto (1 − CER medio) | 62.6% |

## Tiempos (mediana, ms)

| Etapa | TTFT | Total |
|---|---|---|
| Extracción con VisionPsy | 1231 | 1804 |
| Veredicto con Qwen3 | 1759 | 6589 |

Registro por llamada: `eval/perf.jsonl`.

## Fallos

- fraude-pide_codigo-03: esperado fraude, obtenido sin_senales
- legitimo-correo_estado_cuenta-06: esperado sin_senales, obtenido fraude
- legitimo-oficial_con_urgencia-01: esperado sospechoso, obtenido sin_senales
- legitimo-oficial_con_urgencia-02: esperado sospechoso, obtenido sin_senales
- legitimo-oficial_con_urgencia-03: esperado sospechoso, obtenido sin_senales
- legitimo-oficial_con_urgencia-04: esperado sospechoso, obtenido sin_senales
- legitimo-oficial_con_urgencia-05: esperado sospechoso, obtenido sin_senales
- legitimo-oficial_con_urgencia-06: esperado sospechoso, obtenido fraude
- legitimo-oficial_con_urgencia-07: esperado sospechoso, obtenido sin_senales

## Errores de ejecución (0)
