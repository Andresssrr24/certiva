// Aprender: las señales que revisa el motor, explicadas con un ejemplo, y los canales oficiales del banco.
// El contenido sale de la política anti-fraude del emisor, no de un modelo.

import { useState } from "react";
import { View } from "react-native";
import { BANCO, CANALES, REGLA_DE_ORO, SENALES, SI_YA_CAISTE } from "./contenido";
import { ICONO_SENAL } from "./iconos";
import { C, E, R } from "./tema";
import { Chip, Fila, Icono, Insignia, Pasos, Seccion, Separador, Tarjeta, Texto } from "./ui";

function Senal({ senal, abierta, alTocar }) {
  return (
    <View>
      <Fila
        icono={ICONO_SENAL[senal.tipo] || "info"}
        titulo={senal.titulo}
        onPress={alTocar}
        sinBorde
        derecha={<Icono nombre={abierta ? "cerrar" : "mas"} tam={16} color={C.grisClaro} />}
        style={{ paddingVertical: E.m }}
      />
      {abierta ? (
        <View style={{ gap: E.s, paddingBottom: E.m, paddingLeft: 50 }}>
          <Texto v="pequeno">{senal.explicacion}</Texto>
          <View style={{ backgroundColor: C.panel2, borderRadius: R.ch, padding: E.m }}>
            <Texto v="micro" color={C.grisClaro}>
              ASÍ SE VE
            </Texto>
            <Texto v="pequeno" color={C.tinta} style={{ marginTop: 4 }}>
              {senal.ejemplo}
            </Texto>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function PantallaAprender() {
  const [abierta, setAbierta] = useState(null);
  return (
    <View style={{ gap: E.gg }}>
      <Tarjeta style={{ backgroundColor: C.marca, borderColor: C.marca, gap: E.m }}>
        <Chip texto="REGLA DE ORO" icono="candado" fondo="#ffffff22" color={C.blanco} />
        <Texto v="h2" color={C.blanco} style={{ fontSize: 20, lineHeight: 28 }}>
          {REGLA_DE_ORO}
        </Texto>
      </Tarjeta>

      <Seccion titulo={`Las ${SENALES.length} señales que reviso`}>
        <Tarjeta style={{ paddingVertical: 0, gap: 0 }}>
          {SENALES.map((s, i) => (
            <View key={s.tipo}>
              <Senal
                senal={s}
                abierta={abierta === s.tipo}
                alTocar={() => setAbierta(abierta === s.tipo ? null : s.tipo)}
              />
              {i === SENALES.length - 1 ? null : <Separador />}
            </View>
          ))}
        </Tarjeta>
        <Texto v="micro">
          Cada señal es una regla que corre en tu teléfono. Un mensaje con una sola señal fuerte ya es una estafa.
        </Texto>
      </Seccion>

      <Seccion titulo={`Canales oficiales de ${BANCO.nombre}`}>
        <Tarjeta style={{ paddingVertical: 0, gap: 0 }}>
          {CANALES.map((c, i) => (
            <Fila
              key={c.titulo}
              icono={c.icono}
              titulo={c.titulo}
              subtitulo={c.valor}
              sinBorde={i === CANALES.length - 1}
            />
          ))}
        </Tarjeta>
        <Texto v="micro">
          Escribe tú la dirección o marca tú el número. Nunca entres por un enlace que te llegó en un mensaje.
        </Texto>
      </Seccion>

      <Seccion titulo="Si ya compartiste algo">
        <Tarjeta style={{ backgroundColor: C.maloSuave, borderColor: C.maloBorde }}>
          <View style={{ flexDirection: "row", gap: E.m, alignItems: "center" }}>
            <Insignia icono="alerta" color={C.malo} fondo={C.blanco} tam={40} />
            <Texto v="h3" color={C.malo} style={{ flex: 1 }}>
              Actúa rápido: los primeros minutos cuentan.
            </Texto>
          </View>
          <Pasos pasos={SI_YA_CAISTE} color={C.malo} fondo={C.blanco} />
        </Tarjeta>
      </Seccion>

      <Texto v="micro" style={{ textAlign: "center" }}>
        {BANCO.nombre} es un banco de demostración. En una implementación real, estos canales son los del banco emisor.
      </Texto>
    </View>
  );
}
