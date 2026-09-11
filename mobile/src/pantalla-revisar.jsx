// Pantalla principal: pegar un mensaje o elegir una captura, y las últimas revisiones a mano.

import { View } from "react-native";
import { consejoPara } from "./consejos";
import { REGLA_DE_ORO } from "./contenido";
import { megas, recorte } from "./formato";
import { ICONO_SENAL } from "./iconos";
import { C, E, estiloVeredicto } from "./tema";
import { Boton, Campo, Chip, EnlaceTexto, Fila, Icono, Insignia, Seccion, Tarjeta, Texto } from "./ui";

export function PantallaRevisar({
  texto,
  alEscribir,
  alPegar,
  alVerificar,
  alElegirCaptura,
  vision,
  analizando,
  revisiones,
  alAbrir,
  alVerTodas,
}) {
  const hayTexto = texto.trim().length > 0;
  const ultimas = revisiones.slice(0, 3);
  return (
    <View style={{ gap: E.gg }}>
      <View style={{ gap: E.s }}>
        <Texto v="display">¿Te llegó algo raro?</Texto>
        <Texto v="cuerpo" style={{ fontSize: 17, lineHeight: 26 }}>
          Revísalo antes de hacer nada. Te digo qué señales tiene y qué hacer con él.
        </Texto>
      </View>

      <Tarjeta style={{ gap: E.m }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Texto v="seccion" style={{ textTransform: "uppercase" }}>
            El mensaje
          </Texto>
          {hayTexto ? <EnlaceTexto texto="LIMPIAR" onPress={() => alEscribir("")} color={C.grisClaro} /> : null}
        </View>
        <Campo valor={texto} alCambiar={alEscribir} marcador="Pega aquí el texto del mensaje que te llegó" />
        <View style={{ flexDirection: "row", gap: E.s }}>
          <Boton texto="Pegar" icono="pegar" variante="secundario" tam="m" onPress={alPegar} style={{ flex: 1 }} />
          <Boton
            texto="Verificar"
            icono="revisar"
            tam="m"
            onPress={() => alVerificar(texto)}
            desactivado={!hayTexto}
            cargando={analizando === "texto"}
            style={{ flex: 1.4 }}
          />
        </View>
      </Tarjeta>

      <Tarjeta onPress={alElegirCaptura} style={{ flexDirection: "row", alignItems: "center", gap: E.m }}>
        <Insignia icono="captura" tam={44} />
        <View style={{ flex: 1, gap: 3 }}>
          <Texto v="h3">Revisar una captura</Texto>
          <Texto v="pequeno">
            {vision.enCache
              ? "El lector ya está en tu teléfono. Lee la imagen aquí dentro."
              : `Descarga el lector una sola vez · ${megas(vision.bytes)}`}
          </Texto>
        </View>
        {analizando === "captura" ? null : <Icono nombre="flecha" tam={18} color={C.grisClaro} />}
      </Tarjeta>

      {ultimas.length ? (
        <Seccion titulo="Últimas revisiones" accion={<EnlaceTexto texto="VER TODAS" onPress={alVerTodas} />}>
          <Tarjeta style={{ paddingVertical: 0, gap: 0 }}>
            {ultimas.map((r, i) => {
              const est = estiloVeredicto(r.veredicto);
              return (
                <Fila
                  key={r.id}
                  icono={ICONO_SENAL[r.senales[0]?.tipo] || est.icono}
                  color={est.color}
                  fondo={est.fondo}
                  titulo={consejoPara(r.veredicto).etiqueta}
                  subtitulo={recorte(r.texto, 64) || "Sin texto legible"}
                  onPress={() => alAbrir(r)}
                  sinBorde={i === ultimas.length - 1}
                />
              );
            })}
          </Tarjeta>
        </Seccion>
      ) : null}

      <Tarjeta style={{ backgroundColor: C.marcaSuave, borderColor: C.marcaBorde, gap: E.s }}>
        <Chip texto="REGLA DE ORO" icono="candado" fondo={C.blanco} />
        <Texto v="cuerpo" color={C.tinta} style={{ fontSize: 15, lineHeight: 23 }}>
          {REGLA_DE_ORO}
        </Texto>
      </Tarjeta>

      <View
        style={{ flexDirection: "row", gap: E.s, alignItems: "center", justifyContent: "center", paddingTop: E.xs }}
      >
        <Icono nombre="candado" tam={14} color={C.grisClaro} />
        <Texto v="micro">Todo se analiza en este teléfono. Nada se envía.</Texto>
      </View>
    </View>
  );
}
