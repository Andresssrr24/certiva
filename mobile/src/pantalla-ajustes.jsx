// Ajustes: el estado del lector que corre en el teléfono, qué hace la app con tus datos y qué versión es.

import { Alert, View } from "react-native";
import { BANCO, CANALES, VERSION } from "./contenido";
import { megas } from "./formato";
import { VISION } from "./motor";
import { C, E } from "./tema";
import { Aviso, BarraProgreso, Boton, Chip, Fila, Seccion, Tarjeta, Texto } from "./ui";

const PRIVACIDAD = [
  "El mensaje se analiza dentro del teléfono, con las reglas y el lector instalados aquí.",
  "No hay cuenta, ni registro, ni servidor: la app no envía tu mensaje a ninguna parte.",
  "El historial vive solo en este teléfono y se borra al desinstalar la app.",
  "Funciona sin señal. La única descarga es la del lector de capturas, y es tuya decidirla.",
];

export function PantallaAjustes({ vision, progreso, alDescargar, revisiones, alVaciar }) {
  const confirmarVaciado = () => {
    Alert.alert("Vaciar el historial", "Se borran las revisiones guardadas en este teléfono. No se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Vaciar", style: "destructive", onPress: alVaciar },
    ]);
  };

  return (
    <View style={{ gap: E.gg }}>
      <Seccion titulo="Lector de capturas">
        <Tarjeta>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: E.s }}>
            <Texto v="h3" style={{ flex: 1 }}>
              VisionPsy Nano Q8
            </Texto>
            {vision.enCache ? (
              <Chip texto="EN EL TELÉFONO" icono="check" />
            ) : (
              <Chip texto={megas(vision.bytes)} fondo={C.panel2} color={C.gris} />
            )}
          </View>
          <Texto v="pequeno">
            Lee el texto de una captura dentro del teléfono, sin enviar la imagen. Solo hace falta para revisar
            capturas: el texto pegado se analiza siempre, sin descargar nada.
          </Texto>
          {progreso === null || progreso === undefined ? (
            vision.enCache ? null : (
              <Boton texto="Descargar el lector" icono="descargar" variante="secundario" onPress={alDescargar} />
            )
          ) : (
            <View style={{ gap: E.s }}>
              <BarraProgreso valor={progreso} />
              <Texto v="micro">Descargando… {Math.round(progreso)}%</Texto>
            </View>
          )}
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Privacidad">
        <Tarjeta style={{ paddingVertical: 0, gap: 0 }}>
          {PRIVACIDAD.map((p, i) => (
            <Fila key={p} icono="check" titulo={p} lineas={4} sinBorde={i === PRIVACIDAD.length - 1} />
          ))}
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Banco protegido">
        <Tarjeta style={{ paddingVertical: 0, gap: 0 }}>
          <Fila icono="escudo" titulo={BANCO.nombre} subtitulo="Reglas y canales oficiales de este emisor" />
          {CANALES.slice(0, 2).map((c, i) => (
            <Fila key={c.titulo} icono={c.icono} titulo={c.titulo} subtitulo={c.valor} sinBorde={i === 1} />
          ))}
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Historial">
        <Tarjeta>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: E.s }}>
            <Texto v="h3" style={{ flex: 1 }}>
              {revisiones.length === 1 ? "1 revisión guardada" : `${revisiones.length} revisiones guardadas`}
            </Texto>
            {revisiones.length ? (
              <Boton texto="Vaciar" icono="basura" variante="peligro" tam="m" onPress={confirmarVaciado} />
            ) : null}
          </View>
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Acerca de">
        <Tarjeta style={{ paddingVertical: 0, gap: 0 }}>
          <Fila icono="info" titulo="Certiva" subtitulo={`Versión ${VERSION} · Android`} />
          <Fila icono="escudo" titulo="Motor" subtitulo="QVAC en el teléfono · reglas del banco + VisionPsy" />
          <Fila icono="ojo" titulo="Lector" subtitulo={VISION.nombre} sinBorde />
        </Tarjeta>
        <Aviso
          icono="candado"
          texto="Certiva es un prototipo del hackatón ISD Summit 2026. El banco y los mensajes de ejemplo son de demostración."
        />
      </Seccion>
    </View>
  );
}
