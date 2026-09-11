# Revisión de integración del registro beta

11 de septiembre de 2026. Copia aislada desde `main` (`6eee9ea`) con el inventario congelado de la tarea de landing. Esta revisión prepara una PR en borrador; no activa el registro ni despliega a producción.

## Cambios integrados

- API de inicio, retorno OAuth y estado; páginas de acceso y privacidad; dependencia fijada por `package-lock.json` y configuración de rutas.
- Se conserva el teléfono interactivo y las correcciones de accesibilidad integradas previamente.
- El QR de PR #33 seguía apuntando al Release Expo aunque la nueva tarjeta anunciaba la prueba nativa de Google Play. Se recupera el SVG de la ruta estable `/apk`, cuyo redirect en esta rama lleva a `/probar`, igual que el botón. La app Expo permanece disponible en su Release.
- El enlace de Google Play del resultado oculto recibe un `href` válido para accesibilidad. El servidor sigue mostrando el resultado únicamente después de confirmar la membresía.
- Formato e imports ajustados con Biome; documentación actualizada para distinguir el código preparado de la configuración y distribución disponibles.

## Comprobaciones realizadas

- `npm ci --ignore-scripts --no-audit --no-fund`: instalación desde lockfile.
- `npm test`: **16/16 PASS** después de los ajustes. Nueve pruebas cubren configuración incompleta, cookie alterada/caducada, origen y consentimiento, state antes del intercambio, nonce y correo verificado, resultado privado, fallo de alta y membresía exacta confirmada. OAuth y Cloud Identity están simulados en estas pruebas.
- `npm run build`: **PASS**, con comprobación del tamaño y SHA-256 del APK nativo histórico 0.3 requerido por el build. Binario y `dist/` ignorados por Git.
- Biome de once archivos de código/configuración nuevos o afectados: sin errores, un aviso por `!important` en `[hidden]`, conservado para que los estados ocultos no queden visibles por estilos de componentes.
- Las dos páginas nuevas tienen IDs únicos, recursos locales existentes y referencias JavaScript válidas.
- SVG del QR rasterizado y decodificado mediante Vision de macOS: `https://certiva-landing.vercel.app/apk`. SHA-256 del SVG: `3ab5614ebd69acd6ca1237bcee8236f261fc67b46b52beab3466af2dc1f95565`.
- `git diff --check`: correcto.

## Pendientes antes de abrir el registro

La tarea de Google Cloud confirmó consultas y altas autorizadas con la API real, recogidas en [BETA-SETUP.md](BETA-SETUP.md). Esta revisión no repite operaciones de membresía, no usa credenciales y no publica correos de verificadores.

Faltan la configuración sensible de Vercel, la disponibilidad del canal cerrado y una comprobación completa navegador → Google → grupo → Google Play. El registro permanece desactivado por defecto y debe conservarse así mientras falten esos requisitos. La prueba interna 0.4 para cuentas habilitadas es un canal distinto. No se realizó inspección visual de las páginas nuevas ni instalación física desde Play en esta revisión. `npm run dev` solo ofrece una vista estática; no valida las funciones de Vercel.

## Actualización posterior al commit de integración

La tarea de landing incorporó las correcciones y notificó el despliegue READY `dpl_73Pi3sVsLWQzNFAUfWD2YKTnV84A`. Esta tarea confirmó por GET público que `/api/beta/status` responde `enabled:false` y `registered:false`. El despliegue no acredita activación del registro ni disponibilidad del canal cerrado. El estado actualizado de Play y los requisitos pendientes figuran en BETA-SETUP.md.
