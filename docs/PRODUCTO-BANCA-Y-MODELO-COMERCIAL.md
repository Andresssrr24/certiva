# Certiva para banca: producto y modelo comercial

Estado: alcance bancario solicitado por Bryan; diseño y cifras comerciales propuestos para validar. Caja de Ahorros es el banco de referencia, sin implicar acuerdo, aval o integración existente. USDT y wallets cripto están fuera del alcance. Este documento reemplaza la propuesta anterior de banca y USDT.

## Recomendación

El banco compra Certiva y ofrece la protección esencial dentro de su aplicación, incluida para sus clientes. Certiva vende software e integración a la institución. Posteriormente, el banco puede comercializar funciones de operación empresarial que aporten valor adicional verificable.

No condicionaría las advertencias básicas de fraude a una suscripción del cliente. Mi hipótesis es que el banco encontrará más valor inicial en adopción digital, protección del cliente y eficiencia operativa que en cobrar una pequeña cuota individual. Hay que demostrarlo en el piloto y en entrevistas comerciales, no asumirlo.

## 1. Experiencia del cliente

Un acceso «Verificar un mensaje» en la banca móvil permite aportar una captura, texto o enlace. Certiva analiza localmente el contenido compatible, muestra las señales y propone una acción concreta. El cliente puede contactar al banco desde un canal aprobado y reportar lo ocurrido.

Estados visibles: «Encontramos señales de riesgo», «No encontramos señales en este contenido» y «No pudimos verificarlo». El segundo no certifica autenticidad. Nunca solicitar contraseña, OTP, semilla ni datos de acceso para efectuar el análisis.

El módulo aprovecha la sesión de la app; no obliga al cliente a crear otra cuenta en Certiva. La atribución «Tecnología de Certiva» sería negociable. El banco conserva la relación comercial y el soporte al cliente; Certiva atiende técnicamente al banco.

En una segunda etapa, una señal reciente de manipulación se vincula a una intención de pago identificada por el servidor. El motor bancario decide una comprobación adicional o revisión conforme a su política. No se retiene un pago por la sola opinión del modelo.

## 2. Qué debe entregar el SDK móvil

| Componente | Alcance inicial | Criterio verificable |
|---|---|---|
| Captura de contenido | Importar imagen, pegar texto o enlace; compartir hacia la app cuando la plataforma lo permita | No necesita acceso general a conversaciones ni llamadas |
| Motor local | Extracción, reglas y explicación con límites deterministas | Abstiene cuando la lectura es insuficiente; instrucciones en mensajes no cambian reglas |
| Configuración institucional | Canales oficiales, políticas, contacto y textos aprobados | Firma, caducidad, control de versiones y rollback autorizado |
| Interfaz integrable | Componentes accesibles o respuesta estructurada para la UI bancaria | Letras escalables, lector de pantalla y acción principal comprensible |
| Reporte | Evidencia mínima y aportación opcional de contenido | Vista previa del envío; sin capturas ni transcripciones por defecto |
| Operación móvil | Descarga y actualización de modelos, cancelación y límites de recursos | Pruebas físicas de memoria, batería, latencia y desconexión |

Se elige la primera plataforma tras conocer la app del banco y su distribución real de dispositivos. No comprometer Android/iOS simultáneos ni un wrapper específico sin esa información. El prototipo Electron y su rendimiento en Mac no acreditan compatibilidad móvil.

## 3. Consola que sí usaría el equipo de fraude

La consola debe resolver trabajo, no limitarse a mostrar gráficas.

1. **Bandeja:** reportes priorizados, duplicados agrupados, responsable y antigüedad.
2. **Caso:** evidencia autorizada, motivos, estado y acciones disponibles para el analista.
3. **Campañas:** patrones relacionados con nivel de corroboración, no acusaciones automáticas.
4. **Políticas:** preparar y aprobar actualizaciones; publicación con dos responsables y reversión.
5. **Resultados:** tiempo de resolución, falsos positivos, carga operativa y eficacia por categoría.
6. **Auditoría:** quién accedió, modificó o decidió, con versiones y exportación al sistema institucional.

Roles separados de analista, administrador y auditor. El banco puede integrar su sistema existente de casos para evitar duplicar trabajo. Una alerta comunitaria por sí sola no activa bloqueos. La lista de canales reconocidos no autentica un mensaje cuyo remitente pudo ser suplantado.

## 4. Cómo lo distribuiría o vendería el banco

| Modalidad | Oferta al cliente | Ingreso de Certiva | Valor para el banco |
|---|---|---|---|
| Protección incluida, recomendada al inicio | Verificación, advertencia, contacto y reporte | Licencia institucional y servicios de integración | Mayor alcance, confianza y posible reducción de fraude/carga de soporte |
| Beneficio de paquete existente | La misma protección básica, con prestaciones adicionales acordadas | Ampliación de licencia por alcance | Diferenciación de cuentas y retención, a validar |
| Módulo empresarial, segunda etapa | Revisión de cambios de cuenta de proveedores, evidencias y flujos de aprobación | Licencia adicional por empresas habilitadas | El banco puede cobrar por productividad y control operativo |

El módulo empresarial requiere integración propia: Certiva identifica señales y discrepancias; no puede certificar que una factura o cuenta pertenece al proveedor sin una fuente de verificación. Los aprobadores y la ejecución del pago pertenecen al sistema empresarial/bancario.

No incluir seguros, indemnización o promesas de recuperación en el precio del software. Tampoco ofrecer asistencia humana 24/7 sin personal, procesos y contrato que la sostengan.

Caja de Ahorros ya publica una app móvil, canales de seguridad y servicios de banca comercial. La propuesta se incorporaría a esos recorridos, con integración acordada. Es una hipótesis de encaje comercial, no evidencia de interés de compra del banco. [Banca digital](https://www.cajadeahorros.com.pa/canales-digitales/banca-en-linea/), [seguridad](https://www.cajadeahorros.com.pa/recomendaciones-seguridad-bancaria/), [servicios empresariales](https://www.cajadeahorros.com.pa/empresas/canales-digitales-empresariales/caja-en-linea-comercial/).

Como referencia de distribución integrada, BBVA describe mensajes verificados que llegan a sus clientes sin instalar otra aplicación. Ese ejemplo respalda la conveniencia de reducir pasos de adopción; no prueba tarifas ni disposición a pagar por Certiva. [Fuente de BBVA](https://www.bbva.com/es/es/innovacion/bbva-protege-a-sus-clientes-del-fraude-con-un-nuevo-canal-de-mensajes-verificados/).

## 5. Cómo cobrar al banco

- Piloto pagado, con alcance, duración, entregables, responsables y condiciones de salida.
- Integración inicial cotizada según plataforma, autenticación, despliegue y sistemas involucrados. Evitar cobrar dos veces el trabajo ya cubierto por el piloto.
- Licencia anual con una cuota base por SDK, consola, mantenimiento y capacidad incluida; bandas por clientes activos con el módulo habilitado.
- Servicios extraordinarios separados: nuevas integraciones, operación gestionada, SLA superior o desarrollos exclusivos.

La unidad comercial se define en contrato: cliente único activo en el mes en la app con el módulo habilitado, deduplicado por la institución, excluyendo pruebas y personal de desarrollo. La contabilización no exige enviar mensajes ni identidades a Certiva. El precio por banda reduce variaciones de facturación; prever cómo se trata un exceso sostenido de capacidad.

No cobrar por alerta ni por intento de fraude: crea incentivos a generar más señales. Tampoco facturar cada análisis individual en la experiencia básica: puede desincentivar el uso que buscamos fomentar.

### Ejemplo para discutir, no tarifa de mercado

Un supuesto de USD 5.000 mensuales, con capacidad para 50.000 clientes activos, equivale a USD 60.000 anuales recurrentes o USD 1,20 por cliente al año si se utiliza toda la capacidad. Si solo hay 10.000 activos, el costo efectivo es USD 6 por cliente al año. Integración, impuestos y servicios adicionales se presupuestan aparte.

Este número no es una cotización ni está validado contra costos o presupuestos del banco. Antes de fijarlo, medir costo de soporte, infraestructura, seguridad, mantenimiento de modelos y móvil, cumplimiento contractual y margen bruto necesario.

El caso de negocio se calcula desde la perspectiva del banco: pérdidas efectivamente asumidas por el banco evitadas de forma atribuible + ahorro de horas de soporte/investigación + margen incremental demostrado − licencia − implementación − operación y fricción adicionales. La pérdida evitada del cliente se reporta aparte cuando no corresponde a una pérdida del banco, sin quitarle su valor de protección.

Ejemplo de umbral: con USD 60.000 de licencia anual, el beneficio atribuible debe superar esa cifra más integración y operación. No presentar una transferencia cancelada como pérdida evitada comprobada; puede ser legítima. No sumar beneficios solapados.

## 6. Qué creo que haría el banco

Mi expectativa, a validar en conversación, es que primero solicite una prueba pequeña y controlada. Necesitaría entender qué error puede cometer el sistema, qué datos salen del dispositivo, cuánto pesa el SDK, quién atiende los casos y si puede retirarlo sin afectar pagos.

El promotor interno probable es fraude junto con banca digital. Seguridad, privacidad, arquitectura, cumplimiento y compras deben participar. La propuesta comercial debe incluir integración, responsabilidad operativa, tratamiento de datos, SLA, propiedad intelectual, mantenimiento y salida del servicio.

La marca blanca facilita que el cliente reconozca a su banco como canal de ayuda. La venta inicial debe concentrarse en resultados concretos: advertencia comprensible, reporte útil y menor esfuerzo de investigación. El retorno económico y cualquier ingreso empresarial deben demostrarse después.

## 7. Primera entrega y piloto

**Primera entrega técnica:** motor desacoplado de Electron, contrato de evaluación, SDK en una plataforma, consola mínima de casos, configuración firmada y adaptador bancario simulado. Los componentes reales del banco se conectan en su entorno de pruebas cuando esté disponible.

**Piloto propuesto de 90 días desde el acceso al entorno del socio:** 15 días para alcance y diseño de evaluación; 15 para preparación técnica inicial según factibilidad; 30 de uso limitado y observación; 30 para evaluar resultados y acordar expansión. Ese calendario es una hipótesis que debe ajustarse a la portabilidad del SDK y a la integración; no es promesa de producción en 90 días.

Comenzar por consulta voluntaria y reportes, sin retención automática de pagos. Medir adopción, comprensión de advertencias, falsos positivos/negativos, abstenciones, latencia por dispositivo, carga de casos y tiempo de resolución. Reservar datos de evaluación independientes y criterios de aceptación antes de ajustar reglas.

Puertas de salida: viabilidad móvil, validación de seguridad/privacidad, utilidad operativa y costo aceptable. Solo después integrar fricción transaccional y desarrollar la oferta empresarial.

Las garantías de privacidad, auditoría y seguridad deben demostrarse. Los hashes no se presumen anónimos; la inferencia local no significa costo total cero; no se promete vigilancia continua de llamadas o mensajes ajenos a la app. La revisión jurídica debe usar la normativa vigente y los flujos concretos del banco, sin presentar este documento comercial como certificación de cumplimiento.
