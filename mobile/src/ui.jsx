// Piezas de interfaz compartidas por todas las pantallas: letra, botones, tarjetas, filas y estados vacíos.
// Todo el estilo sale de tema.js, así una pantalla nunca inventa un color ni un radio.

import { createContext, useContext } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ICONOS } from "./iconos";
import { C, E, R, SOMBRA } from "./tema";

// Manrope tarda unos milisegundos en cargar. Hasta entonces se usa la letra del sistema con el mismo peso, para que
// el texto no salte de tamaño ni quede en negrita sintética.
export const CtxFuentes = createContext(false);

const VARIANTES = {
  display: { fontSize: 30, lineHeight: 37, peso: "800", color: C.tinta, letterSpacing: -0.7 },
  h1: { fontSize: 24, lineHeight: 31, peso: "800", color: C.tinta, letterSpacing: -0.5 },
  h2: { fontSize: 19, lineHeight: 26, peso: "700", color: C.tinta, letterSpacing: -0.3 },
  h3: { fontSize: 16, lineHeight: 22, peso: "700", color: C.tinta },
  cuerpo: { fontSize: 16, lineHeight: 24, peso: "500", color: C.gris },
  cuerpoTinta: { fontSize: 16, lineHeight: 24, peso: "500", color: C.tinta },
  fuerte: { fontSize: 16, lineHeight: 24, peso: "700", color: C.tinta },
  pequeno: { fontSize: 14, lineHeight: 21, peso: "500", color: C.gris },
  pequenoFuerte: { fontSize: 14, lineHeight: 21, peso: "700", color: C.tinta },
  micro: { fontSize: 12, lineHeight: 17, peso: "600", color: C.grisClaro },
  seccion: { fontSize: 12, lineHeight: 16, peso: "700", color: C.grisClaro, letterSpacing: 1.1 },
  boton: { fontSize: 17, lineHeight: 22, peso: "700", color: C.blanco },
};

const sinFuente = StyleSheet.create(
  Object.fromEntries(Object.entries(VARIANTES).map(([k, v]) => [k, { ...v, fontWeight: v.peso, peso: undefined }])),
);
const conFuente = StyleSheet.create(
  Object.fromEntries(
    Object.entries(VARIANTES).map(([k, v]) => [k, { ...v, fontFamily: `Manrope${v.peso}`, peso: undefined }]),
  ),
);

export function Texto({ v = "cuerpo", color, style, children, ...props }) {
  const listas = useContext(CtxFuentes);
  const base = (listas ? conFuente : sinFuente)[v] || (listas ? conFuente : sinFuente).cuerpo;
  return (
    <Text {...props} style={[base, color ? { color } : null, style]}>
      {children}
    </Text>
  );
}

export function Icono({ nombre, tam = 22, color = C.gris, style }) {
  const fuente = ICONOS[nombre] || ICONOS.info;
  return <Image source={fuente} style={[{ width: tam, height: tam, tintColor: color }, style]} resizeMode="contain" />;
}

// Círculo de color con un icono dentro. Es la marca visual de una señal, un veredicto o una fila de ajustes.
export function Insignia({ icono, color = C.marca, fondo = C.marcaSuave, tam = 40, style }) {
  return (
    <View
      style={[
        { width: tam, height: tam, borderRadius: tam / 2, backgroundColor: fondo },
        { alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <Icono nombre={icono} tam={Math.round(tam * 0.52)} color={color} />
    </View>
  );
}

const b = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: E.s,
    borderRadius: R.s,
    borderWidth: 2,
    borderColor: "transparent",
    paddingHorizontal: E.gg,
  },
  g: { minHeight: 54 },
  m: { minHeight: 44, paddingHorizontal: E.m, borderRadius: R.ch },
  primario: { backgroundColor: C.marca },
  secundario: { backgroundColor: C.blanco, borderColor: C.marca },
  suave: { backgroundColor: C.marcaSuave },
  fantasma: { backgroundColor: "transparent" },
  peligro: { backgroundColor: C.blanco, borderColor: C.maloBorde },
  desactivado: { opacity: 0.45 },
});

const TINTA_BOTON = {
  primario: C.blanco,
  secundario: C.marca,
  suave: C.marca,
  fantasma: C.gris,
  peligro: C.malo,
};

export function Boton({ texto, onPress, variante = "primario", icono, tam = "g", cargando, desactivado, style }) {
  const tinta = TINTA_BOTON[variante] || C.blanco;
  const muerto = desactivado || cargando;
  return (
    <Pressable
      onPress={muerto ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={texto}
      android_ripple={{ color: `${tinta}22` }}
      style={({ pressed }) => [
        b.base,
        b[tam],
        b[variante],
        muerto && b.desactivado,
        pressed && !muerto && { opacity: 0.86 },
        style,
      ]}
    >
      {cargando ? <ActivityIndicator color={tinta} size="small" /> : null}
      {icono && !cargando ? <Icono nombre={icono} tam={tam === "m" ? 17 : 20} color={tinta} /> : null}
      <Texto v="boton" color={tinta} style={tam === "m" ? { fontSize: 15 } : null} numberOfLines={1}>
        {texto}
      </Texto>
    </Pressable>
  );
}

const t = StyleSheet.create({
  tarjeta: {
    backgroundColor: C.panel,
    borderRadius: R.m,
    borderWidth: 1,
    borderColor: C.linea,
    padding: E.g,
    gap: E.m,
    ...SOMBRA.panel,
  },
});

export function Tarjeta({ children, onPress, style, ...props }) {
  if (!onPress) {
    return (
      <View style={[t.tarjeta, style]} {...props}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#20509414" }}
      style={({ pressed }) => [t.tarjeta, pressed && { opacity: 0.9 }, style]}
      {...props}
    >
      {children}
    </Pressable>
  );
}

export function Chip({ texto, color = C.marca, fondo = C.marcaSuave, icono, style }) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start",
          backgroundColor: fondo,
          borderRadius: R.pastilla,
          paddingVertical: 6,
          paddingHorizontal: E.m,
        },
        style,
      ]}
    >
      {icono ? <Icono nombre={icono} tam={14} color={color} /> : null}
      <Texto v="micro" color={color} style={{ letterSpacing: 0.2 }}>
        {texto}
      </Texto>
    </View>
  );
}

export function Seccion({ titulo, accion, children, style }) {
  return (
    <View style={[{ gap: E.m }, style]}>
      {titulo || accion ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Texto v="seccion" style={{ textTransform: "uppercase" }}>
            {titulo}
          </Texto>
          {accion}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function EnlaceTexto({ texto, onPress, color = C.marca }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8}>
      <Texto v="micro" color={color} style={{ letterSpacing: 0.2 }}>
        {texto}
      </Texto>
    </Pressable>
  );
}

// Fila de lista con icono, título, subtítulo y algo a la derecha. Es la pieza de Historial y de Ajustes.
export function Fila({ icono, color, fondo, titulo, subtitulo, derecha, onPress, sinBorde, lineas = 2, style }) {
  const cuerpo = (
    <>
      {icono ? <Insignia icono={icono} color={color} fondo={fondo} tam={38} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Texto v="h3" numberOfLines={lineas}>
          {titulo}
        </Texto>
        {subtitulo ? (
          <Texto v="pequeno" numberOfLines={lineas}>
            {subtitulo}
          </Texto>
        ) : null}
      </View>
      {derecha ?? (onPress ? <Icono nombre="flecha" tam={18} color={C.grisClaro} /> : null)}
    </>
  );
  const estilo = [
    {
      flexDirection: "row",
      alignItems: "center",
      gap: E.m,
      paddingVertical: E.m,
      borderBottomWidth: sinBorde ? 0 : 1,
      borderBottomColor: C.linea,
    },
    style,
  ];
  if (!onPress) return <View style={estilo}>{cuerpo}</View>;
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#20509410" }}
      style={({ pressed }) => [estilo, pressed && { opacity: 0.85 }]}
    >
      {cuerpo}
    </Pressable>
  );
}

export function Campo({ valor, alCambiar, marcador, alto = 132, style }) {
  return (
    <TextInput
      value={valor}
      onChangeText={alCambiar}
      placeholder={marcador}
      placeholderTextColor={C.grisClaro}
      multiline
      textAlignVertical="top"
      style={[
        {
          minHeight: alto,
          backgroundColor: C.panel2,
          borderWidth: 1,
          borderColor: C.linea,
          borderRadius: R.s,
          padding: E.m,
          fontSize: 16,
          lineHeight: 23,
          color: C.tinta,
        },
        style,
      ]}
    />
  );
}

export function BarraProgreso({ valor = 0, color = C.marca }) {
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: C.linea, overflow: "hidden" }}>
      <View style={{ width: `${Math.max(2, Math.min(100, valor))}%`, height: 8, backgroundColor: color }} />
    </View>
  );
}

export function Aviso({ icono = "info", texto, color = C.marca, fondo = C.marcaSuave, borde = C.marcaBorde }) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: E.m,
        alignItems: "flex-start",
        backgroundColor: fondo,
        borderWidth: 1,
        borderColor: borde,
        borderRadius: R.s,
        padding: E.m,
      }}
    >
      <Icono nombre={icono} tam={19} color={color} style={{ marginTop: 1 }} />
      <Texto v="pequeno" color={C.tinta} style={{ flex: 1 }}>
        {texto}
      </Texto>
    </View>
  );
}

export function Vacio({ icono = "historial", titulo, texto, children }) {
  return (
    <View style={{ alignItems: "center", gap: E.m, paddingVertical: E.xxl, paddingHorizontal: E.gg }}>
      <Insignia icono={icono} tam={64} color={C.grisClaro} fondo={C.panel2} />
      <Texto v="h2" style={{ textAlign: "center" }}>
        {titulo}
      </Texto>
      <Texto v="pequeno" style={{ textAlign: "center" }}>
        {texto}
      </Texto>
      {children}
    </View>
  );
}

export function Separador({ style }) {
  return <View style={[{ height: 1, backgroundColor: C.linea }, style]} />;
}

// Lista de pasos numerados. La usan el resultado («qué hacer ahora») y la pantalla de aprender.
export function Pasos({ pasos, color = C.marca, fondo = C.marcaSuave }) {
  return (
    <View style={{ gap: E.m }}>
      {pasos.map((p, i) => (
        <View key={p} style={{ flexDirection: "row", gap: E.m, alignItems: "flex-start" }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: fondo,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 1,
            }}
          >
            <Texto v="micro" color={color}>
              {i + 1}
            </Texto>
          </View>
          <Texto v="cuerpo" color={C.tinta} style={{ flex: 1, fontSize: 15, lineHeight: 22 }}>
            {p}
          </Texto>
        </View>
      ))}
    </View>
  );
}
