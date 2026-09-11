// App móvil: la misma experiencia del teléfono de la demo, corriendo en un teléfono. Tema claro, letra grande, una acción por pantalla.
// Marca Certiva (MEMORIA_PROYECTO.md): símbolo Enlace, wordmark en minúsculas con Manrope, azul #205094 y la paleta del escritorio.

import * as Clipboard from "expo-clipboard";
import { useFonts } from "expo-font";
import * as ImagePicker from "expo-image-picker";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { consejoPara, SENAL } from "./consejos";
import { analizarCaptura, analizarTexto, descargarVision, estadoVision } from "./motor";

// Paleta compartida con el escritorio (renderer/certiva.css).
const C = {
  fondo: "#f4f7fc",
  tinta: "#152e4e",
  gris: "#54677e",
  linea: "#dce5f1",
  acento: "#205094",
  malo: "#a3302a",
  maloSuave: "#fceae8",
  bien: "#205094",
  bienSuave: "#eaf1fb",
  aviso: "#895909",
  avisoSuave: "#fff3d9",
  neutro: "#526477",
  neutroSuave: "#edf1f5",
};
const COLOR = {
  fraude: [C.malo, C.maloSuave],
  sospechoso: [C.aviso, C.avisoSuave],
  sin_senales: [C.bien, C.bienSuave],
  no_legible: [C.neutro, C.neutroSuave],
};

// Manrope (OFL), la misma letra del escritorio. Hasta que carga, la del sistema con el mismo peso.
const FUENTES = {
  Manrope500: require("./assets/manrope-500.ttf"),
  Manrope700: require("./assets/manrope-700.ttf"),
  Manrope800: require("./assets/manrope-800.ttf"),
};
const FuentesListas = createContext(false);

// Texto con la fuente de marca. Con Manrope cargada, fontWeight vuelve a normal: Android engordaría la letra de forma
// sintética si se deja en 700 u 800.
function T({ peso = 500, style, ...props }) {
  const listas = useContext(FuentesListas);
  return <Text {...props} style={[style, listas && { fontFamily: `Manrope${peso}`, fontWeight: "normal" }]} />;
}

function Marca() {
  return (
    <View style={s.marca}>
      <Image source={require("./assets/marca.png")} style={s.marcaIcono} accessibilityLabel="Certiva" />
      <View>
        <T peso={800} style={s.wordmark}>
          certiva
        </T>
        <T style={s.descriptor}>Tu aliado contra el fraude</T>
      </View>
    </View>
  );
}

export default function App() {
  const [fuentes] = useFonts(FUENTES);
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
    <FuentesListas.Provider value={fuentes}>
      <SafeAreaView style={s.raiz}>
        <ScrollView contentContainerStyle={s.cuerpo}>
          <Marca />
          {pantalla === "inicio" && (
            <View style={s.col}>
              <T peso={700} style={s.cab}>
                Banco Demo · Protección
              </T>
              <T peso={800} style={s.h1}>
                ¿Te llegó algo raro?
              </T>
              <T style={s.lead}>
                Revísalo aquí antes de hacer nada. Todo se analiza en tu teléfono: nadie ve tu mensaje.
              </T>
              <TextInput
                style={s.caja}
                multiline
                placeholder="Pega aquí el texto del mensaje"
                placeholderTextColor={C.gris}
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
                <T style={s.reglaTxt}>
                  <T peso={700} style={{ color: C.tinta }}>
                    Regla de oro.{" "}
                  </T>
                  El banco nunca te pide tu clave ni el código que te llega por SMS. Nunca.
                </T>
              </View>
            </View>
          )}

          {pantalla === "descarga" && (
            <View style={s.col}>
              <T peso={700} style={s.h2}>
                Leer capturas necesita un modelo
              </T>
              <T style={s.lead}>
                Para leer capturas, el modelo vive en tu teléfono y nunca sale de él. Pesa{" "}
                {Math.round((vision.bytes || 0) / 1e6)} MB y se descarga una sola vez.
              </T>
              {progreso === null ? (
                <Boton texto="Descargar el lector" onPress={descargar} />
              ) : (
                <T style={s.lead}>Descargando… {progreso}%</T>
              )}
              <Boton texto="Ahora no" sec onPress={() => setPantalla("inicio")} />
              {estado ? <T style={s.mini}>{estado}</T> : null}
            </View>
          )}

          {pantalla === "analizando" && (
            <View style={s.col}>
              <T peso={700} style={s.h2}>
                Revisando el mensaje…
              </T>
              <ActivityIndicator size="large" color={C.acento} />
              <T style={s.lead}>{estado}</T>
              <T style={s.mini}>Tarda unos segundos. Nada sale de tu teléfono.</T>
            </View>
          )}

          {pantalla === "resultado" && resultado && <Resultado r={resultado} volver={() => setPantalla("inicio")} />}
        </ScrollView>
      </SafeAreaView>
    </FuentesListas.Provider>
  );
}

function Resultado({ r, volver }) {
  const tipo = r.veredicto || "no_legible";
  const c = consejoPara(tipo);
  const [color, fondo] = COLOR[tipo] || COLOR.no_legible;
  return (
    <View style={s.col}>
      <View style={[s.chip, { backgroundColor: fondo }]}>
        <T peso={800} style={[s.chipTxt, { color }]}>
          {c.etiqueta}
        </T>
      </View>
      {r.senales?.length ? (
        <View style={s.col}>
          <T style={s.lead}>Encontré estas señales en el mensaje:</T>
          {r.senales.map((x, i) => (
            <View key={`${x.tipo}-${i}`} style={s.razon}>
              <T peso={700} style={s.razonTit}>
                {SENAL[x.tipo] || x.tipo}
              </T>
              <T style={s.razonEv}>{x.evidencia}</T>
            </View>
          ))}
        </View>
      ) : (
        <T style={s.lead}>{tipo === "no_legible" ? "" : "No encontré señales de estafa en este mensaje."}</T>
      )}
      <View style={s.consejo}>
        <T style={s.consejoTxt}>{c.consejo}</T>
      </View>
      <T style={s.mini}>Canal oficial: {c.canalOficial}</T>
      <Boton texto={`Llamar al banco · ${c.telefono}`} onPress={() => {}} />
      <Boton texto="Volver al inicio" sec onPress={volver} />
      <T style={s.mini}>
        {r.lector === "visionpsy"
          ? `Leído con VisionPsy en tu teléfono · primer token ${r.ttft ?? "—"} ms · total ${r.msVision} ms`
          : `Reglas sobre el texto · ${r.ms} ms`}
      </T>
    </View>
  );
}

function Boton({ texto, onPress, sec }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.btn, sec && s.btnSec, pressed && { opacity: 0.85 }]}>
      <T peso={700} style={[s.btnTxt, sec && { color: C.acento }]}>
        {texto}
      </T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: C.fondo },
  cuerpo: { padding: 20, gap: 14 },
  col: { gap: 14 },
  fila: { flexDirection: "row", gap: 10 },
  marca: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 4 },
  marcaIcono: { width: 54, height: 54 },
  wordmark: { fontSize: 28, lineHeight: 32, fontWeight: "800", color: C.acento, letterSpacing: -0.5 },
  descriptor: { fontSize: 14, color: C.gris },
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
