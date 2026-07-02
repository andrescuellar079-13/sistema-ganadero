// frontend/src/components/dashboard/estadoMetricas.js
// ============================================================================
// PASO 3 · Lógica de color por umbral — EL CORAZÓN DEL DISEÑO
// ----------------------------------------------------------------------------
// El color NO se hardcodea por tarjeta. Se deriva del valor real de la métrica
// mediante una función pura. Los umbrales viven en un CONFIG editable (UMBRALES)
// para poder ajustarlos sin tocar los componentes.
//
// Regla mental: un CERO que es bueno (mastitis 0, críticas 0) va calmado en
// verde (`good`), NO en rojo. Solo se "enciende" (warn/crit + barra lateral)
// lo que requiere acción.
//
// Estados válidos: 'calm' | 'good' | 'warn' | 'crit' | 'info' | 'primary'
// (ver STATE_STYLES en ../../theme/ganadoTokens)
// ============================================================================

// Config editable: métrica -> (valor) => estado.
// Ajustá acá los umbrales; los componentes no cambian.
export const UMBRALES = {
  // Sanidad
  mastitisActivas:           (v) => (v > 0 ? 'crit' : 'good'),
  vacunasVencidas:           (v) => (v > 0 ? 'warn' : 'good'),
  desparasitacionesVencidas: (v) => (v > 0 ? 'warn' : 'good'),
  animalesEnRetiro:          (v) => (v > 0 ? 'warn' : 'calm'),
  tratamientosActivos:       () => 'primary', // conteo de trabajo, informativo

  // Alertas
  alertasCriticas:  (v) => (v > 0 ? 'crit' : 'good'),
  alertasVencidas:  (v) => (v > 0 ? 'crit' : 'good'),
  alertasPendientes: (v) => (v > 10 ? 'warn' : v > 0 ? 'info' : 'calm'),
  alertasResueltas: () => 'calm',

  // Reproducción
  vacasPrenadas:  () => 'calm',
  proximosPartos: () => 'calm',

  // Producción
  produccionLeche: () => 'info', // azul cielo
}

/**
 * Función pura: devuelve el estado de una métrica dado su valor real.
 * @param {string} metrica  clave en UMBRALES (ej. 'mastitisActivas')
 * @param {number} valor    valor real de la métrica
 * @returns {'calm'|'good'|'warn'|'crit'|'info'|'primary'}
 */
export function resolverEstado(metrica, valor) {
  const regla = UMBRALES[metrica]
  if (!regla) return 'calm' // sin regla definida => neutro, nunca "encendido"
  const v = Number(valor)
  return regla(Number.isNaN(v) ? 0 : v)
}

export default resolverEstado
