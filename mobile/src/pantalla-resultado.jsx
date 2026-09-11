// Detalle de una revisión: el veredicto, las señales encontradas una por una, y qué hacer ahora.

import { useState } from "react";
import { View } from "react-native";
import { consejoPara, SENAL } from "./consejos";
import { BANCO, PASOS } from "./contenido";
import { canalNombre, duracion, hora, recorte } from "./formato";
import { ICONO_SENAL } from "./iconos";
import { C, E, estiloVeredicto, R } from "./tema";
import { Aviso, Boton, Chip, EnlaceTexto, Icono, Insignia, Pasos, Seccion, Tarjeta, Texto } from "./ui";

function resumen(item) {
  const n = item.senales.length;
  if (item.veredicto === "no_legible") return "No pude leer el mensaje con claridad.";
  if (!n) return "No encontré señales conocidas de estafa.";
  return n === 1 ? "Encontré 1 señal en este mensaje." : `Encontré ${n} señales en este mensaje.`;
}

export function PantallaResultado({ item, alLlamar, alCopiar, alBorrar }) {
  const [todo, setTodo] = useState(false);
  const est = estiloVeredicto(item.veredicto);
  const consejo = consejoPara(item.veredicto);
  const pasos = PASOS[item.veredicto] || PASOS.no_legible;
  const texto = item.texto || "";
  const largo = texto.length > 260;

  return (
    <View style={{ gap: E.gg }}>
      <Tarjeta style={{ backgroundColor: est.fondo, borderColor: est.borde, gap: E.m }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: E.m }}>
          <Insignia icono={est.icono} color={est.color} fondo={C.blanco} tam={52} />
          <View style={{ flex: 1, gap: 2 }}>
            <Texto v="h1" color={est.color}>
              {consejo.etiqueta}
            </Texto>
            <Texto v="pequeno" color={C.tinta}>
              {resumen(item)}
            </Texto>
          </View>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: E.s }}>
          <Chip texto={item.remitente || canalNombre(item.canal)} fondo={C.blanco} color={C.gris} />
          <Chip
            texto={item.lector === "visionpsy" ? "Leído con VisionPsy" : "Reglas sobre el texto"}
            fondo={C.blanco}
            color={C.gris}
            icono={item.lector === "visionpsy" ? "ojo" : "check"}
          />
          <Chip texto={hora(item.ts)} fondo={C.blanco} color={C.gris} />
        </View>
      </Tarjeta>

      {item.lecturaDudosa ? (
        <Aviso
          icono="ojo"
          color={C.aviso}
          fondo={C.avisoSuave}
          borde={C.avisoBorde}
          texto="La dirección está a una o dos letras de la oficial. Puede ser un enlace disfrazado o una letra mal leída: compárala tú, letra por letra, antes de tocar nada."
        />
      ) : null}

      {item.senales.length ? (
        <Seccion titulo="Qué encontré">
          <View style={{ gap: E.s }}>
            {item.senales.map((s) => (
              <Tarjeta key={`${s.tipo}-${s.evidencia}`} style={{ flexDirection: "row", gap: E.m }}>
                <Insignia icono={ICONO_SENAL[s.tipo] || "alerta"} color={est.color} fondo={est.fondo} tam={38} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Texto v="h3">{SENAL[s.tipo] || s.tipo}</Texto>
                  <Texto v="pequeno">{s.evidencia}</Texto>
                </View>
              </Tarjeta>
            ))}
          </View>
        </Seccion>
      ) : null}

      <Seccion titulo="Qué hacer ahora">
        <Tarjeta>
          <Pasos pasos={pasos} color={est.color} fondo={est.fondo} />
        </Tarjeta>
      </Seccion>

      <View style={{ gap: E.s }}>
        <Boton texto={`Llamar al banco · ${BANCO.telefonos_oficiales[0]}`} icono="telefono" onPress={alLlamar} />
        <View style={{ flexDirection: "row", gap: E.s }}>
          <Boton
            texto="Copiar el reporte"
            icono="copiar"
            variante="secundario"
            onPress={alCopiar}
            style={{ flex: 1 }}
          />
          <Boton texto="Eliminar" icono="basura" variante="peligro" onPress={alBorrar} style={{ flex: 0.7 }} />
        </View>
      </View>

      {texto ? (
        <Seccion
          titulo="El mensaje revisado"
          accion={largo ? <EnlaceTexto texto={todo ? "VER MENOS" : "VER TODO"} onPress={() => setTodo(!todo)} /> : null}
        >
          <Tarjeta style={{ backgroundColor: C.panel2 }}>
            <Texto v="pequeno" color={C.tinta} style={{ fontSize: 15, lineHeight: 23 }}>
              {todo ? texto : recorte(texto, 260)}
            </Texto>
          </Tarjeta>
        </Seccion>
      ) : null}

      <View style={{ gap: E.xs, alignItems: "center", paddingTop: E.xs }}>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <Icono nombre="candado" tam={13} color={C.grisClaro} />
          <Texto v="micro">Analizado en este teléfono. El mensaje no salió de aquí.</Texto>
        </View>
        <Texto v="micro">
          {item.lector === "visionpsy"
            ? `VisionPsy Q8 · primer texto ${duracion(item.ttft)} · lectura ${duracion(item.msVision)}`
            : `Reglas del banco · ${duracion(item.ms)}`}
        </Texto>
      </View>

      <View style={{ height: R.ch }} />
    </View>
  );
}
