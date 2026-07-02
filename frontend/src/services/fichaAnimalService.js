// frontend/src/services/fichaAnimalService.js
//
// Ficha individual completa del animal (hoja de vida) en PDF y Excel.
// Consume el objeto que devuelve la query GraphQL `animalDetalle(id)` — solo lectura,
// sin duplicar modelos ni lógica de negocio.
//
// API pública:
//   buildAnimalReportData(animal)          -> estructura de secciones lista para render
//   generarPDFAnimalCompleto(data, animal) -> descarga ficha_animal_<arete>_<nombre>.pdf
//   generarExcelAnimalCompleto(data, animal)-> descarga ficha_animal_<arete>_<nombre>.xlsx
//
import jsPDF from 'jspdf'
// jspdf-autotable resuelve por su entrada CommonJS bajo Vite: según el interop,
// el import por defecto puede llegar como la función o como el objeto del módulo
// ({ default: fn, applyPlugin, ... }). Normalizamos para usar siempre la función.
import autoTableImport from 'jspdf-autotable'
const autoTable =
  typeof autoTableImport === 'function' ? autoTableImport : autoTableImport.default
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// ── Diccionarios de traducción (alineados con AnimalDetailModal) ──────────────
const SEXO        = { MACHO: 'Macho', HEMBRA: 'Hembra' }
const ORIGEN      = { NACIDO_FINCA: 'Nacido en finca', COMPRADO: 'Comprado', DONADO: 'Donado' }
const TIPO_PROD   = { CARNE: 'Carne', LECHE: 'Leche', DOBLE_PROPOSITO: 'Doble propósito' }
const TURNO       = { MANIANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche' }
const TIPO_PARTO  = { NORMAL: 'Normal', DISTOCICO: 'Distócico', ABORTO: 'Aborto', MULTIPLE: 'Múltiple' }
const RES_PRENEZ  = { POSITIVO: 'Positivo', NEGATIVO: 'Negativo', DUDOSO: 'Dudoso' }
const RES_SERV    = { PENDIENTE: 'Pendiente', PRENADA: 'Preñada', VACIA: 'Vacía', REPETIR: 'Repetir' }
const TIPO_BAJA   = { MUERTE: 'Muerte', ROBO: 'Robo', SACRIFICIO: 'Sacrificio', DESCARTE: 'Descarte', PERDIDA: 'Pérdida', OTRO: 'Otro' }
const EST_LACT    = { ACTIVA: 'Activa', SECADA: 'Secada', FINALIZADA: 'Finalizada' }
const TIPO_ORIG   = { INTERNO: 'Interno', EXTERNO: 'Externo', SEMEN: 'Semen' }
const EST_REPRO   = { SERVIDA: 'Servida', PRENADA: 'Preñada', PARIDA: 'Parida', ABORTO: 'Aborto', VACIA: 'Vacía', PENDIENTE: 'Pendiente', REPETIR: 'Repetir' }
const EST_ENGORDE = { EN_ENGORDE: 'En engorde', LISTO_VENTA: 'Listo para venta', RETIRADO: 'Retirado', VENDIDO: 'Vendido' }
const TIPO_ENGORDE = { INTENSIVO: 'Intensivo', EXTENSIVO: 'Extensivo', SEMI_INTENSIVO: 'Semi-intensivo' }
const TIPO_CELO   = { NATURAL: 'Natural', INDUCIDO: 'Inducido', SINCRONIZADO: 'Sincronizado' }
const INTENSIDAD  = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' }
const RES_PALP    = { POSITIVO: 'Positivo', NEGATIVO: 'Negativo', SOSPECHOSO: 'Sospechoso', QUISTE: 'Quiste' }
const TIPO_DESTETE = { NATURAL: 'Natural', PRECOZ: 'Precoz', FORZADO: 'Forzado' }
const TIPO_RETIRO = { CARNE: 'Carne', LECHE: 'Leche', AMBOS: 'Ambos' }
const PRIORIDAD   = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', CRITICA: 'Crítica' }

const SIN_REGISTROS = 'Sin registros'

// ── Helpers de formato ────────────────────────────────────────────────────────
const fmtFecha = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = String(iso).split('-')
  if (!y || !m || !d) return String(iso)
  return `${d}/${m}/${y}`
}

const dash = (v) => (v == null || v === '' ? '—' : String(v))

const num = (v, dec = 0) => (v == null ? '—' : Number(v).toFixed(dec))

const kg = (v, dec = 0) => (v == null ? '—' : `${Number(v).toFixed(dec)} kg`)

const gs = (v) => (v == null ? '—' : `Gs ${Number(v).toLocaleString('es-PY')}`)

const tr = (dic, v) => (v == null ? '—' : (dic[v] ?? v))

const edadTexto = (meses) => {
  if (meses == null) return '—'
  if (meses >= 12) return `${Math.floor(meses / 12)} a ${meses % 12} m`
  return `${meses} meses`
}

const nombreVet = (vet) =>
  vet ? `${vet.nombre}${vet.apellidos ? ' ' + vet.apellidos : ''}` : '—'

const refAnimal = (a) =>
  a ? `#${a.nroArete}${a.nombre ? ` · ${a.nombre}` : ''}` : '—'

const sanitizeNombreArchivo = (s) =>
  String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // quita acentos
    .replace(/[^\w-]+/g, '_')                            // resto -> _
    .replace(/_+/g, '_').replace(/^_|_$/g, '')

// ── Construcción de la estructura de la ficha ─────────────────────────────────
//
// Devuelve { encabezado, secciones }.
// Cada sección lleva `excelSheet` (nombre de hoja) salvo el contenedor "Producción",
// cuyas sub-tablas son hojas independientes (Pesajes / ProducciónLeche / Lactancias / Engorde).
//
export function buildAnimalReportData(animal) {
  const a = animal || {}
  const esMacho = a.sexo === 'MACHO'

  const arete = a.nroArete || 's/n'
  const nombre = a.nombre || ''
  const nombreArchivo = sanitizeNombreArchivo(`ficha_animal_${arete}${nombre ? '_' + nombre : ''}`)

  const alertas = a.alertasActivas || []
  const up = a.ultimoPesaje

  // ── Resumen (clave/valor) ──
  const resumen = [
    ['Arete', dash(a.nroArete)],
    ['Nombre', a.nombre || 'Sin nombre'],
    ['Sexo', tr(SEXO, a.sexo)],
    ['Estado', dash(a.estado)],
    ['Raza', dash(a.raza?.nombre)],
    ['Categoría', dash(a.categoria?.nombre)],
    ['Tipo de producción', tr(TIPO_PROD, a.tipoProduccion)],
    ['Edad actual', edadTexto(a.edadMeses)],
    ['Peso actual', kg(a.peso, 2)],
    ['Último pesaje', up ? `${kg(up.pesoKg, 2)} (${fmtFecha(up.fechaPesaje)})` : '—'],
    ['Ganancia diaria', a.gananciaDiariaActual != null ? `${Number(a.gananciaDiariaActual).toFixed(2)} kg/día` : '—'],
    ['Parcela actual', dash(a.parcelaActual?.nombre)],
    ['Estado reproductivo', esMacho ? 'No aplica' : tr(EST_REPRO, a.estadoReproductivo)],
    ['Próximo parto', a.proximoParto ? fmtFecha(a.proximoParto) : '—'],
    ['Alertas activas', alertas.length ? String(alertas.length) : 'Ninguna'],
  ]

  // ── General (clave/valor) ──
  const general = [
    ['Arete', dash(a.nroArete)],
    ['Nombre', a.nombre || 'Sin nombre'],
    ['Sexo', tr(SEXO, a.sexo)],
    ['Estado', dash(a.estado)],
    ['Raza', dash(a.raza?.nombre)],
    ['Categoría', dash(a.categoria?.nombre)],
    ['Color', dash(a.color)],
    ['Origen', tr(ORIGEN, a.origen)],
    ['Tipo de producción', tr(TIPO_PROD, a.tipoProduccion)],
    ['Peso actual', kg(a.peso, 2)],
    ['Peso al nacimiento', kg(a.pesoNacimiento, 2)],
    ['Fecha de nacimiento', fmtFecha(a.fechaNacimiento)],
    ['Fecha de ingreso', fmtFecha(a.fechaIngreso)],
    ['Edad actual', edadTexto(a.edadMeses)],
    ['Edad al ingreso', a.edadIngresoMeses != null ? `${a.edadIngresoMeses} meses` : '—'],
    ['Parcela actual', dash(a.parcelaActual?.nombre)],
    ['Observaciones', a.observaciones || '—'],
  ]

  // ── Genealogía ──
  const headPadres = ['Arete', 'Nombre', 'Sexo', 'Raza', 'Estado']
  const filaProgenitor = (p) =>
    p ? [[dash(p.nroArete), dash(p.nombre), tr(SEXO, p.sexo), dash(p.raza?.nombre), dash(p.estado)]] : []
  const hijos = a.descendencia || []

  const genealogia = {
    id: 'genealogia', titulo: 'Genealogía', excelSheet: 'Genealogía', tipo: 'tablas',
    tablas: [
      { id: 'padre', titulo: 'Padre', head: headPadres, body: filaProgenitor(a.padre) },
      { id: 'madre', titulo: 'Madre', head: headPadres, body: filaProgenitor(a.madre) },
      {
        id: 'hijos', titulo: 'Hijos / Hijas',
        head: ['Arete', 'Nombre', 'Sexo', 'Nacimiento', 'Estado'],
        body: hijos.map((h) => [dash(h.nroArete), dash(h.nombre), tr(SEXO, h.sexo), fmtFecha(h.fechaNacimiento), dash(h.estado)]),
      },
    ],
  }

  // ── Producción (contenedor; cada sub-tabla es una hoja Excel propia) ──
  const pesajes = a.registrosPeso || []
  const produccionesLeche = a.produccionesLeche || []
  const lactancias = a.lactancias || []
  const engordes = a.engordes || []

  const produccion = {
    id: 'produccion', titulo: 'Producción', tipo: 'tablas',
    tablas: [
      {
        id: 'pesajes', titulo: 'Pesajes', excelSheet: 'Pesajes',
        head: ['Fecha', 'Peso (kg)', 'Cond. corporal', 'Observación'],
        body: pesajes.map((p) => [fmtFecha(p.fechaPesaje), num(p.pesoKg, 2), dash(p.condicionCorporal), dash(p.observacion)]),
      },
      {
        id: 'produccionLeche', titulo: 'Producción de leche', excelSheet: 'ProducciónLeche',
        head: ['Fecha', 'Turno', 'Litros'],
        body: produccionesLeche.map((p) => [fmtFecha(p.fecha), tr(TURNO, p.turno), num(p.litros, 1)]),
      },
      {
        id: 'lactancias', titulo: 'Lactancias', excelSheet: 'Lactancias',
        head: ['#', 'Inicio', 'Secado', 'Total (L)', 'Prom. diario (L)', 'Estado'],
        body: lactancias.map((l) => [
          dash(l.numeroLactancia), fmtFecha(l.fechaInicio),
          l.fechaSecado ? fmtFecha(l.fechaSecado) : 'En curso',
          num(l.totalLitros, 1), num(l.promedioDiario, 1), tr(EST_LACT, l.estado),
        ]),
      },
      {
        id: 'engorde', titulo: 'Engorde', excelSheet: 'Engorde',
        head: ['Inicio', 'Tipo', 'P. inicial', 'P. objetivo', 'P. actual', 'Ganancia diaria', 'Días', 'Estado'],
        body: engordes.map((e) => [
          fmtFecha(e.fechaInicio), tr(TIPO_ENGORDE, e.tipoEngorde),
          kg(e.pesoInicial), kg(e.pesoObjetivo), kg(e.pesoActual),
          e.gananciaDiaria != null ? `${Number(e.gananciaDiaria).toFixed(2)} kg/día` : '—',
          dash(e.diasEnEngorde), tr(EST_ENGORDE, e.estado),
        ]),
      },
    ],
  }

  // ── Reproducción ──
  const celos = a.celos || []
  const inseminaciones = a.inseminaciones || []
  const montas = a.montas || []
  const diagPrenez = a.diagnosticosPrenez || []
  const palpaciones = a.palpaciones || []
  const partos = a.partos || []
  const destetes = a.destetes || []
  const repro = (r) =>
    r ? `${r.nombre || r.codigo}${r.tipoOrigen ? ` (${tr(TIPO_ORIG, r.tipoOrigen)})` : ''}` : '—'

  const reproduccion = {
    id: 'reproduccion', titulo: 'Reproducción', excelSheet: 'Reproducción', tipo: 'tablas',
    tablas: [
      {
        id: 'celos', titulo: 'Celos',
        head: ['Inicio', 'Fin', 'Tipo', 'Intensidad', 'Detectado por'],
        body: celos.map((c) => [fmtFecha(c.fechaInicio), c.fechaFin ? fmtFecha(c.fechaFin) : '—', tr(TIPO_CELO, c.tipo), tr(INTENSIDAD, c.intensidad), dash(c.detectadoPor)]),
      },
      {
        id: 'inseminaciones', titulo: 'Inseminaciones artificiales',
        head: ['Fecha', 'Reproductor', 'Resultado', 'F. parto probable'],
        body: inseminaciones.map((i) => [fmtFecha(i.fecha), repro(i.reproductor), tr(RES_SERV, i.resultado), fmtFecha(i.fechaProbableParto)]),
      },
      {
        id: 'montas', titulo: 'Montas naturales',
        head: ['Fecha', 'Reproductor', 'Resultado', 'F. parto probable'],
        body: montas.map((m) => [fmtFecha(m.fecha), repro(m.reproductor), tr(RES_SERV, m.resultado), fmtFecha(m.fechaProbableParto)]),
      },
      {
        id: 'diagnosticosPrenez', titulo: 'Diagnósticos de preñez',
        head: ['Fecha', 'Resultado', 'Días gestación', 'Método', 'F. parto probable'],
        body: diagPrenez.map((d) => [fmtFecha(d.fecha), tr(RES_PRENEZ, d.resultadoPrenez), dash(d.diasGestacion), dash(d.metodo), fmtFecha(d.fechaProbableParto)]),
      },
      {
        id: 'palpaciones', titulo: 'Palpaciones',
        head: ['Fecha', 'Resultado', 'Días gestación', 'Veterinario'],
        body: palpaciones.map((p) => [fmtFecha(p.fecha), tr(RES_PALP, p.resultado), dash(p.diasGestacionEstimados), nombreVet(p.veterinario)]),
      },
      {
        id: 'partos', titulo: 'Partos',
        head: ['Fecha', 'Tipo', 'N° crías', 'Estado', 'Crías'],
        body: partos.map((p) => [
          fmtFecha(p.fechaPartoReal), tr(TIPO_PARTO, p.tipoParto), dash(p.numCrias), dash(p.estado),
          (p.crias && p.crias.length) ? p.crias.map(refAnimal).join(', ') : '—',
        ]),
      },
      {
        id: 'destetes', titulo: 'Destetes',
        head: ['Fecha', 'Cría', 'Tipo', 'Edad (días)', 'Peso cría (kg)'],
        body: destetes.map((d) => [fmtFecha(d.fechaDestete), refAnimal(d.cria), tr(TIPO_DESTETE, d.tipo), dash(d.edadDesteteDias), num(d.pesoCria, 1)]),
      },
    ],
  }

  // ── Sanidad ──
  const vacunaciones = a.vacunaciones || []
  const tratamientos = a.tratamientos || []
  const desparasitaciones = a.desparasitaciones || []
  const diagSanitarios = a.diagnosticosSanitarios || []
  const examenes = a.examenes || []
  const mastitis = a.mastitis || []
  const tiemposRetiro = a.tiemposRetiro || []

  const sanidad = {
    id: 'sanidad', titulo: 'Sanidad', excelSheet: 'Sanidad', tipo: 'tablas',
    tablas: [
      {
        id: 'vacunaciones', titulo: 'Vacunaciones',
        head: ['Fecha', 'Vacuna', 'Dosis', 'Próxima', 'Veterinario'],
        body: vacunaciones.map((v) => [fmtFecha(v.fechaAplicacion), dash(v.vacuna?.nombre), dash(v.dosisAplicada), v.fechaProxima ? fmtFecha(v.fechaProxima) : '—', nombreVet(v.veterinario)]),
      },
      {
        id: 'tratamientos', titulo: 'Tratamientos',
        head: ['Inicio', 'Fin', 'Diagnóstico', 'Medicamento', 'Estado'],
        body: tratamientos.map((t) => [fmtFecha(t.fechaInicio), t.fechaFin ? fmtFecha(t.fechaFin) : '—', dash(t.diagnostico), dash(t.medicamento?.nombre), t.enTratamiento ? 'En tratamiento' : 'Finalizado']),
      },
      {
        id: 'desparasitaciones', titulo: 'Desparasitaciones',
        head: ['Fecha', 'Producto', 'Dosis', 'Próxima', 'Veterinario'],
        body: desparasitaciones.map((d) => [fmtFecha(d.fecha), dash(d.producto || d.tipoParasiticida), dash(d.dosis), d.fechaProxima ? fmtFecha(d.fechaProxima) : '—', nombreVet(d.veterinario)]),
      },
      {
        id: 'diagnosticosSanitarios', titulo: 'Diagnósticos',
        head: ['Fecha', 'Diagnóstico', 'Resultado', 'Enfermedad', 'Veterinario'],
        body: diagSanitarios.map((d) => [fmtFecha(d.fecha), dash(d.descripcion), dash(d.resultado), dash(d.enfermedad?.nombre), nombreVet(d.veterinario)]),
      },
      {
        id: 'examenes', titulo: 'Exámenes de laboratorio',
        head: ['F. toma', 'Tipo', 'Laboratorio', 'Resultado', 'Normal'],
        body: examenes.map((e) => [fmtFecha(e.fechaToma), dash(e.tipoExamen), dash(e.laboratorio), dash(e.resultado), e.esNormal == null ? '—' : (e.esNormal ? 'Normal' : 'Anormal')]),
      },
      {
        id: 'mastitis', titulo: 'Mastitis',
        head: ['Fecha', 'Cuarto', 'Tipo', 'Bacteria', 'Estado'],
        body: mastitis.map((m) => [fmtFecha(m.fecha), dash(m.cuartoAfectado), dash(m.tipo), dash(m.bacteria), m.seCuro ? `Curada${m.fechaCuracion ? ' · ' + fmtFecha(m.fechaCuracion) : ''}` : 'En curso']),
      },
      {
        id: 'tiemposRetiro', titulo: 'Tiempos de retiro',
        head: ['Tipo', 'Inicio', 'Fin', 'Días', 'Estado'],
        body: tiemposRetiro.map((t) => [tr(TIPO_RETIRO, t.tipoRetiro), fmtFecha(t.fechaInicio), t.fechaFin ? fmtFecha(t.fechaFin) : '—', dash(t.diasRetiro), t.activo ? `Activo · ${t.diasRestantes} días` : 'Finalizado']),
      },
    ],
  }

  // ── Movimientos (asignaciones de parcela) ──
  const movs = a.movimientosParcela || []
  const movimientos = {
    id: 'movimientos', titulo: 'Movimientos', excelSheet: 'Movimientos', tipo: 'tabla',
    head: ['Parcela', 'Estado parcela', 'Fecha ingreso', 'Fecha salida'],
    body: movs.map((m) => [dash(m.parcela?.nombre), dash(m.parcela?.estado), fmtFecha(m.fechaIngreso), m.fechaSalida ? fmtFecha(m.fechaSalida) : 'Actual']),
  }

  // ── Ventas / Bajas ──
  const ventas = a.ventas || []
  const bajas = a.bajas || []
  const ventasBajas = {
    id: 'ventasBajas', titulo: 'Ventas / Bajas', excelSheet: 'VentasBajas', tipo: 'tablas',
    tablas: [
      {
        id: 'ventas', titulo: 'Ventas',
        head: ['Fecha', 'Cliente', 'Precio/kg', 'Peso (kg)', 'Subtotal', 'Guía salida'],
        body: ventas.map((v) => {
          const nv = v.notaVenta || {}
          const cli = nv.cliente ? `${nv.cliente.nombre}${nv.cliente.apellidos ? ' ' + nv.cliente.apellidos : ''}` : '—'
          return [fmtFecha(nv.fechaVenta), cli, gs(v.precioUnitario), num(v.pesoVentaKg, 1), gs(v.subTotal), dash(nv.guiaSalida)]
        }),
      },
      {
        id: 'bajas', titulo: 'Bajas',
        head: ['Fecha', 'Tipo', 'Causa', 'Descripción', 'Peso estimado (kg)'],
        body: bajas.map((b) => [fmtFecha(b.fechaBaja), tr(TIPO_BAJA, b.tipo), dash(b.causa), dash(b.descripcion), num(b.pesoEstimadoKg, 1)]),
      },
    ],
  }

  // ── Alertas ──
  const alertasSeccion = {
    id: 'alertas', titulo: 'Alertas', excelSheet: 'Alertas', tipo: 'tabla',
    head: ['Prioridad', 'Mensaje', 'Módulo', 'Fecha', 'Vence', 'Acción recomendada'],
    body: alertas.map((al) => [
      tr(PRIORIDAD, al.prioridad), dash(al.mensaje), dash(al.moduloOrigen),
      dash(al.fechaAlerta), al.vencida ? 'Vencida' : (al.fechaVencimiento ? fmtFecha(al.fechaVencimiento) : '—'),
      dash(al.accionRecomendada),
    ]),
  }

  return {
    encabezado: {
      titulo: 'FICHA INDIVIDUAL DEL ANIMAL',
      arete,
      nombre: a.nombre || 'Sin nombre',
      estado: a.estado || '—',
      fecha: new Date().toLocaleString('es-PY'),
      nombreArchivo,
    },
    secciones: [
      { id: 'resumen', titulo: 'Resumen', excelSheet: 'Resumen', tipo: 'kv', filas: resumen },
      { id: 'general', titulo: 'General', excelSheet: 'General', tipo: 'kv', filas: general },
      genealogia,
      produccion,
      reproduccion,
      sanidad,
      movimientos,
      ventasBajas,
      alertasSeccion,
    ],
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PDF — jsPDF + autoTable
// ──────────────────────────────────────────────────────────────────────────────
const VERDE = [34, 197, 94]
const VERDE_OSCURO = [22, 101, 52]
const GRIS = [120, 120, 120]

export function generarPDFAnimalCompleto(reportData, animal) {  // eslint-disable-line no-unused-vars
  const { encabezado, secciones } = reportData
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14

  // ── Encabezado profesional (solo primera página) ──
  doc.setFillColor(...VERDE_OSCURO)
  doc.rect(0, 0, pageW, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(encabezado.titulo, margin, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Arete: ${encabezado.arete}   ·   Nombre: ${encabezado.nombre}   ·   Estado: ${encabezado.estado}`, margin, 21)
  doc.setTextColor(0, 0, 0)

  let y = 34

  const nuevaPaginaSi = (necesario) => {
    if (y + necesario > pageH - 18) {
      doc.addPage()
      y = 20
    }
  }

  const tituloSeccion = (texto) => {
    nuevaPaginaSi(16)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...VERDE_OSCURO)
    doc.text(texto, margin, y)
    doc.setDrawColor(...VERDE)
    doc.setLineWidth(0.5)
    doc.line(margin, y + 1.5, pageW - margin, y + 1.5)
    doc.setTextColor(0, 0, 0)
    y += 6
  }

  const subtitulo = (texto) => {
    nuevaPaginaSi(10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    doc.text(texto, margin, y)
    doc.setTextColor(0, 0, 0)
    y += 2
  }

  const sinRegistros = () => {
    nuevaPaginaSi(8)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...GRIS)
    doc.text(SIN_REGISTROS, margin + 2, y + 3)
    doc.setTextColor(0, 0, 0)
    y += 7
  }

  const tabla = (head, body, { headFill = VERDE } = {}) => {
    if (!body || body.length === 0) { sinRegistros(); return }
    autoTable(doc, {
      head: [head],
      body,
      startY: y,
      theme: 'striped',
      headStyles: { fillColor: headFill, fontSize: 8, fontStyle: 'bold', textColor: 255 },
      bodyStyles: { fontSize: 7.5 },
      alternateRowStyles: { fillColor: [245, 251, 245] },
      margin: { left: margin, right: margin },
      styles: { overflow: 'linebreak', cellPadding: 1.8 },
      didDrawPage: () => {},
    })
    y = doc.lastAutoTable.finalY + 5
  }

  // Tabla clave/valor (Resumen, General)
  const tablaKV = (filas) => {
    tabla(['Campo', 'Valor'], filas, { headFill: VERDE })
  }

  for (const sec of secciones) {
    tituloSeccion(sec.titulo)
    if (sec.tipo === 'kv') {
      tablaKV(sec.filas)
    } else if (sec.tipo === 'tabla') {
      tabla(sec.head, sec.body)
    } else if (sec.tipo === 'tablas') {
      for (const t of sec.tablas) {
        subtitulo(t.titulo)
        tabla(t.head, t.body)
      }
    }
  }

  // ── Pie de página con fecha y número de página en todas las hojas ──
  const totalPaginas = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setDrawColor(...VERDE)
    doc.setLineWidth(0.3)
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GRIS)
    doc.text(`Generado: ${encabezado.fecha}`, margin, pageH - 7)
    doc.text(`Página ${i} de ${totalPaginas}`, pageW - margin, pageH - 7, { align: 'right' })
    doc.text(`Ficha: ${encabezado.arete}`, pageW / 2, pageH - 7, { align: 'center' })
  }

  doc.save(`${encabezado.nombreArchivo}.pdf`)
}

// ──────────────────────────────────────────────────────────────────────────────
// Excel — xlsx (.xlsx) con una hoja por sección
// ──────────────────────────────────────────────────────────────────────────────
export function generarExcelAnimalCompleto(reportData, animal) {  // eslint-disable-line no-unused-vars
  const { encabezado, secciones } = reportData
  const wb = XLSX.utils.book_new()

  const addSheet = (nombre, aoa, anchoCols) => {
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    if (anchoCols) ws['!cols'] = anchoCols
    XLSX.utils.book_append_sheet(wb, ws, String(nombre).slice(0, 31))
  }

  const cabeceraHoja = (titulo) => [
    [encabezado.titulo],
    [`Arete: ${encabezado.arete}   Nombre: ${encabezado.nombre}   Estado: ${encabezado.estado}`],
    [`Generado: ${encabezado.fecha}`],
    [],
    [titulo],
  ]

  const aoaDeKV = (sec) => {
    const aoa = cabeceraHoja(sec.titulo)
    aoa.push(['Campo', 'Valor'])
    sec.filas.forEach((f) => aoa.push(f))
    return { aoa, cols: [{ wch: 24 }, { wch: 50 }] }
  }

  const bloqueTabla = (aoa, t) => {
    aoa.push([t.titulo])
    if (!t.body || t.body.length === 0) {
      aoa.push([SIN_REGISTROS])
    } else {
      aoa.push(t.head)
      t.body.forEach((row) => aoa.push(row))
    }
    aoa.push([])
  }

  const anchoPorHead = (head) => head.map((h) => ({ wch: Math.max(12, Math.min(40, String(h).length + 6)) }))

  for (const sec of secciones) {
    if (sec.tipo === 'kv') {
      const { aoa, cols } = aoaDeKV(sec)
      addSheet(sec.excelSheet, aoa, cols)
    } else if (sec.tipo === 'tabla') {
      const aoa = cabeceraHoja(sec.titulo)
      bloqueTabla(aoa, sec)
      addSheet(sec.excelSheet, aoa, anchoPorHead(sec.head))
    } else if (sec.tipo === 'tablas') {
      if (sec.excelSheet) {
        // Una sola hoja apilando las sub-tablas (Genealogía, Reproducción, Sanidad, Ventas/Bajas)
        const aoa = cabeceraHoja(sec.titulo)
        sec.tablas.forEach((t) => bloqueTabla(aoa, t))
        addSheet(sec.excelSheet, aoa, [{ wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }])
      } else {
        // Contenedor: cada sub-tabla es su propia hoja (Producción -> Pesajes/ProducciónLeche/Lactancias/Engorde)
        sec.tablas.forEach((t) => {
          const aoa = cabeceraHoja(t.titulo)
          bloqueTabla(aoa, t)
          addSheet(t.excelSheet, aoa, anchoPorHead(t.head))
        })
      }
    }
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${encabezado.nombreArchivo}.xlsx`)
}
