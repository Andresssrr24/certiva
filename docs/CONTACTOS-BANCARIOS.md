# Contactos publicados de Caja de Ahorros

Directorio consultado por IA el **10 de septiembre de 2026**, a partir de páginas primarias del propio banco. La etiqueta identifica la investigación realizada al preparar esta versión: la app no realiza una búsqueda web en vivo ni le envía el mensaje analizado a un buscador.

| Canal | Número publicado | Uso y fuente |
| --- | --- | --- |
| Atención telefónica | 800-2252 | Comunicar actividad sospechosa y pedir orientación. [Recomendaciones de seguridad](https://www.cajadeahorros.com.pa/recomendaciones-seguridad-bancaria/). |
| Celular o extranjero | +507 508-3456 | Atención y reportes de Banca en Línea. [Banca en línea](https://www.cajadeahorros.com.pa/canales-digitales/banca-en-linea/). |
| WhatsApp A.N.D.R.E.A. | +507 6949-0076 | Consultas y asistencia; incluye bloqueo de tarjetas por robo o pérdida. [A.N.D.R.E.A.](https://www.cajadeahorros.com.pa/andrea/). También se publica para reportes de Banca en Línea en la fuente anterior. |

No se incorporaron extensiones de seguridad o fraude encontradas únicamente en documentos antiguos, porque las páginas actuales ofrecen estos canales de atención. No se inventaron horarios ni se presenta ninguno como línea exclusiva de fraude.

## Implementación

- Datos y comparación: `renderer/contactos-data.js`, reutilizable desde navegador y Node.
- Presentación: `renderer/contactos.js` y `renderer/contactos.css`.
- Entrada desde el resultado: «Ver números oficiales y fuentes».
- Cada tarjeta muestra número, función y enlaces a las páginas que lo sustentan.
- La comparación es local y no guarda el número introducido. Una coincidencia no autentica una llamada: el identificador puede suplantarse. La ausencia no acredita fraude y el directorio no pretende enumerar todas las líneas del banco.
- En los ejemplos de Banco Demo se aclara que la lista corresponde a Caja de Ahorros; no se atribuye el mensaje de ejemplo a una entidad real.
- Las fuentes de Electron se abren en el navegador con un IPC que admite solo identificadores de las tres páginas configuradas. No acepta URLs arbitrarias del mensaje.
- Los resultados del análisis conservan sus reglas actuales; solo se matiza la presentación de una no coincidencia de teléfono. Este directorio no se añade como lista de remitentes automáticamente confiables.

Actualizar la fecha y comprobar nuevamente cada fuente al cambiar el directorio. Los datos de investigación deben permanecer separados del texto generado por los modelos de análisis.
