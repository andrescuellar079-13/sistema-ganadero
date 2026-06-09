// frontend/src/services/reportesService.js
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// ==========================================
// REPORTES EN PDF
// ==========================================

export const generarPDFAnimales = (animales, fincaNombre) => {
  const doc = new jsPDF('landscape')
  
  // Título
  doc.setFontSize(16)
  doc.text(`Reporte de Animales - ${fincaNombre}`, 14, 15)
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 25)
  
  // Tabla
  const tableData = animales.map(a => [
    a.nroArete,
    a.nombre || '-',
    a.sexo === 'MACHO' ? 'Macho' : 'Hembra',
    a.raza?.nombre || '-',
    a.categoria?.nombre || '-',
    a.peso ? `${a.peso} kg` : '-',
    a.estado,
  ])
  
  autoTable(doc, {
    head: [['Arete', 'Nombre', 'Sexo', 'Raza', 'Categoría', 'Peso', 'Estado']],
    body: tableData,
    startY: 35,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
  })
  
  doc.save(`reporte_animales_${new Date().toISOString().split('T')[0]}.pdf`)
}

export const generarPDFVentas = (ventas, fincaNombre) => {
  const doc = new jsPDF('landscape')
  
  doc.setFontSize(16)
  doc.text(`Reporte de Ventas - ${fincaNombre}`, 14, 15)
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 25)
  
  const totalVentas = ventas.reduce((sum, v) => sum + (v.montoTotal || 0), 0)
  doc.text(`Total Ventas: Gs. ${totalVentas.toLocaleString()}`, 14, 32)
  
  const tableData = ventas.map(v => [
    new Date(v.fechaVenta).toLocaleDateString(),
    v.cliente?.nombre || 'No especificado',
    v.montoTotal ? `Gs. ${v.montoTotal.toLocaleString()}` : '-',
    v.detalles?.length || 0,
  ])
  
  autoTable(doc, {
    head: [['Fecha', 'Cliente', 'Monto Total', 'Cant. Animales']],
    body: tableData,
    startY: 40,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
  })
  
  doc.save(`reporte_ventas_${new Date().toISOString().split('T')[0]}.pdf`)
}

export const generarPDFProduccion = (producciones, fincaNombre) => {
  const doc = new jsPDF('landscape')
  
  doc.setFontSize(16)
  doc.text(`Reporte de Producción Lechera - ${fincaNombre}`, 14, 15)
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 25)
  
  const totalLitros = producciones.reduce((sum, p) => sum + (p.litros || 0), 0)
  doc.text(`Total Producido: ${totalLitros.toFixed(1)} Litros`, 14, 32)
  
  const tableData = producciones.map(p => [
    new Date(p.fecha).toLocaleDateString(),
    p.vaca?.nroArete || '-',
    p.turno,
    `${p.litros} L`,
  ])
  
  autoTable(doc, {
    head: [['Fecha', 'Animal', 'Turno', 'Litros']],
    body: tableData,
    startY: 40,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
  })
  
  doc.save(`reporte_produccion_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ==========================================
// REPORTES EN EXCEL
// ==========================================

export const generarExcelAnimales = (animales, fincaNombre) => {
  const data = animales.map(a => ({
    'Arete': a.nroArete,
    'Nombre': a.nombre || '-',
    'Sexo': a.sexo === 'MACHO' ? 'Macho' : 'Hembra',
    'Raza': a.raza?.nombre || '-',
    'Categoría': a.categoria?.nombre || '-',
    'Peso (kg)': a.peso || '-',
    'Fecha Nacimiento': a.fechaNacimiento ? new Date(a.fechaNacimiento).toLocaleDateString() : '-',
    'Estado': a.estado,
  }))
  
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Animales')
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, `reporte_animales_${new Date().toISOString().split('T')[0]}.xlsx`)
}

export const generarExcelVentas = (ventas, fincaNombre) => {
  const data = ventas.map(v => ({
    'Fecha': new Date(v.fechaVenta).toLocaleDateString(),
    'Cliente': v.cliente?.nombre || 'No especificado',
    'Monto Total': v.montoTotal || 0,
    'Cantidad Animales': v.detalles?.length || 0,
  }))
  
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas')
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, `reporte_ventas_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// ==========================================
// EXPORTACIÓN MODAL DE ANIMALES (con columnas y filtros seleccionables)
// ==========================================

const ETIQUETAS_COLUMNAS = {
  nroArete:       'Arete',
  nombre:         'Nombre',
  sexo:           'Sexo',
  razaNombre:     'Raza',
  categoriaNombre:'Categoría',
  peso:           'Peso (kg)',
  fechaNacimiento:'Fecha Nac.',
  edadMeses:      'Edad (meses)',
  tipoProduccion: 'Tipo Producción',
  origen:         'Origen',
  estado:         'Estado',
  parcelaActual:  'Parcela actual',
  fechaIngreso:   'Fecha ingreso',
  padreArete:     'Padre (arete)',
  madreArete:     'Madre (arete)',
  observaciones:  'Observaciones',
  fechaVenta:     'Fecha venta',
  clienteNombre:  'Cliente',
  pesoVenta:      'Peso venta (kg)',
  precioUnitario: 'Precio unitario',
  subTotal:       'Subtotal',
  guiaSalida:     'Guía salida',
  fechaBaja:      'Fecha baja',
  tipoBaja:       'Tipo baja',
  causaBaja:      'Causa',
  pesoEstimadoBaja:'Peso estimado (kg)',
  descripcionBaja:'Descripción baja',
}

function formatearValorCelda(key, value) {
  if (value == null) return '-'
  if (key === 'sexo') return value === 'MACHO' ? 'Macho' : 'Hembra'
  if (key === 'tipoProduccion') {
    return value === 'DOBLE_PROPOSITO' ? 'Doble propósito' : value === 'CARNE' ? 'Carne' : 'Leche'
  }
  if (key === 'origen') {
    return value === 'NACIDO_FINCA' ? 'Nac. finca' : value === 'COMPRADO' ? 'Comprado' : 'Donado'
  }
  if ((key === 'fechaNacimiento' || key === 'fechaIngreso' || key === 'fechaVenta' || key === 'fechaBaja') && value) {
    return value.split('-').reverse().join('/')
  }
  if ((key === 'peso' || key === 'pesoVenta' || key === 'pesoEstimadoBaja') && value != null) {
    return `${parseFloat(value).toFixed(2)} kg`
  }
  if ((key === 'precioUnitario' || key === 'subTotal') && value != null) {
    return `Gs. ${parseFloat(value).toLocaleString('es-PY')}`
  }
  return String(value)
}

function buildFilasExport(items, columnas) {
  return items.map(item =>
    columnas.map(col => formatearValorCelda(col, item[col]))
  )
}

function buildEncabezado(columnas) {
  return columnas.map(col => ETIQUETAS_COLUMNAS[col] || col)
}

export const generarReporteAnimalesPDF = (items, columnas, config = {}) => {
  const { titulo = 'Reporte de Animales', finca = '', fechaGeneracion = new Date().toLocaleString('es-PY') } = config

  const encabezado = buildEncabezado(columnas)
  const filas = buildFilasExport(items, columnas)

  const orientacion = columnas.length > 9 ? 'landscape' : 'portrait'
  const doc = new jsPDF(orientacion)

  let y = 15
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text(titulo, 14, y)
  y += 8

  if (finca) {
    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')
    doc.text(`Finca: ${finca}`, 14, y)
    y += 6
  }

  doc.setFontSize(9)
  doc.text(`Generado: ${fechaGeneracion}`, 14, y)
  y += 5
  doc.text(`Total de registros: ${items.length}`, 14, y)
  y += 4

  autoTable(doc, {
    head: [encabezado],
    body: filas,
    startY: y + 4,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: [245, 251, 245] },
    margin: { left: 10, right: 10 },
    styles: { overflow: 'linebreak', cellPadding: 2 },
    columnStyles: columnas.reduce((acc, col, i) => {
      if (['observaciones', 'descripcionBaja', 'causaBaja'].includes(col)) {
        acc[i] = { cellWidth: 35 }
      }
      return acc
    }, {}),
  })

  const fechaArchivo = new Date().toISOString().split('T')[0]
  doc.save(`reporte_animales_${fechaArchivo}.pdf`)
}

export const generarReporteAnimalesExcel = (items, columnas, config = {}) => {
  const { titulo = 'Reporte de Animales', finca = '', fechaGeneracion = new Date().toLocaleString('es-PY') } = config

  const encabezado = buildEncabezado(columnas)
  const filas = buildFilasExport(items, columnas)

  const datos = [
    [titulo],
    finca ? [`Finca: ${finca}`] : [],
    [`Generado: ${fechaGeneracion}`],
    [`Total de registros: ${items.length}`],
    [],
    encabezado,
    ...filas,
  ].filter(r => r.length > 0 || true)

  const ws = XLSX.utils.aoa_to_sheet(datos)
  ws['!cols'] = encabezado.map(() => ({ wch: 18 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Animales')

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], { type: 'application/octet-stream' })
  const fechaArchivo = new Date().toISOString().split('T')[0]
  saveAs(blob, `reporte_animales_${fechaArchivo}.xlsx`)
}

// ==========================================
// REPORTES GENÉRICOS REUTILIZABLES
// (usados por ReportModalReusable — recibe filas/encabezados ya formateados)
// ==========================================

export const generarReporteGenericoPDF = (filas, encabezados, config = {}) => {
  const {
    titulo = 'Reporte',
    subtitulo = '',
    nombreArchivo = 'reporte',
    fechaGeneracion = new Date().toLocaleString('es-PY'),
    columnasAnchas = [],
  } = config

  const orientacion = encabezados.length > 8 ? 'landscape' : 'portrait'
  const doc = new jsPDF(orientacion)

  let y = 15
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text(titulo, 14, y)
  y += 8

  if (subtitulo) {
    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')
    doc.text(subtitulo, 14, y)
    y += 6
  }

  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.text(`Generado: ${fechaGeneracion}`, 14, y)
  y += 5
  doc.text(`Total de registros: ${filas.length}`, 14, y)
  y += 4

  autoTable(doc, {
    head: [encabezados],
    body: filas,
    startY: y + 4,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: [245, 251, 245] },
    margin: { left: 10, right: 10 },
    styles: { overflow: 'linebreak', cellPadding: 2 },
    columnStyles: encabezados.reduce((acc, label, i) => {
      if (columnasAnchas.includes(label)) acc[i] = { cellWidth: 35 }
      return acc
    }, {}),
  })

  const fechaArchivo = new Date().toISOString().split('T')[0]
  doc.save(`${nombreArchivo}_${fechaArchivo}.pdf`)
}

export const generarReporteGenericoExcel = (filas, encabezados, config = {}) => {
  const {
    titulo = 'Reporte',
    subtitulo = '',
    nombreArchivo = 'reporte',
    sheetName = 'Reporte',
    fechaGeneracion = new Date().toLocaleString('es-PY'),
  } = config

  const datos = []
  datos.push([titulo])
  if (subtitulo) datos.push([subtitulo])
  datos.push([`Generado: ${fechaGeneracion}`])
  datos.push([`Total de registros: ${filas.length}`])
  datos.push([])
  datos.push(encabezados)
  filas.forEach(f => datos.push(f))

  const ws = XLSX.utils.aoa_to_sheet(datos)
  ws['!cols'] = encabezados.map(() => ({ wch: 20 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, String(sheetName).slice(0, 31))

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], { type: 'application/octet-stream' })
  const fechaArchivo = new Date().toISOString().split('T')[0]
  saveAs(blob, `${nombreArchivo}_${fechaArchivo}.xlsx`)
}

export const generarExcelProduccion = (producciones, fincaNombre) => {
  const data = producciones.map(p => ({
    'Fecha': new Date(p.fecha).toLocaleDateString(),
    'Animal': p.vaca?.nroArete || '-',
    'Turno': p.turno,
    'Litros': p.litros,
  }))
  
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Producción')
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, `reporte_produccion_${new Date().toISOString().split('T')[0]}.xlsx`)
}