// Configuración del reporte reutilizable para el módulo Vacunas (catálogo).
// Se consume con: <ReportModalReusable {...buildVacunasReportConfig(ctx)} />

const VIA_LABELS = {
  INTRAMUSCULAR: 'Intramuscular',
  SUBCUTANEA: 'Subcutánea',
  INTRADERMICA: 'Intradérmica',
  ORAL: 'Oral',
}

const TIPO_PRODUCCION_LABELS = {
  CARNE: 'Carne',
  LECHE: 'Leche',
  DOBLE_PROPOSITO: 'Doble propósito',
  TODOS: 'Todos',
}

const fmtFecha = (v) => {
  if (!v) return ''
  const s = String(v).split('T')[0]
  const p = s.split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s
}

const fmtNum = (n) => (n == null || n === '' ? '' : Number(n).toLocaleString('es-PY'))

/**
 * @param {Object} ctx
 * @param {Array} ctx.vacunas - dataset crudo del catálogo de vacunas
 */
export function buildVacunasReportConfig({ vacunas = [] } = {}) {
  const vias = [...new Set(vacunas.map(v => v.viaAplicacion).filter(Boolean))]

  return {
    titulo: 'Reportes de Vacunas',
    colorHeader: '#2E7D32',
    nombreArchivo: 'reporte_vacunas',
    data: vacunas,
    campoFecha: (v) => v.fechaVencimiento,
    labelFecha: 'Vencimiento',

    tiposReporte: [
      { value: 'CATALOGO', label: 'Catálogo de vacunas' },
      { value: 'STOCK_BAJO', label: 'Stock bajo', filtro: v => !!v.isStockBajo },
      { value: 'VENCIDAS', label: 'Vencidas', filtro: v => !!v.isVencida },
      { value: 'ACTIVAS', label: 'Activas', filtro: v => v.activo === true },
      { value: 'POR_VIA', label: 'Por vía de aplicación' },
      { value: 'POR_TIPO_PRODUCCION', label: 'Por tipo de producción' },
    ],

    columnas: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'enfermedadPreviene', label: 'Enfermedad que previene', ancha: true },
      { key: 'dosisRecomendada', label: 'Dosis' },
      { key: 'viaAplicacion', label: 'Vía', render: v => VIA_LABELS[v.viaAplicacion] || v.viaAplicacion },
      { key: 'intervaloDias', label: 'Intervalo (días)' },
      { key: 'edadMinimaMeses', label: 'Edad mínima (meses)' },
      { key: 'stockCantidad', label: 'Stock', render: v => fmtNum(v.stockCantidad) },
      { key: 'stockMinimo', label: 'Stock mínimo', render: v => fmtNum(v.stockMinimo) },
      { key: 'fechaVencimiento', label: 'Vencimiento', render: v => fmtFecha(v.fechaVencimiento) },
      { key: 'laboratorio', label: 'Laboratorio' },
      { key: 'lote', label: 'Lote' },
      { key: 'activo', label: 'Estado', render: v => (v.activo ? 'Activa' : 'Inactiva') },
    ],
    columnasDefault: [
      'nombre', 'enfermedadPreviene', 'dosisRecomendada', 'viaAplicacion',
      'intervaloDias', 'stockCantidad', 'fechaVencimiento', 'activo',
    ],

    filtrosExtra: [
      {
        key: 'via', label: 'Vía de aplicación', tipo: 'select',
        opciones: vias.map(v => ({ value: v, label: VIA_LABELS[v] || v })),
        aplicar: (v, val) => v.viaAplicacion === val,
      },
      {
        key: 'tipoProduccion', label: 'Tipo de producción', tipo: 'select',
        opciones: Object.entries(TIPO_PRODUCCION_LABELS).map(([value, label]) => ({ value, label })),
        aplicar: (v, val) => v.tipoProduccionAplicable === val,
      },
    ],

    getResumen: (items) => [
      { label: 'Total', value: items.length, color: '#2E7D32' },
      { label: 'Stock bajo', value: items.filter(v => v.isStockBajo).length, color: '#92400E' },
      { label: 'Vencidas', value: items.filter(v => v.isVencida).length, color: '#991B1B' },
      { label: 'Activas', value: items.filter(v => v.activo).length, color: '#166534' },
    ],
  }
}
