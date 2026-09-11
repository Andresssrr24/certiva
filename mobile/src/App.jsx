// Certiva en el teléfono. El armazón de la app: marca arriba, cuatro pestañas abajo, y el detalle de una revisión
// encima de todo. El motor (reglas + VisionPsy) corre aquí dentro; esta capa solo decide qué se ve.

import * as Clipboard from "expo-clipboard";
import { useFonts } from "expo-font";
import * as ImagePicker from "expo-image-picker";
import { StatusBar as BarraEstado } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import * as almacen from "./almacen";
import { consejoPara, SENAL } from "./consejos";
import { BANCO, PASOS } from "./contenido";
import { hora, megas } from "./formato";
import { analizarCaptura, analizarTexto, descargarVision, estadoVision } from "./motor";
import { PantallaAjustes } from "./pantalla-ajustes";
import { PantallaAprender } from "./pantalla-aprender";
import { PantallaBienvenida } from "./pantalla-bienvenida";
import { PantallaHistorial } from "./pantalla-historial";
import { PantallaResultado } from "./pantalla-resultado";
import { PantallaRevisar } from "./pantalla-revisar";
import { C, E, R, SOMBRA } from "./tema";
import { Boton, Chip, CtxFuentes, Icono, Insignia, Texto } from "./ui";

const PESTANAS = [
  { id: "revisar", texto: "Revisar", icono: "revisar" },
  { id: "historial", texto: "Historial", icono: "historial" },
  { id: "aprender", texto: "Aprender", icono: "aprender" },
  { id: "ajustes", texto: "Ajustes", icono: "ajustes" },
];

// El texto que se copia al portapapeles: el veredicto, las señales y qué hacer. Sirve para reenviarlo a un
// familiar o para llevarlo al banco.
function reporteDe(item) {
  const lineas = [
    `Certiva · ${consejoPara(item.veredicto).etiqueta}`,
    hora(item.ts),
    "",
    item.senales.length ? "Señales encontradas:" : "No se encontraron señales conocidas.",
    ...item.senales.map((s) => `- ${SENAL[s.tipo] || s.tipo}: ${s.evidencia}`),
    "",
    "Qué hacer:",
    ...(PASOS[item.veredicto] || PASOS.no_legible).map((p, i) => `${i + 1}. ${p}`),
    "",
    `Canal oficial: ${BANCO.canal_oficial}`,
    "",
    "Revisado en el teléfono con Certiva. El mensaje no se envió a ningún servidor.",
  ];
  return lineas.join("\n");
}

function BarraSuperior({ detalle, alVolver }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 10,
        paddingHorizontal: E.g,
        backgroundColor: C.panel,
        borderBottomWidth: 1,
        borderBottomColor: C.linea,
        flexDirection: "row",
        alignItems: "center",
        gap: E.m,
      }}
    >
      {detalle ? (
        <>
          <Pressable
            onPress={alVolver}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            android_ripple={{ color: "#20509420", borderless: true, radius: 22 }}
          >
            <Icono nombre="atras" tam={24} color={C.tinta} />
          </Pressable>
          <Texto v="h2" style={{ flex: 1 }}>
            La revisión
          </Texto>
        </>
      ) : (
        <>
          <Image source={require("./assets/marca.png")} style={{ width: 40, height: 40 }} />
          <View style={{ flex: 1 }}>
            <Texto v="h2" color={C.marca} style={{ fontSize: 22, letterSpacing: -0.6 }}>
              certiva
            </Texto>
            <Texto v="micro">Tu aliado contra el fraude</Texto>
          </View>
          <Chip texto="TODO LOCAL" icono="candado" />
        </>
      )}
    </View>
  );
}

function BarraPestanas({ tab, alCambiar }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: C.panel,
        borderTopWidth: 1,
        borderTopColor: C.linea,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 10),
        ...SOMBRA.flotante,
      }}
    >
      {PESTANAS.map((p) => {
        const activa = tab === p.id;
        return (
          <Pressable
            key={p.id}
            onPress={() => alCambiar(p.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={p.texto}
            android_ripple={{ color: "#20509414", borderless: false }}
            style={{ flex: 1, alignItems: "center", gap: 3, paddingVertical: 4 }}
          >
            <View
              style={{
                paddingHorizontal: 18,
                paddingVertical: 4,
                borderRadius: R.pastilla,
                backgroundColor: activa ? C.marcaSuave : "transparent",
              }}
            >
              <Icono nombre={p.icono} tam={23} color={activa ? C.marca : C.grisClaro} />
            </View>
            <Texto v="micro" color={activa ? C.marca : C.grisClaro} style={{ fontSize: 11 }}>
              {p.texto}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

function Cargando({ titulo, detalle }) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: "#f4f7fcf2", alignItems: "center", justifyContent: "center", gap: E.g, padding: E.xl },
      ]}
    >
      <Insignia icono="ojo" tam={80} />
      <Texto v="h2" style={{ textAlign: "center" }}>
        {titulo}
      </Texto>
      <ActivityIndicator size="large" color={C.marca} />
      <Texto v="pequeno" style={{ textAlign: "center" }}>
        {detalle}
      </Texto>
      <Chip texto="NADA SALE DE TU TELÉFONO" icono="candado" />
    </View>
  );
}

function HojaDescarga({ visible, vision, progreso, alDescargar, alCerrar }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={alCerrar}>
      <View style={{ flex: 1, backgroundColor: "#152e4e66", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: C.panel,
            borderTopLeftRadius: R.g,
            borderTopRightRadius: R.g,
            padding: E.xl,
            paddingBottom: Math.max(insets.bottom, E.gg) + E.s,
            gap: E.g,
          }}
        >
          <View style={{ alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: C.linea }} />
          <Insignia icono="descargar" tam={56} />
          <Texto v="h1">Leer capturas necesita el lector</Texto>
          <Texto v="cuerpo">
            El lector vive en tu teléfono y nunca sale de él. Pesa {megas(vision.bytes)} y se descarga una sola vez.
            Después funciona sin señal.
          </Texto>
          {progreso === null ? (
            <View style={{ gap: E.s }}>
              <Boton texto="Descargar el lector" icono="descargar" onPress={alDescargar} />
              <Boton texto="Ahora no" variante="fantasma" onPress={alCerrar} />
            </View>
          ) : (
            <View style={{ gap: E.s }}>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: C.linea, overflow: "hidden" }}>
                <View style={{ width: `${Math.max(2, progreso)}%`, height: 8, backgroundColor: C.marca }} />
              </View>
              <Texto v="pequeno">Descargando… {Math.round(progreso)}%</Texto>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Aviso({ texto }) {
  const insets = useSafeAreaInsets();
  if (!texto) return null;
  return (
    <View style={{ position: "absolute", left: E.gg, right: E.gg, bottom: insets.bottom + 96, alignItems: "center" }}>
      <View
        style={{ backgroundColor: C.tinta, borderRadius: R.pastilla, paddingVertical: 10, paddingHorizontal: E.gg }}
      >
        <Texto v="pequenoFuerte" color={C.blanco}>
          {texto}
        </Texto>
      </View>
    </View>
  );
}

function Armazon() {
  const [listo, setListo] = useState(false);
  const [bienvenida, setBienvenida] = useState(false);
  const [tab, setTab] = useState("revisar");
  const [detalle, setDetalle] = useState(null);
  const [revisiones, setRevisiones] = useState([]);
  const [texto, setTexto] = useState("");
  const [vision, setVision] = useState({ disponible: false, enCache: false, bytes: 0 });
  const [analizando, setAnalizando] = useState(null);
  const [estado, setEstado] = useState("");
  const [progreso, setProgreso] = useState(null);
  const [hoja, setHoja] = useState(false);
  const [aviso, setAviso] = useState("");
  const scroll = useRef(null);
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    almacen.cargar().then(() => {
      setRevisiones(almacen.revisiones());
      setBienvenida(!almacen.inicioVisto());
      setListo(true);
    });
    estadoVision()
      .then(setVision)
      .catch(() => setVision({ disponible: false, enCache: false, bytes: 0 }));
  }, []);

  // Cada cambio de pantalla entra con un movimiento corto: da a entender que se avanzó, sin hacer esperar.
  const pantallaActual = detalle ? `d-${detalle.id}` : tab;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [pantallaActual, anim]);

  const volver = useCallback(() => setDetalle(null), []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (detalle) {
        volver();
        return true;
      }
      if (tab !== "revisar") {
        setTab("revisar");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [detalle, tab, volver]);

  const avisar = useCallback((t) => {
    setAviso(t);
    setTimeout(() => setAviso(""), 2400);
  }, []);

  const guardarYAbrir = useCallback((r) => {
    const item = almacen.guardarRevision(r);
    setRevisiones(almacen.revisiones());
    setDetalle(item);
    return item;
  }, []);

  const verificarTexto = useCallback(
    (t) => {
      if (!t.trim()) return;
      guardarYAbrir(analizarTexto(t));
      setTexto("");
    },
    [guardarYAbrir],
  );

  const pegar = useCallback(async () => {
    const t = await Clipboard.getStringAsync();
    if (t) setTexto(t);
    else avisar("No hay nada copiado");
  }, [avisar]);

  const elegirCaptura = useCallback(async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      avisar("Necesito permiso para abrir tus fotos");
      return;
    }
    const sel = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (sel.canceled || !sel.assets?.length) return;
    if (!vision.enCache) {
      setHoja(true);
      return;
    }
    setAnalizando("captura");
    setEstado("Leyendo el texto de la imagen…");
    try {
      const r = await analizarCaptura(sel.assets[0].uri, (p) => setEstado(`Preparando el lector · ${Math.round(p)}%`));
      guardarYAbrir(r);
    } catch (e) {
      guardarYAbrir({ veredicto: "no_legible", senales: [], crudo: "", error: String(e.message || e) });
    } finally {
      setAnalizando(null);
      setEstado("");
    }
  }, [avisar, guardarYAbrir, vision.enCache]);

  const descargar = useCallback(async () => {
    setProgreso(0);
    try {
      await descargarVision((p) => setProgreso(Math.round(p)));
      setVision((v) => ({ ...v, enCache: true }));
      setHoja(false);
      avisar("Lector listo. Ya puedes revisar capturas.");
    } catch (e) {
      avisar(`No se pudo descargar: ${e.message || e}`);
    } finally {
      setProgreso(null);
    }
  }, [avisar]);

  const borrar = useCallback((id) => {
    almacen.borrarRevision(id);
    setRevisiones(almacen.revisiones());
    setDetalle(null);
  }, []);

  const vaciar = useCallback(() => {
    almacen.vaciarHistorial();
    setRevisiones(almacen.revisiones());
  }, []);

  const llamar = useCallback(() => {
    Linking.openURL(`tel:${BANCO.telefonos_oficiales[0].replace(/\s/g, "")}`).catch(() =>
      avisar("No pude abrir el teléfono"),
    );
  }, [avisar]);

  const copiar = useCallback(
    async (item) => {
      await Clipboard.setStringAsync(reporteDe(item));
      avisar("Reporte copiado");
    },
    [avisar],
  );

  const cuerpo = useMemo(() => {
    if (detalle) {
      return (
        <PantallaResultado
          item={detalle}
          alLlamar={llamar}
          alCopiar={() => copiar(detalle)}
          alBorrar={() => borrar(detalle.id)}
        />
      );
    }
    if (tab === "historial") {
      return <PantallaHistorial revisiones={revisiones} alAbrir={setDetalle} alVaciar={vaciar} />;
    }
    if (tab === "aprender") return <PantallaAprender />;
    if (tab === "ajustes") {
      return (
        <PantallaAjustes
          vision={vision}
          progreso={progreso}
          alDescargar={descargar}
          revisiones={revisiones}
          alVaciar={vaciar}
        />
      );
    }
    return (
      <PantallaRevisar
        texto={texto}
        alEscribir={setTexto}
        alPegar={pegar}
        alVerificar={verificarTexto}
        alElegirCaptura={elegirCaptura}
        vision={vision}
        analizando={analizando}
        revisiones={revisiones}
        alAbrir={setDetalle}
        alVerTodas={() => setTab("historial")}
      />
    );
  }, [
    analizando,
    borrar,
    copiar,
    descargar,
    detalle,
    elegirCaptura,
    llamar,
    pegar,
    progreso,
    revisiones,
    tab,
    texto,
    vaciar,
    verificarTexto,
    vision,
  ]);

  if (!listo) return <View style={{ flex: 1, backgroundColor: C.fondo }} />;

  if (bienvenida) {
    return (
      <View style={{ flex: 1, backgroundColor: C.fondo }}>
        <PantallaBienvenida
          onListo={() => {
            almacen.marcarInicioVisto();
            setBienvenida(false);
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.fondo }}>
      <BarraSuperior detalle={detalle} alVolver={volver} />
      <Animated.View
        style={{
          flex: 1,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }}
      >
        <ScrollView
          ref={scroll}
          contentContainerStyle={{ padding: E.g, paddingBottom: E.xxl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {cuerpo}
        </ScrollView>
      </Animated.View>
      <BarraPestanas
        tab={tab}
        alCambiar={(id) => {
          setDetalle(null);
          setTab(id);
        }}
      />
      <Aviso texto={aviso} />
      {analizando === "captura" ? <Cargando titulo="Revisando la captura…" detalle={estado} /> : null}
      <HojaDescarga
        visible={hoja}
        vision={vision}
        progreso={progreso}
        alDescargar={descargar}
        alCerrar={() => setHoja(false)}
      />
    </View>
  );
}

export default function App() {
  const [fuentes] = useFonts({
    Manrope400: require("./assets/manrope-400.ttf"),
    Manrope500: require("./assets/manrope-500.ttf"),
    Manrope600: require("./assets/manrope-600.ttf"),
    Manrope700: require("./assets/manrope-700.ttf"),
    Manrope800: require("./assets/manrope-800.ttf"),
  });
  return (
    <SafeAreaProvider>
      <CtxFuentes.Provider value={fuentes}>
        <BarraEstado style="dark" />
        <Armazon />
      </CtxFuentes.Provider>
    </SafeAreaProvider>
  );
}
