// frontend/src/theme/ganadoTokens.js
// ============================================================================
// GanadoSoft · Design tokens — FUENTE ÚNICA DE VERDAD del dashboard
// ----------------------------------------------------------------------------
// Valores extraídos de la referencia de diseño (ganadosoft-dashboard.html) y
// del brief de migración. Cualquier ajuste visual del dashboard se hace ACÁ,
// nunca hardcodeando colores/medidas dentro de los componentes.
//
// Consumo:
//   - Directo:   import { ganado } from '../theme/ganadoTokens'
//   - Vía theme: theme.ganado.*  (inyección aditiva en ThemeContext)
// Es un objeto JS plano, agnóstico del framework.
// ============================================================================

export const ganado = {
  // ---- Superficies (dejan respirar el verde) ----
  color: {
    bg: '#EDF1E8',
    surface: '#FFFFFF',
    surface2: '#F3F8F1',

    // ---- Sidebar ----
    sidebar: '#193A22',
    sidebarHover: '#245231',
    sidebarActive: '#3E8049',

    // ---- Líneas ----
    line: '#E4E8DC',
    lineStrong: '#D3DAC8',

    // ---- Marca (verde pasto, vivo) ----
    primary: '#2F8F45',
    primary600: '#25703A',
    primaryTint: '#DEF1E1',

    // ---- Cielo del llano (compañero secundario) ----
    sky: '#2E86C1',
    sky600: '#2477A6',
    skyBg: '#E3F1F9',

    // ---- Tinta ----
    ink: '#22271F',
    muted: '#5F6A5C',
    muted2: '#8A9285',
  },

  // ---- Semántico (el ocre confinado a alertas) ----
  // info === sky (ingresos/producción azul cielo)
  semantic: {
    good: { fg: '#3E9E4C', bg: '#E4F4E4' },
    warn: { fg: '#E0A020', bg: '#FBEEC7' },
    crit: { fg: '#D24B2E', bg: '#FBE2D9' },
    info: { fg: '#2E86C1', bg: '#E3F1F9' },
  },

  // ---- Finance hero (gradiente verde oscuro + tintes de texto sobre él) ----
  // Valores exactos del HTML (.fin-card.hero). Número SIEMPRE en blanco.
  financeHero: {
    gradFrom: '#2E8B44',
    gradTo: '#1F6733',
    text: '#FFFFFF',   // valor del balance (blanco sobre verde)
    label: '#B9D3B4',
    icon: '#CFE6CA',
    sub: '#A8C7A3',
    subUp: '#9BDB92',  // balance positivo
    subDown: '#F0B8A8', // balance negativo
  },

  // ---- Attention strip (firma; gradiente ocre + tintas) ----
  // Valores exactos del HTML (.attention).
  attention: {
    gradFrom: '#FBF4E3',
    gradTo: '#F7EDD2',
    border: '#EBD9A8',
    iconBg: '#F2E2B0',
    title: '#6B5410',
    subtitle: '#7A6524',
    value: '#6B5410',
    label: '#8A7326',
  },

  // ---- Radios ----
  radius: {
    lg: 18,
    md: 14,
    sm: 10,
  },

  // ---- Sombras ----
  shadow: {
    base: '0 1px 2px rgba(32,51,31,.04), 0 4px 16px rgba(32,51,31,.05)',
    hover: '0 2px 4px rgba(32,51,31,.06), 0 10px 28px rgba(32,51,31,.10)',
  },

  // ---- Tipografía ----
  font: {
    // IBM Plex Sans para UI y etiquetas
    sans: "'IBM Plex Sans', system-ui, sans-serif",
    // IBM Plex Mono para TODAS las cifras grandes (sensación de instrumento)
    mono: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace",
    // Iconografía
    icons: "'Material Symbols Rounded'",
  },
  // Escala tipográfica (px salvo tracking)
  type: {
    metricValue: 30,   // número de métrica (mono, weight 600, tracking -1px)
    metricUnit: 14,    // unidad junto al número
    financeHero: 33,   // balance hero (mono)
    financeValue: 26,  // fin-card default (mono)
    donutCenter: 26,   // total del donut (mono)
    label: 12.5,       // etiqueta de tile
    eyebrow: 12,       // eyebrow de sección (mayúsculas, tracking 1.4px)
    foot: 11,          // pie de tile
    eyebrowTracking: '1.4px',
    metricTracking: '-1px',
  },

  // ---- Espaciado (grilla de 8px) ----
  space: {
    unit: 8,
    cardPadding: 17,   // padding de tarjeta 16–17px
    tileGap: 14,       // gap entre tiles
    sectionGap: 28,    // separación entre secciones
  },

  // ---- Rampa de categorías para el donut (verde → ocre, del HTML) ----
  categoryRamp: ['#2F8F45', '#63B56E', '#A6D79A', '#E0A020', '#2E86C1', '#7FBE77', '#C9A227', '#5F6A5C'],
}

// Alias de estados usados por la lógica de umbral (PASO 3).
// `calm`   = default frío (verde tenue, sin encender): un cero neutro.
// `good`   = cero que ES bueno (verde), sin barra lateral.
// `warn`/`crit` encienden barra lateral izquierda.
// `info`   = azul cielo · `primary` = verde marca (conteo de trabajo).
export const STATE_STYLES = {
  calm: {
    icBg: ganado.color.surface2,
    icFg: ganado.color.muted,
    valueColor: ganado.color.ink,
    footColor: ganado.color.muted2,
    borderColor: ganado.color.line,
    accentBar: null,
  },
  good: {
    icBg: ganado.semantic.good.bg,
    icFg: ganado.semantic.good.fg,
    valueColor: ganado.color.ink,
    footColor: ganado.semantic.good.fg,
    borderColor: ganado.color.line,
    accentBar: null,
  },
  warn: {
    icBg: ganado.semantic.warn.bg,
    icFg: ganado.semantic.warn.fg,
    valueColor: '#8A6318',
    footColor: ganado.semantic.warn.fg,
    borderColor: '#E9D7A6',
    accentBar: ganado.semantic.warn.fg,
  },
  crit: {
    icBg: ganado.semantic.crit.bg,
    icFg: ganado.semantic.crit.fg,
    valueColor: ganado.semantic.crit.fg,
    footColor: ganado.semantic.crit.fg,
    borderColor: '#E7BDAF',
    accentBar: ganado.semantic.crit.fg,
  },
  info: {
    icBg: ganado.semantic.info.bg,
    icFg: ganado.semantic.info.fg,
    valueColor: ganado.color.ink,
    footColor: ganado.color.muted2,
    borderColor: ganado.color.line,
    accentBar: null,
  },
  primary: {
    icBg: ganado.color.primaryTint,
    icFg: ganado.color.primary,
    valueColor: ganado.color.ink,
    footColor: ganado.color.muted2,
    borderColor: ganado.color.line,
    accentBar: null,
  },
}

export default ganado
