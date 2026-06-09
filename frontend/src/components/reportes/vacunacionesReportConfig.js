// Configuración del reporte reutilizable para el módulo Vacunaciones.
// Se consume con: <ReportModalReusable {...buildVacunacionesReportConfig(ctx)} />

const VIA_LABELS = {
  INTRAMUSCULAR: 'Intramuscular',
  SUBCUTANEA: 'Subcutánea',
  INTRADERMICA: 'Intradérmica',
  ORAL: 'Oral',
}

const ESTADO_LABELS = {
  VENCIDA: 'Vencida',
  PROXIMA: 'Próxima',
  VIGENTE: 'Vigente',
  SIN_PROXIMA: 'Sin próxima',
}

const fmtFecha = (v) => {
  if (!v) return ''
  const s = String(v).split('T')[0]
  const p = s.split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s
}

const nombreVet = (v) =>
  v.nombreVeterinario ||
  (v.veterinario ? `${v.veterinario.nombre} ${v.veterinario.apellidos || ''}`.trim() : '')

/**
 * @param {Object} ctx
 * @param {Array} ctx.vacunaciones - dataset crudo
 * @param {Array} [ctx.veterinarios] - para el filtro extra "Veterinario"
 * @param {Array} [ctx.animalesActivos] - para el filtro extra "Animal"
 */
export function buildVacunacionesReportConfig({ vacunaciones = [], veterinarios = [], animalesActivos = [] } = {}) {
  // Campañas distintas presentes en los datos
  const campanas = [...new Set(vacunaciones.map(v => v.campana).filter(Boolean))]

  return {
    titulo: 'Reportes de Vacunaciones',
    colorHeader: '#2E7D32',
    nombreArchivo: 'reporte_vacunaciones',
    data: vacunaciones,
    campoFecha: (v) => v.fechaAplicacion,
    labelFecha: 'Aplicación',

    tiposReporte: [
      { value: 'APLICADAS', label: 'Vacunaciones aplicadas' },
      { value: 'PROXIMAS', label: 'Próximas dosis', filtro: v => v.estadoProxima === 'PROXIMA' },
      { value: 'VENCIDAS', label: 'Dosis vencidas', filtro: v => v.estadoProxima === 'VENCIDA' },
      { value: 'POR_CAMPANA', label: 'Por campaña' },
      { value: 'POR_VETERINARIO', label: 'Por veterinario' },
      { value: 'POR_ANIMAL', label: 'Por animal' },
    ],

    columnas: [
      { key: 'fechaAplicacion', label: 'Fecha aplicación', render: v => fmtFecha(v.fechaAplicacion) },
      { key: 'animal', label: 'Animal', render: v => v.animal?.nombre },
      { key: 'arete', label: 'Arete', render: v => v.animal?.nroArete },
      { key: 'vacuna', label: 'Vacuna', render: v => v.vacuna?.nombre },
      { key: 'dosisAplicada', label: 'Dosis aplicada' },
      { key: 'viaAplicacion', label: 'Vía', render: v => VIA_LABELS[v.viaAplicacion] || v.viaAplicacion },
      { key: 'veterinario', label: 'Veterinario', render: nombreVet },
      { key: 'campana', label: 'Campaña' },
      { key: 'lote', label: 'Lote' },
      { key: 'fechaProxima', label: 'Próxima dosis', render: v => fmtFecha(v.fechaProxima) },
      { key: 'estado', label: 'Estado', render: v => ESTADO_LABELS[v.estadoProxima] || v.estadoProxima },
      { key: 'observaciones', label: 'Observaciones', ancha: true },
    ],
    columnasDefault: [
      'fechaAplicacion', 'arete', 'animal', 'vacuna',
      'dosisAplicada', 'estado', 'fechaProxima',
    ],

    filtrosExtra: [
      {
        key: 'campana', label: 'Campaña', tipo: 'select',
        opciones: campanas.map(c => ({ value: c, label: c })),
        aplicar: (v, val) => v.campana === val,
      },
      {
        key: 'veterinario', label: 'Veterinario', tipo: 'select',
        opciones: veterinarios.map(vt => ({
          value: String(vt.id),
          label: `${vt.nombre} ${vt.apellidos || ''}`.trim(),
        })),
        aplicar: (v, val) => String(v.veterinario?.id) === String(val),
      },
      {
        key: 'animal', label: 'Animal', tipo: 'select',
        opciones: animalesActivos.map(a => ({
          value: String(a.id),
          label: `${a.nroArete}${a.nombre ? ' — ' + a.nombre : ''}`,
        })),
        aplicar: (v, val) => String(v.animal?.id) === String(val),
      },
    ],

    getResumen: (items) => [
      { label: 'Total', value: items.length, color: '#2E7D32' },
      { label: 'Próximas', value: items.filter(v => v.estadoProxima === 'PROXIMA').length, color: '#92400E' },
      { label: 'Vencidas', value: items.filter(v => v.estadoProxima === 'VENCIDA').length, color: '#991B1B' },
      { label: 'Vigentes', value: items.filter(v => v.estadoProxima === 'VIGENTE').length, color: '#166534' },
    ],
  }
}
