# Certiva: interfaz local

La aplicación de escritorio usa la identidad aprobada en `MEMORIA_PROYECTO.md`: azul `#205094`, blanco, símbolo Enlace 03, firma compacta y descriptor «Tu aliado contra el fraude».

La capa visual está en `renderer/certiva.css`. El símbolo utiliza la lámina v5 como sprite para conservar el diseño aprobado mientras se produce el master vectorial. Manrope se sirve desde `renderer/assets/`, con licencia OFL incluida; no requiere CDN.

## Inicio habitual

Con las dependencias del proyecto instaladas:

```sh
npm start
```

La interfaz abre una ventana nativa de Electron, no un servidor HTTP. Para analizar capturas o llamadas también hacen falta el SDK QVAC y sus modelos. Las instrucciones de instalación y descarga siguen en el README del proyecto.

## Vista local preparada en este equipo

El 10 de septiembre de 2026 se abrió la aplicación con Electron 40.10.2, recuperado del caché local, porque la instalación completa de dependencias no terminó por falta de espacio. La versión declarada del proyecto sigue siendo Electron 42.5.0. Mientras exista este runtime temporal, se puede volver a abrir desde la raíz del repositorio con:

```sh
PARES=0 /tmp/certiva-runtime/preview/Electron.app/Contents/MacOS/Electron .
```

Esta sesión permite revisar la interfaz y su navegación. No tiene SDK ni modelos instalados y muestra un aviso al respecto. La red de pares está desactivada. No acredita funcionamiento de inferencia ni intercambio entre nodos. El runtime temporal no forma parte del repositorio.

## Verificación

- Revisión visual de «Mi protección» y «Radar del banco» en la ventana nativa.
- Pruebas existentes: `npm test` (8 pruebas aprobadas).
- Comprobación de sintaxis/formato de los archivos modificados.
- No se ejecutó inferencia QVAC en esta sesión.
