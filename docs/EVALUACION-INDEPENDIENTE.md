# Evaluación externa, sin contaminar los resultados

Pedir a alguien que no ajustó las reglas que prepare capturas sintéticas nuevas y etiquete su contenido. No usar datos reales de clientes. No mirar resultados y reajustar para luego llamar a la misma muestra independiente.

Crear un directorio con `capturas/<id>.png` y `verdad.json`, usando el mismo formato de `data/verdad.json`. Incluir solicitudes de códigos sin enlaces, mensajes legítimos con códigos, negaciones, texto pequeño, capturas recortadas y marcas de mensajería distintas. Declarar autor, fecha y si los ejemplos se usaron para desarrollo en un README junto al dataset.

Ejecutar, con modelos descargados y sin otra aplicación QVAC activa:

```sh
EVAL_DATASET=/ruta/dataset EVAL_OUTPUT=/ruta/resultados npm run eval
```

Cada corrida guarda hashes de las imágenes y etiquetas, commit, cambios pendientes, resultados y rendimiento. Las corridas por defecto van a `eval/runs/<fecha>` y no reemplazan el benchmark histórico. Un dataset externo no se considera independiente automáticamente.

El reporte distingue falsos negativos, fraudes mostrados sin señales, falsos positivos, abstenciones y latencia total. Una abstención no cuenta como acierto de fraude. El umbral de acuerdo entre lectores (0,65 Jaccard de palabras normalizadas) es una heurística de desarrollo, no una confianza calibrada; validarlo sin ocultar su costo en latencia y abstenciones.

La nueva segunda lectura puede recuperar señales perdidas por VisionPsy, pero ambos lectores pueden fallar de la misma manera. No afirmar que desaparecieron los falsos negativos sin medirlos.
