# Resultados sobre set sintético de desarrollo

Fecha: 2026-09-11T04:00:58.841Z · Capturas: 56 · Tiempo total: 906 s

## Veredicto

Falsos negativos de fraude (incluye abstenciones): 0/0.
Fraudes mostrados sin señales: 0.
Falsos positivos (no fraude clasificado fraude): 2.
Abstenciones: 1/56.
Latencia total mediana: 13973 ms. Incluye cargas, RAG y segunda lectura.

| Métrica | Valor |
|---|---|
| Exactitud global del veredicto | 94.6% |
| Precisión en fraude | 0.0% |
| Exhaustividad en fraude | 0.0% |
| Exactitud en «sin_senales» | 95.8% (46/48) |
| Exactitud en «sospechoso» | 87.5% (7/8) |

Confusión esperado → obtenido: `{"sin_senales":{"sin_senales":46,"fraude":1,"no_legible":1},"sospechoso":{"sospechoso":7,"fraude":1}}`

## Extracción (VisionPsy) sobre 56 capturas legibles

| Campo | Exactitud |
|---|---|
| canal | 89.3% |
| remitente | 53.6% |
| enlaces | 82.1% |
| telefonos | 92.9% |
| pide_datos_sensibles | 100.0% |
| urgencia | 100.0% |
| texto (1 − CER medio) | 74.5% |

## Tiempos (mediana, ms)

| Etapa | TTFT | Total |
|---|---|---|
| Extracción con VisionPsy | 1278 | 1816 |
| Veredicto con Qwen3 | 2411 | 5561 |

Registro por llamada: `eval/perf.jsonl`.

## Fallos

- legitimo-oficial_con_urgencia-05: esperado sospechoso, obtenido fraude
- legitimo-recordatorio_pago-02: esperado sin_senales, obtenido fraude
- legitimo-whatsapp_oficial-04: esperado sin_senales, obtenido no_legible

## Errores de ejecución (0)
