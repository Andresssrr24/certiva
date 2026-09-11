// Bienvenida de la primera vez. Tres pantallas: qué hace, dónde corre y qué no hace.
// Se ve una sola vez; la decisión queda guardada en el teléfono (almacen.js).

import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, E } from "./tema";
import { Boton, EnlaceTexto, Insignia, Texto } from "./ui";

const PASOS = [
  {
    icono: "escudo",
    titulo: "Antes de responder, verifica.",
    texto:
      "Pega el mensaje que te llegó, o una captura, y Certiva te dice si tiene señales de estafa y qué hacer con él.",
  },
  {
    icono: "candado",
    titulo: "Todo pasa en tu teléfono.",
    texto:
      "El análisis corre aquí dentro, sin enviar tu mensaje a ningún servidor. Funciona aunque estés sin señal, y nadie más lo ve.",
  },
  {
    icono: "telefono",
    titulo: "No decide por ti.",
    texto:
      "Certiva te muestra las señales que encontró y el canal oficial del banco. La última palabra, y la llamada, siguen siendo tuyas.",
  },
];

export function PantallaBienvenida({ onListo }) {
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const paso = PASOS[i];
  const ultimo = i === PASOS.length - 1;
  return (
    <View
      style={{
        flex: 1,
        padding: E.xl,
        paddingTop: insets.top + E.m,
        paddingBottom: Math.max(insets.bottom, E.m) + E.m,
        justifyContent: "space-between",
      }}
    >
      <View style={{ alignItems: "flex-end", paddingTop: E.s }}>
        {ultimo ? null : <EnlaceTexto texto="SALTAR" onPress={onListo} color={C.grisClaro} />}
      </View>

      <View style={{ flex: 1, gap: E.gg, alignItems: "flex-start", justifyContent: "center" }}>
        <Insignia icono={paso.icono} tam={78} />
        <Texto v="display">{paso.titulo}</Texto>
        <Texto v="cuerpo" style={{ fontSize: 17, lineHeight: 27 }}>
          {paso.texto}
        </Texto>
      </View>

      <View style={{ gap: E.gg }}>
        <View style={{ flexDirection: "row", gap: 7, justifyContent: "center" }}>
          {PASOS.map((p, n) => (
            <View
              key={p.icono}
              style={{
                width: n === i ? 22 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: n === i ? C.marca : C.linea,
              }}
            />
          ))}
        </View>
        <Boton texto={ultimo ? "Empezar" : "Siguiente"} onPress={() => (ultimo ? onListo() : setI(i + 1))} />
      </View>
    </View>
  );
}
