# Resultados sobre el set sintético

Fecha: 2026-09-10T15:55:18.708Z · Capturas: 120 · Tiempo total: 924 s

## Veredicto

| Métrica | Valor |
|---|---|
| Exactitud global del veredicto | 95.8% |
| Precisión en fraude | 96.9% |
| Exhaustividad en fraude | 96.9% |
| Exactitud en «fraude» | 96.9% (62/64) |
| Exactitud en «sin_senales» | 93.8% (45/48) |
| Exactitud en «sospechoso» | 100.0% (8/8) |

Confusión esperado → obtenido: `{"fraude":{"fraude":62,"sin_senales":2},"sin_senales":{"sin_senales":45,"fraude":2,"sospechoso":1},"sospechoso":{"sospechoso":8}}`

## Extracción (VisionPsy) sobre 120 capturas legibles

| Campo | Exactitud |
|---|---|
| canal | 85.0% |
| remitente | 87.5% |
| enlaces | 84.2% |
| telefonos | 95.0% |
| pide_datos_sensibles | 92.5% |
| urgencia | 90.0% |
| texto (1 − CER medio) | 74.9% |

## Tiempos (mediana, ms)

| Etapa | TTFT | Total |
|---|---|---|
| Extracción con VisionPsy | 1275 | 1890 |
| Veredicto con Qwen3 | 2387 | 5640 |

Registro por llamada: `eval/perf.jsonl`.

## Fallos

- fraude-ejecutivo_whatsapp-06: esperado fraude, obtenido sin_senales
- fraude-pide_codigo-05: esperado fraude, obtenido sin_senales
- legitimo-correo_estado_cuenta-03: esperado sin_senales, obtenido fraude
- legitimo-correo_estado_cuenta-06: esperado sin_senales, obtenido fraude
- legitimo-recordatorio_pago-06: esperado sin_senales, obtenido sospechoso

## Errores de ejecución (0)
