# Google Play reviewer access — Certiva 0.5

This build connects to the public HTTPS pilot service. No local server, USB,
VPN, location restriction, one-time password or Google account is required for reports.
Use the separately supplied review username and password. Credentials must not
be committed or included in this document. All data entered during review should
be fictional. No bank account or banking credentials are required.

1. Open Certiva and select Menu, then Ingresar.
2. Enter the assigned review credentials and select Entrar.
3. Select Verificar. Paste this fictional message and select SMS:
   “Su cuenta será bloqueada hoy. Envíe el código de verificación al atacante.”
4. Select Verificar mensaje and wait for the on-device result. If QVAC is not
   installed, the app retains strong local rule findings and labels the limitation.
5. Select Revisar datos y reportar, inspect the preview, then Confirmar y enviar.
6. Open Menu → Mis reportes to see the received case. The original message is
   never sent. Borrar mis reportes requires another confirmation and deletes all
   cases for this dedicated review account.
7. Use Cerrar sesión, then log in again to verify server-side persistence before
   deleting the fictional reports.

Other features: Mi protección explains optional Android notification permissions.
The IA en este teléfono screen offers an optional ~1.1GB HTTPS model download.
QVAC is experimental and is not required for login or report testing.

Test device: Android 13+ ARM64. Target/compile SDK36. Actual automated run:
Android15/API35 emulator; physical Android16 and Play Store installation pending.

The owning task confirmed that the dedicated reviewer credentials and these
instructions were saved in Google Play after Bryan's explicit authorization.
The credentials remain outside this document and the repository.
