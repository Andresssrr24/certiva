# Resultados sobre el set sintético

Fecha: 2026-09-10T16:54:39.582Z · Capturas: 120 · Tiempo total: 989 s

## Veredicto

| Métrica | Valor |
|---|---|
| Exactitud global del veredicto | 98.3% |
| Precisión en fraude | 100.0% |
| Exhaustividad en fraude | 96.9% |
| Exactitud en «fraude» | 96.9% (62/64) |
| Exactitud en «sin_senales» | 100.0% (48/48) |
| Exactitud en «sospechoso» | 100.0% (8/8) |

Confusión esperado → obtenido: `{"fraude":{"fraude":62,"sin_senales":2},"sin_senales":{"sin_senales":48},"sospechoso":{"sospechoso":8}}`

## Extracción (VisionPsy) sobre 120 capturas legibles

| Campo | Exactitud |
|---|---|
| canal | 84.2% |
| remitente | 85.8% |
| enlaces | 85.0% |
| telefonos | 95.0% |
| pide_datos_sensibles | 95.0% |
| urgencia | 91.7% |
| texto (1 − CER medio) | 73.9% |

## Tiempos (mediana, ms)

| Etapa | TTFT | Total |
|---|---|---|
| Extracción con VisionPsy | 1227 | 1813 |
| Veredicto con Qwen3 | 2341 | 5483 |

Registro por llamada: `eval/perf.jsonl`.

## Fallos

- fraude-pide_codigo-03: esperado fraude, obtenido sin_senales
- fraude-pide_codigo-05: esperado fraude, obtenido sin_senales

## Errores de ejecución (0)
