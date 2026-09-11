// App móvil: la misma experiencia del teléfono de la demo, corriendo en un teléfono. Tema claro, letra grande, una acción por pantalla.
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { analizarCaptura, analizarTexto, descargarVision, estadoVision } from "./motor";
import { consejoPara, SENAL } from "./consejos";

const C = {
  fondo: "#f5f7f6",
  tinta: "#14201e",
  gris: "#5b6764",
  linea: "#dfe5e2",
  acento: "#0e5e63",
  malo: "#a3302a",
  maloSuave: "#f7dedc",
  bien: "#1e7a4b",
  bienSuave: "#ddf0e4",
  aviso: "#8a5d0c",
  avisoSuave: "#f6ebd0",
};
const COLOR = {
  fraude: [C.malo, C.maloSuave],
  sospechoso: [C.aviso, C.avisoSuave],
  sin_senales: [C.bien, C.bienSuave],
  no_legible: [C.gris, C.linea],
};

export default function App() {
  const [pantalla, setPantalla] = useState("inicio");
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState(null);
  const [vision, setVision] = useState({ disponible: false, enCache: false, bytes: 0 });
  const [progreso, setProgreso] = useState(null);
  const [estado, setEstado] = useState("");

  useEffect(() => {
    estadoVision()
      .then(setVision)
      .catch(() => setVision({ disponible: false }));
  }, []);

  const verTexto = (t) => {
    const r = analizarTexto(t);
    setResultado(r);
    setPantalla("resultado");
  };

  const pegar = async () => {
    const t = await Clipboard.getStringAsync();
    setTexto(t || "");
  };

  const elegirCaptura = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) return;
    const sel = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (sel.canceled || !sel.assets?.length) return;
    if (!vision.enCache) {
      setPantalla("descarga");
      return;
    }
    setPantalla("analizando");
    setEstado("Leyendo la captura en tu teléfono…");
    try {
      const r = await analizarCaptura(sel.assets[0].uri, (p) => setEstado(`Preparando el lector ${Math.round(p)}%`));
      setResultado(r);
      setPantalla("resultado");
    } catch (e) {
      setResultado({ ok: false, veredicto: "no_legible", senales: [], error: String(e.message || e) });
      setPantalla("resultado");
    }
  };

  const descargar = async () => {
    setProgreso(0);
    try {
      await descargarVision((p) => setProgreso(Math.round(p)));
      setVision({ ...vision, enCache: true });
      setPantalla("inicio");
    } catch (e) {
      setEstado(`No se pudo descargar: ${e.message || e}`);
    } finally {
      setProgreso(null);
    }
  };

  return (
    <SafeAreaView style={s.raiz}>
      <ScrollView contentContainerStyle={s.cuerpo}>
        {pantalla === "inicio" && (
          <View style={s.col}>
            <Text style={s.cab}>Banco Demo · Protección</Text>
            <Text style={s.h1}>¿Te llegó algo raro?</Text>
            <Text style={s.lead}>
              Revísalo aquí antes de hacer nada. Todo se analiza en tu teléfono: nadie ve tu mensaje.
            </Text>
            <TextInput
              style={s.caja}
              multiline
              placeholder="Pega aquí el texto del mensaje"
              value={texto}
              onChangeText={setTexto}
            />
            <View style={s.fila}>
              <Boton texto="Pegar" sec onPress={pegar} />
              <Boton texto="Verificar el texto" onPress={() => texto.trim() && verTexto(texto)} />
            </View>
            <Boton
              texto={vision.enCache ? "Verificar una captura" : "Verificar una captura (descarga el lector)"}
              sec
              onPress={elegirCaptura}
            />
            <View style={s.regla}>
              <Text style={s.reglaTxt}>
                <Text style={{ fontWeight: "700", color: C.tinta }}>Regla de oro. </Text>El banco nunca te pide tu clave
                ni el código que te llega por SMS. Nunca.
              </Text>
            </View>
          </View>
        )}

        {pantalla === "descarga" && (
          <View style={s.col}>
            <Text style={s.h2}>Leer capturas necesita un modelo</Text>
            <Text style={s.lead}>
              Para leer capturas, el modelo vive en tu teléfono y nunca sale de él. Pesa{" "}
              {Math.round((vision.bytes || 0) / 1e6)} MB y se descarga una sola vez.
            </Text>
            {progreso === null ? (
              <Boton texto="Descargar el lector" onPress={descargar} />
            ) : (
              <Text style={s.lead}>Descargando… {progreso}%</Text>
            )}
            <Boton texto="Ahora no" sec onPress={() => setPantalla("inicio")} />
            {estado ? <Text style={s.mini}>{estado}</Text> : null}
          </View>
        )}

        {pantalla === "analizando" && (
          <View style={s.col}>
            <Text style={s.h2}>Revisando el mensaje…</Text>
            <ActivityIndicator size="large" color={C.acento} />
            <Text style={s.lead}>{estado}</Text>
            <Text style={s.mini}>Tarda unos segundos. Nada sale de tu teléfono.</Text>
          </View>
        )}

        {pantalla === "resultado" && resultado && <Resultado r={resultado} volver={() => setPantalla("inicio")} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Resultado({ r, volver }) {
  const tipo = r.veredicto || "no_legible";
  const c = consejoPara(tipo);
  const [color, fondo] = COLOR[tipo] || COLOR.no_legible;
  return (
    <View style={s.col}>
      <View style={[s.chip, { backgroundColor: fondo }]}>
        <Text style={[s.chipTxt, { color }]}>{c.etiqueta}</Text>
      </View>
      {r.senales?.length ? (
        <View style={s.col}>
          <Text style={s.lead}>Encontré estas señales en el mensaje:</Text>
          {r.senales.map((x, i) => (
            <View key={`${x.tipo}-${i}`} style={s.razon}>
              <Text style={s.razonTit}>{SENAL[x.tipo] || x.tipo}</Text>
              <Text style={s.razonEv}>{x.evidencia}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={s.lead}>{tipo === "no_legible" ? "" : "No encontré señales de estafa en este mensaje."}</Text>
      )}
      <View style={s.consejo}>
        <Text style={s.consejoTxt}>{c.consejo}</Text>
      </View>
      <Text style={s.mini}>Canal oficial: {c.canalOficial}</Text>
      <Boton texto={`Llamar al banco · ${c.telefono}`} onPress={() => {}} />
      <Boton texto="Volver al inicio" sec onPress={volver} />
      <Text style={s.mini}>
        {r.lector === "visionpsy"
          ? `Leído con VisionPsy en tu teléfono · primer token ${r.ttft ?? "—"} ms · total ${r.msVision} ms`
          : `Reglas sobre el texto · ${r.ms} ms`}
      </Text>
    </View>
  );
}

function Boton({ texto, onPress, sec }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.btn, sec && s.btnSec, pressed && { opacity: 0.85 }]}>
      <Text style={[s.btnTxt, sec && { color: C.acento }]}>{texto}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: C.fondo },
  cuerpo: { padding: 20, gap: 14 },
  col: { gap: 14 },
  fila: { flexDirection: "row", gap: 10 },
  cab: { fontSize: 15, color: C.gris, fontWeight: "600" },
  h1: { fontSize: 30, fontWeight: "800", color: C.tinta, lineHeight: 34 },
  h2: { fontSize: 24, fontWeight: "700", color: C.tinta },
  lead: { fontSize: 18, color: C.gris, lineHeight: 26 },
  mini: { fontSize: 14, color: C.gris },
  caja: {
    minHeight: 110,
    backgroundColor: "#fff",
    borderColor: C.linea,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 17,
    color: C.tinta,
    textAlignVertical: "top",
  },
  btn: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: C.acento,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    flexGrow: 1,
  },
  btnSec: { backgroundColor: "#fff", borderWidth: 2, borderColor: C.acento },
  btnTxt: { color: "#fff", fontSize: 18, fontWeight: "700" },
  regla: { marginTop: 8, backgroundColor: "#fff", borderColor: C.linea, borderWidth: 1, borderRadius: 14, padding: 14 },
  reglaTxt: { fontSize: 16, color: C.gris },
  chip: { alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999 },
  chipTxt: { fontSize: 24, fontWeight: "800" },
  razon: { backgroundColor: "#fff", borderColor: C.linea, borderWidth: 1, borderRadius: 14, padding: 12, gap: 4 },
  razonTit: { fontSize: 17, fontWeight: "700", color: C.tinta },
  razonEv: { fontSize: 14, color: C.gris },
  consejo: { backgroundColor: "#fff", borderLeftWidth: 4, borderLeftColor: C.acento, borderRadius: 12, padding: 14 },
  consejoTxt: { fontSize: 18, color: C.tinta, lineHeight: 26 },
});
