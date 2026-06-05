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