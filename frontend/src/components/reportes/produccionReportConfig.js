// Configuraciones del reporte reutilizable para el módulo de Producción.
// Se consumen con: <ReportModalReusable {...config} /> donde `config` es uno
// de los objetos devueltos por buildProduccionReportConfigs(ctx).
//
// No crea un componente de reportes nuevo: reutiliza ReportModalReusable.

const COLOR = '#B45309' // mismo acento del módulo de carne / engorde

const fmtFecha = (v) => {
  if (!v) return ''
  const s = String(v).split('T')[0]
  const p = s.split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s
}

// Formatea números evitando NaN (devuelve '0' si el valor no es finito)
const num = (v, dec = 1) => {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(dec) : (0).toFixed(dec)
}

const TIPO_LABEL = {
  CARNE: 'Carne',
  LECHE: 'Leche',
  DOBLE_PROPOSITO: 'Doble propósito',
}

const ESTADO_PROD_LABEL = {
  EN_ENGORDE: 'En engorde',
  LISTO_VENTA: 'Listo para venta',
  RETIRADO: 'Retirado',
  VENDIDO: 'Vendido',
  SIN_ENGORDE: 'Sin engorde',
}

const ESTADO_LACT_LABEL = {
  ACTIVA: 'Activa',
  SECADA: 'Secada',
  FINALIZADA: 'Finalizada',
}

// Opciones distintas (raza / categoría) presentes en un dataset de filas
const opcionesUnicas = (rows, getter) =>
  [...new Set(rows.map(getter).filter(Boolean))].map((v) => ({ value: v, label: v }))

/**
 * @param {Object} ctx
 * @param {string} [ctx.subtitulo]
 * @param {Array}  [ctx.produccionesLeche]
 * @param {Array}  [ctx.registrosPeso]
 * @param {Array}  [ctx.lactancias]
 * @param {Array}  [ctx.carneRows]        - filas precalculadas (animal + engorde)
 * @param {Array}  [ctx.animalesSinPesaje]
 * @returns {Array<{key, label, config}>}
 */
export function buildProduccionReportConfigs({
  subtitulo = '',
  produccionesLeche = [],
  registrosPeso = [],
  lactancias = [],
  carneRows = [],
  animalesSinPesaje = [],
} = {}) {
  // ───────────────── Leche ─────────────────
  const leche = {
    titulo: 'Reporte de producción de leche',
    colorHeader: '#1565C0',
    subtitulo,
    nombreArchivo: 'reporte_leche',
    data: produccionesLeche,
    campoFecha: (p) => p.fecha,
    labelFecha: 'Fecha',
    tiposReporte: [{ value: 'LECHE', label: 'Producción de leche' }],
    columnas: [
      { key: 'fecha', label: 'Fecha', render: (p) => fmtFecha(p.fecha) },
      { key: 'animal', label: 'Animal', render: (p) => p.vaca?.nombre },
      { key: 'arete', label: 'Arete', render: (p) => p.vaca?.nroArete },
      { key: 'litros', label: 'Litros', render: (p) => num(p.litros) },
      { key: 'turno', label: 'Turno' },
      { key: 'lactancia', label: 'Lactancia', render: (p) => p.lactancia?.numeroLactancia },
      { key: 'promedio', label: 'Promedio (L/día)', render: (p) => num(p.lactancia?.promedioDiario) },
      { key: 'observaciones', label: 'Observaciones', ancha: true },
    ],
    columnasDefault: ['fecha', 'arete', 'animal', 'litros', 'turno', 'lactancia'],
    getResumen: (items) => {
      const totalLitros = items.reduce((acc, p) => acc + (Number(p.litros) || 0), 0)
      return [
        { label: 'Registros', value: items.length, color: '#1565C0' },
        { label: 'Total litros', value: num(totalLitros), color: '#0F766E' },
      ]
    },
  }

  // ───────────────── Carne / Engorde ─────────────────
  const carne = {
    titulo: 'Reporte de carne / engorde',
    colorHeader: COLOR,
    subtitulo,
    nombreArchivo: 'reporte_carne_engorde',
    data: carneRows,
    tiposReporte: [
      { value: 'TODOS', label: 'Carne / Engorde (todos)' },
      { value: 'EN_ENGORDE', label: 'En engorde', filtro: (r) => r.estadoProductivo === 'EN_ENGORDE' },
      { value: 'LISTOS', label: 'Animales listos para venta', filtro: (r) => r.estadoProductivo === 'LISTO_VENTA' },
    ],
    columnas: [
      { key: 'arete', label: 'Arete' },
      { key: 'nombre', label: 'Animal' },
      { key: 'sexo', label: 'Sexo', render: (r) => (r.sexo === 'MACHO' ? 'Macho' : 'Hembra') },
      { key: 'raza', label: 'Raza' },
      { key: 'categoria', label: 'Categoría' },
      { key: 'tipoProduccion', label: 'Tipo', render: (r) => TIPO_LABEL[r.tipoProduccion] || r.tipoProduccion },
      { key: 'pesoInicial', label: 'Peso inicial', render: (r) => (r.engordeId ? num(r.pesoInicial) : '-') },
      { key: 'pesoActual', label: 'Peso actual', render: (r) => num(r.pesoActual) },
      { key: 'pesoObjetivo', label: 'Peso objetivo', render: (r) => (r.engordeId ? num(r.pesoObjetivo) : '-') },
      { key: 'diasEngorde', label: 'Días engorde', render: (r) => (r.engordeId ? r.diasEngorde : '-') },
      { key: 'gananciaDiaria', label: 'Ganancia (kg/día)', render: (r) => (r.engordeId ? num(r.gananciaDiaria, 2) : '-') },
      { key: 'pesoFaltante', label: 'Peso faltante', render: (r) => (r.engordeId ? num(r.pesoFaltante) : '-') },
      { key: 'estadoProductivo', label: 'Estado productivo', render: (r) => ESTADO_PROD_LABEL[r.estadoProductivo] || r.estadoProductivo },
      { key: 'ultimoPesaje', label: 'Último pesaje', render: (r) => (r.ultimoPesaje ? fmtFecha(r.ultimoPesaje) : 'Sin pesaje') },
      { key: 'observaciones', label: 'Observaciones', ancha: true },
    ],
    columnasDefault: [
      'arete', 'nombre', 'tipoProduccion', 'pesoActual', 'pesoObjetivo',
      'gananciaDiaria', 'pesoFaltante', 'estadoProductivo',
    ],
    filtrosExtra: [
      {
        key: 'estadoProductivo', label: 'Estado productivo', tipo: 'select',
        opciones: Object.entries(ESTADO_PROD_LABEL).map(([value, label]) => ({ value, label })),
        aplicar: (r, val) => r.estadoProductivo === val,
      },
      {
        key: 'raza', label: 'Raza', tipo: 'select',
        opciones: opcionesUnicas(carneRows, (r) => r.raza),
        aplicar: (r, val) => r.raza === val,
      },
      {
        key: 'categoria', label: 'Categoría', tipo: 'select',
        opciones: opcionesUnicas(carneRows, (r) => r.categoria),
        aplicar: (r, val) => r.categoria === val,
      },
      {
        key: 'loteGrupo', label: 'Lote / grupo', tipo: 'text',
        aplicar: (r, val) => (r.loteGrupo || '').toLowerCase().includes(String(val).toLowerCase()),
      },
    ],
    getResumen: (items) => [
      { label: 'Animales', value: items.length, color: COLOR },
      { label: 'En engorde', value: items.filter((r) => r.estadoProductivo === 'EN_ENGORDE').length, color: '#92400E' },
      { label: 'Listos venta', value: items.filter((r) => r.estadoProductivo === 'LISTO_VENTA').length, color: '#0F766E' },
    ],
  }

  // ───────────────── Pesajes / Ganancia ─────────────────
  const pesajes = {
    titulo: 'Reporte de pesajes',
    colorHeader: '#6A1B9A',
    subtitulo,
    nombreArchivo: 'reporte_pesajes',
    data: registrosPeso,
    campoFecha: (p) => p.fechaPesaje,
    labelFecha: 'Pesaje',
    tiposReporte: [
      { value: 'PESAJES', label: 'Pesajes' },
      { value: 'GANANCIA', label: 'Ganancia de peso', filtro: (p) => Number(p.gananciaDiaria) !== 0 },
    ],
    columnas: [
      { key: 'fechaPesaje', label: 'Fecha pesaje', render: (p) => fmtFecha(p.fechaPesaje) },
      { key: 'animal', label: 'Animal', render: (p) => p.animal?.nombre },
      { key: 'arete', label: 'Arete', render: (p) => p.animal?.nroArete },
      { key: 'pesoKg', label: 'Peso (kg)', render: (p) => num(p.pesoKg) },
      { key: 'gananciaDiaria', label: 'Ganancia (kg/día)', render: (p) => num(p.gananciaDiaria, 2) },
      { key: 'condicionCorporal', label: 'Condición corporal', render: (p) => num(p.condicionCorporal) },
      { key: 'observacion', label: 'Observaciones', ancha: true },
    ],
    columnasDefault: ['fechaPesaje', 'arete', 'animal', 'pesoKg', 'gananciaDiaria', 'condicionCorporal'],
    getResumen: (items) => [
      { label: 'Pesajes', value: items.length, color: '#6A1B9A' },
    ],
  }

  // ───────────────── Lactancias ─────────────────
  const lactanciasCfg = {
    titulo: 'Reporte de lactancias',
    colorHeader: '#2E7D32',
    subtitulo,
    nombreArchivo: 'reporte_lactancias',
    data: lactancias,
    campoFecha: (l) => l.fechaInicio,
    labelFecha: 'Inicio',
    tiposReporte: [
      { value: 'TODAS', label: 'Lactancias' },
      { value: 'ACTIVAS', label: 'Lactancias activas', filtro: (l) => l.estado === 'ACTIVA' },
    ],
    columnas: [
      { key: 'animal', label: 'Animal', render: (l) => l.vaca?.nombre },
      { key: 'arete', label: 'Arete', render: (l) => l.vaca?.nroArete },
      { key: 'numero', label: 'N° Lactancia', render: (l) => l.numeroLactancia },
      { key: 'fechaInicio', label: 'Fecha inicio', render: (l) => fmtFecha(l.fechaInicio) },
      { key: 'fechaSecado', label: 'Fecha fin', render: (l) => (l.fechaSecado ? fmtFecha(l.fechaSecado) : '-') },
      { key: 'estado', label: 'Estado', render: (l) => ESTADO_LACT_LABEL[l.estado] || l.estado },
      { key: 'totalLitros', label: 'Producción acumulada (L)', render: (l) => num(l.totalLitros) },
      { key: 'promedioDiario', label: 'Promedio (L/día)', render: (l) => num(l.promedioDiario) },
    ],
    columnasDefault: ['arete', 'animal', 'numero', 'fechaInicio', 'estado', 'totalLitros', 'promedioDiario'],
    filtrosExtra: [
      {
        key: 'estado', label: 'Estado', tipo: 'select',
        opciones: Object.entries(ESTADO_LACT_LABEL).map(([value, label]) => ({ value, label })),
        aplicar: (l, val) => l.estado === val,
      },
    ],
    getResumen: (items) => [
      { label: 'Lactancias', value: items.length, color: '#2E7D32' },
      { label: 'Activas', value: items.filter((l) => l.estado === 'ACTIVA').length, color: '#166534' },
    ],
  }

  // ───────────────── Animales sin pesaje ─────────────────
  const sinPesaje = {
    titulo: 'Reporte de animales sin pesaje',
    colorHeader: '#64748B',
    subtitulo,
    nombreArchivo: 'reporte_sin_pesaje',
    data: animalesSinPesaje,
    tiposReporte: [{ value: 'SIN_PESAJE', label: 'Animales sin pesaje' }],
    columnas: [
      { key: 'arete', label: 'Arete', render: (a) => a.nroArete },
      { key: 'nombre', label: 'Animal', render: (a) => a.nombre },
      { key: 'sexo', label: 'Sexo', render: (a) => (a.sexo === 'MACHO' ? 'Macho' : 'Hembra') },
      { key: 'raza', label: 'Raza', render: (a) => a.raza?.nombre },
      { key: 'categoria', label: 'Categoría', render: (a) => a.categoria?.nombre },
      { key: 'tipoProduccion', label: 'Tipo', render: (a) => TIPO_LABEL[a.tipoProduccion] || a.tipoProduccion },
    ],
    columnasDefault: ['arete', 'nombre', 'sexo', 'raza', 'categoria', 'tipoProduccion'],
    getResumen: (items) => [
      { label: 'Sin pesaje', value: items.length, color: '#64748B' },
    ],
  }

  return [
    { key: 'LECHE', label: 'Producción de leche', config: leche },
    { key: 'CARNE', label: 'Carne / Engorde', config: carne },
    { key: 'PESAJES', label: 'Pesajes y ganancia', config: pesajes },
    { key: 'LACTANCIAS', label: 'Lactancias', config: lactanciasCfg },
    { key: 'SIN_PESAJE', label: 'Animales sin pesaje', config: sinPesaje },
  ]
}
