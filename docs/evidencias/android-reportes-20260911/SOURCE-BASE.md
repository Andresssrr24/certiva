# Base Android 0.5

Copia aislada de tmp/play-release-20260911/pilot (release0.4API36).
No se editó el checkout Android compartido ni el código QVAC.

Archivos Android cambiados/publicables:
- pilot/android-app/app/build.gradle: version5/0.5.0-reportes-piloto, BuildConfig.
- pilot/android-app/app/src/main/java/local/certiva/pilot/PilotAPI.java: destino HTTPS exacto; localhost solo constructor de depuración; timeouts y validación de rutas.
- pilot/android-app/app/src/main/java/local/certiva/pilot/MainActivity.java: acceso remoto, aviso de transferencia, borrado de reportes con confirmación.
- pilot/android-app/app/src/main/res/xml/network_security_config.xml: release sin HTTP.
- pilot/android-app/app/src/debug/res/xml/network_security_config.xml: localhost solo para pruebas locales existentes.
- pilot/android-app/app/src/androidTest/java/local/certiva/pilot/PublicReportsTest.java: SDK real y HTTPS, credenciales externas efímeras.

No publicar symlinks vendor/.generated de esta copia ni archivos de build.
AAB y SHA256 en artifacts/ y evidence/artifact.json. Evidencia Android sanitizada
no contiene credenciales y no acredita inferencia QVAC ni Android16 físico.
