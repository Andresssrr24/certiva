// Historial: todo lo revisado en este teléfono, agrupado por día y filtrable por veredicto.

import { useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { consejoPara } from "./consejos";
import { diaEtiqueta, hora, recorte } from "./formato";
import { ICONO_SENAL } from "./iconos";
import { C, E, estiloVeredicto, R } from "./tema";
import { EnlaceTexto, Fila, Seccion, Tarjeta, Texto, Vacio } from "./ui";

const FILTROS = [
  { id: "todas", texto: "Todas" },
  { id: "fraude", texto: "Estafas" },
  { id: "sospechoso", texto: "Sospechosas" },
  { id: "sin_senales", texto: "Sin señales" },
];

function Filtro({ activo, texto, cuenta, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#20509414", borderless: false }}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 9,
          paddingHorizontal: E.m,
          borderRadius: R.pastilla,
          borderWidth: 1,
          backgroundColor: activo ? C.marca : C.panel,
          borderColor: activo ? C.marca : C.linea,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Texto v="micro" color={activo ? C.blanco : C.gris}>
        {texto}
      </Texto>
      <Texto v="micro" color={activo ? "#ffffffaa" : C.grisClaro}>
        {cuenta}
      </Texto>
    </Pressable>
  );
}

export function PantallaHistorial({ revisiones, alAbrir, alVaciar }) {
  const [filtro, setFiltro] = useState("todas");

  const cuentas = useMemo(() => {
    const c = { todas: revisiones.length, fraude: 0, sospechoso: 0, sin_senales: 0 };
    for (const r of revisiones) if (c[r.veredicto] !== undefined) c[r.veredicto] += 1;
    return c;
  }, [revisiones]);

  const grupos = useMemo(() => {
    const lista = filtro === "todas" ? revisiones : revisiones.filter((r) => r.veredicto === filtro);
    const porDia = [];
    for (const r of lista) {
      const etiqueta = diaEtiqueta(r.ts);
      const ultimo = porDia[porDia.length - 1];
      if (ultimo && ultimo.etiqueta === etiqueta) ultimo.items.push(r);
      else porDia.push({ etiqueta, items: [r] });
    }
    return porDia;
  }, [revisiones, filtro]);

  const confirmarVaciado = () => {
    Alert.alert(
      "Vaciar el historial",
      "Se borran todas las revisiones guardadas en este teléfono. No se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Vaciar", style: "destructive", onPress: alVaciar },
      ],
    );
  };

  if (!revisiones.length) {
    return (
      <Vacio
        icono="historial"
        titulo="Todavía no has revisado nada"
        texto="Cuando revises un mensaje o una captura, queda guardado aquí para que puedas volver a verlo."
      />
    );
  }

  return (
    <View style={{ gap: E.gg }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: E.s }}>
        {FILTROS.map((f) => (
          <Filtro
            key={f.id}
            texto={f.texto}
            cuenta={cuentas[f.id] ?? 0}
            activo={filtro === f.id}
            onPress={() => setFiltro(f.id)}
          />
        ))}
      </View>

      {grupos.length ? (
        grupos.map((g) => (
          <Seccion key={g.etiqueta} titulo={g.etiqueta}>
            <Tarjeta style={{ paddingVertical: 0, gap: 0 }}>
              {g.items.map((r, i) => {
                const est = estiloVeredicto(r.veredicto);
                return (
                  <Fila
                    key={r.id}
                    icono={ICONO_SENAL[r.senales[0]?.tipo] || est.icono}
                    color={est.color}
                    fondo={est.fondo}
                    titulo={consejoPara(r.veredicto).etiqueta}
                    subtitulo={recorte(r.texto, 60) || "Sin texto legible"}
                    derecha={<Texto v="micro">{hora(r.ts)}</Texto>}
                    onPress={() => alAbrir(r)}
                    sinBorde={i === g.items.length - 1}
                  />
                );
              })}
            </Tarjeta>
          </Seccion>
        ))
      ) : (
        <Vacio
          icono="check"
          titulo="Nada en este filtro"
          texto="Prueba con otro filtro para ver el resto de revisiones."
        />
      )}

      <View style={{ alignItems: "center", paddingTop: E.s }}>
        <EnlaceTexto texto="VACIAR EL HISTORIAL" onPress={confirmarVaciado} color={C.malo} />
      </View>
    </View>
  );
}
