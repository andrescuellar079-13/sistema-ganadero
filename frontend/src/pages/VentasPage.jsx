// frontend/src/pages/VentasPage.jsx
import { useState } from 'react'
import { useVentas } from '../hooks/useVentas'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import VentaForm from '../components/VentaForm'
import PageHeader from '../components/ui/PageHeader'
import PageAlert from '../components/ui/PageAlert'
import EmptyState from '../components/ui/EmptyState'

// Librerías añadidas para exportar reportes descargables
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

// Componentes añadidos para el bloque visual interactivo de Recharts
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid, ResponsiveContainer 
} from 'recharts'

import {
  Box,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material'
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import FilterListIcon from '@mui/icons-material/FilterList'
import AssessmentIcon from '@mui/icons-material/Assessment'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

const MODALIDAD_LABEL = {
  POR_KILO: 'Por Kilo',
  POR_CABEZA: 'Por Cabeza',
  MIXTO: 'Mixto',
}

export default function VentasPage() {
  const {
    notasVenta,
    clientes,
    animalesDisponibles,
    corralesVenta,
    loading,
    error,
    crearNotaVenta,
    crearDetalleVenta,
    actualizarVentaCompleta,
    eliminarNotaVenta,
    refetch,
  } = useVentas()

  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [editingVenta, setEditingVenta] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ventaToDelete, setVentaToDelete] = useState(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('mas_reciente')
  const [filterModalidad, setFilterModalidad] = useState('todos')
  const [showFilters, setShowFilters] = useState(false)

  // NUEVOS ESTADOS ENLAZADOS AL SUBMÓDULO DE REPORTE INTERACTIVO
  const [periodoReporte, setPeriodoReporte] = useState('Mes')
  const [tipoReporte, setTipoReporte] = useState('Monto') // 'Monto' o 'Cabezas'
  const [subPestanaActiva, setSubPestanaActiva] = useState('grafico') // 'grafico' o 'detalle'

  const sortOptions = [
    { value: 'mas_reciente', label: 'Más reciente' },
    { value: 'mas_antiguo', label: 'Más antiguo' },
    { value: 'cliente_asc', label: 'Cliente A-Z' },
    { value: 'cliente_desc', label: 'Cliente Z-A' },
    { value: 'monto_mayor', label: 'Mayor monto' },
    { value: 'monto_menor', label: 'Menor monto' },
  ]

  const modalidadOptions = [
    { value: 'todos', label: 'Todas las modalidades' },
    { value: 'POR_KILO', label: 'Por Kilo' },
    { value: 'POR_CABEZA', label: 'Por Cabeza' },
    { value: 'MIXTO', label: 'Mixto' },
  ]

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3500)
  }

  const handleCreate = async (formData, detalles) => {
    const result = await crearNotaVenta(formData)
    if (result.success && detalles.length > 0) {
      const notaVentaId = result.id
      for (const d of detalles) {
        await crearDetalleVenta({
          notaVentaId,
          animalId: d.animalId,
          modalidad: d.modalidad,
          precioKg: d.precioUnitario,
          pesoVentaKg: d.pesoVentaKg || 0,
          costoEstimado: d.costoEstimado || 0,
        })
      }
      showMessage('success', 'Venta registrada exitosamente')
      setShowForm(false)
      refetch()
    } else {
      showMessage('error', result.message || 'Error al registrar venta')
    }
  }

  const handleEdit = (venta) => {
    setEditingVenta(venta)
    setShowForm(true)
  }

  const handleUpdate = async (formData, detalles) => {
    const result = await actualizarVentaCompleta(editingVenta.id, formData, detalles)
    if (result.success) {
      showMessage('success', result.message)
      setShowForm(false)
      setEditingVenta(null)
      refetch()
    } else {
      showMessage('error', result.message)
    }
  }

  const handleDeleteClick = (venta) => {
    setVentaToDelete(venta)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (ventaToDelete) {
      const result = await eliminarNotaVenta(ventaToDelete.id)
      showMessage(result.success ? 'success' : 'error', result.message)
      if (result.success) refetch()
      setDeleteDialogOpen(false)
      setVentaToDelete(null)
    }
  }

  const handleViewDetails = (venta) => {
    setSelectedVenta(venta)
    setDetailDialogOpen(true)
  }

  const filtrarVentas = (v) => {
    if (filterModalidad !== 'todos' && v.modalidadVenta !== filterModalidad) return false
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    const nombre = `${v.cliente?.nombre || ''} ${v.cliente?.apellidos || ''}`.toLowerCase()
    return (
      nombre.includes(term) ||
      (v.cliente?.ci || '').toLowerCase().includes(term) ||
      (v.id || '').toLowerCase().includes(term) ||
      (v.corral?.nombre || '').toLowerCase().includes(term) ||
      (v.guiaSalida || '').toLowerCase().includes(term)
    )
  }

  const ordenarVentas = (a, b) => {
    switch (sortBy) {
      case 'mas_reciente': return new Date(b.fechaVenta) - new Date(a.fechaVenta)
      case 'mas_antiguo': return new Date(a.fechaVenta) - new Date(b.fechaVenta)
      case 'cliente_asc': return (a.cliente?.nombre || '').localeCompare(b.cliente?.nombre || '')
      case 'cliente_desc': return (b.cliente?.nombre || '').localeCompare(a.cliente?.nombre || '')
      case 'monto_mayor': return (b.montoTotal || 0) - (a.montoTotal || 0)
      case 'monto_menor': return (a.montoTotal || 0) - (b.montoTotal || 0)
      default: return 0
    }
  }

  const ventasFiltradas = [...(notasVenta || [])].filter(filtrarVentas).sort(ordenarVentas)

  const calcularUtilidadVenta = (venta) => {
    if (!venta?.detalles?.length) return null
    const tieneUtilidad = venta.detalles.some(d => d.costoEstimado > 0)
    if (!tieneUtilidad) return null
    return venta.detalles.reduce((s, d) => s + (parseFloat(d.utilidad) || 0), 0)
  }

  // ==========================================
  // LÓGICA Y PROCESAMIENTO INTERNO DEL REPORTE
  // ==========================================
  const formatearDinero = (valor) => {
    return 'Bs. ' + (valor || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatearEjeY = (value) => {
    if (tipoReporte === 'Monto') {
      if (value >= 1000000) return `Bs. ${(value / 1000000).toFixed(1)}M`
      if (value >= 1000) return `Bs. ${(value / 1000).toFixed(1)}K`
      return `Bs. ${value}`
    }
    return `${value} cab`
  }

  // Generar dinámicamente datos agrupados por periodo métrica seleccionada
  const agruparDatosPorPeriodo = () => {
    const mapa = {}
    let totalFacturado = 0
    let totalCabezas = 0
    let totalPrecio = 0
    let cuentaPrecios = 0

    if (notasVenta && notasVenta.length > 0) {
      notasVenta.forEach(v => {
        const fecha = new Date(v.fechaVenta)
        let clavePeriodo = ''

        if (periodoReporte === 'Mes') {
          clavePeriodo = fecha.toLocaleString('es-BO', { month: 'short', year: '2-digit' })
        } else if (periodoReporte === 'Año') {
          clavePeriodo = fecha.getFullYear().toString()
        } else if (periodoReporte === 'Semana') {
          // Obtener número aproximado de semana en el año
          const primeroEnero = new Date(fecha.getFullYear(), 0, 1);
          const dias = Math.floor((fecha - primeroEnero) / (24 * 60 * 60 * 1000));
          const semana = Math.ceil((dias + primeroEnero.getDay() + 1) / 7);
          clavePeriodo = `Sem ${semana} (${fecha.getFullYear()})`
        } else {
          clavePeriodo = fecha.toLocaleDateString('es-BO')
        }

        const monto = parseFloat(v.montoTotal || 0)
        totalFacturado += monto
        const cabezas = v.detalles?.length || 0
        totalCabezas += cabezas

        v.detalles?.forEach(d => {
          if (d.precioUnitario) {
            totalPrecio += parseFloat(d.precioUnitario)
            cuentaPrecios++
          }
        })

        if (!mapa[clavePeriodo]) {
          mapa[clavePeriodo] = { name: clavePeriodo, monto: 0, cantidad: 0 }
        }
        mapa[clavePeriodo].monto += monto
        mapa[clavePeriodo].cantidad += cabezas
      })
    }

    const datosFormateados = Object.values(mapa)
    const precioPromedio = cuentaPrecios > 0 ? (totalPrecio / cuentaPrecios) : 0

    return {
      datosPeriodo: datosFormateados,
      kpis: { totalFacturado, cantidadAnimales: totalCabezas, precioPromedio }
    }
  }

  const { datosPeriodo, kpis } = agruparDatosPorPeriodo()

  // Determinar valor máximo dinámico para la barra de distribución proporcional
  const maximoValor = datosPeriodo.length > 0 
    ? Math.max(...datosPeriodo.map(d => tipoReporte === 'Monto' ? d.monto : d.cantidad || 1), 1) 
    : 1

  const exportarExcel = () => {
    if (datosPeriodo.length === 0) return
    const datosAExportar = datosPeriodo.map(m => ({
      'Período / Concepto': m.name,
      'Monto de Ventas (Bs.)': m.monto,
      'Cabezas Vendidas': m.cantidad
    }))
    const ws = XLSX.utils.json_to_sheet(datosAExportar)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Ventas")
    XLSX.writeFile(wb, `Reporte_Ventas_${periodoReporte}_${tipoReporte}.xlsx`)
  }

  const exportarPDF = () => {
    if (datosPeriodo.length === 0) return
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`Reporte Avanzado de Ventas - GanadoSoft`, 14, 22)
    doc.setFontSize(11)
    doc.text(`Período: ${periodoReporte} | Métrica: ${tipoReporte}`, 14, 30)

    const columnas = ["Concepto / Período", "Monto Total", "Animales Comercializados"]
    const filas = datosPeriodo.map(m => [m.name, formatearDinero(m.monto), `${m.cantidad} cabezas`])

    doc.autoTable({ startY: 38, head: [columnas], body: filas })
    doc.save(`Reporte_Ventas_${periodoReporte}_${tipoReporte}.pdf`)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Ventas"
        icon={PointOfSaleOutlinedIcon}
        onAdd={() => { setEditingVenta(null); setShowForm(true) }}
        addLabel="Nueva Venta"
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Listado de Ventas" />
        <Tab label="Reportes y Estadísticas" icon={<AssessmentIcon />} iconPosition="start" />
      </Tabs>

      {/* PESTAÑA O: LISTADO OPERATIVO ORIGINAL */}
      {tabValue === 0 && (
        <>
          {/* Filtros */}
          <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                placeholder="Buscar por cliente, CI, corral o guía de salida..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <Tooltip title="Filtros">
                  <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Ordenar por</InputLabel>
                  <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Ordenar por">
                    {sortOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </Stack>

            {showFilters && (
              <Stack direction="row" spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0' }} flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Modalidad</InputLabel>
                  <Select value={filterModalidad} onChange={(e) => setFilterModalidad(e.target.value)} label="Modalidad">
                    {modalidadOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <Box sx={{ flex: 1 }} />
                {(searchTerm || filterModalidad !== 'todos') && (
                  <Chip
                    label="Limpiar filtros"
                    size="small"
                    onClick={() => { setSearchTerm(''); setFilterModalidad('todos') }}
                    onDelete={() => { setSearchTerm(''); setFilterModalidad('todos') }}
                  />
                )}
              </Stack>
            )}

            {(searchTerm || filterModalidad !== 'todos') && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {ventasFiltradas.length} de {notasVenta?.length || 0} ventas encontradas
              </Typography>
            )}
          </Paper>

          {/* Tabla */}
          {ventasFiltradas.length === 0 ? (
            <EmptyState
              icon={PointOfSaleOutlinedIcon}
              title={searchTerm ? 'No se encontraron ventas' : 'No hay ventas registradas'}
              description={searchTerm ? 'Intentá con otros términos.' : 'Registrá la primera venta de animales.'}
              onAction={() => setShowForm(true)}
              actionLabel={searchTerm ? 'Limpiar búsqueda' : 'Registrar primera venta'}
              onSecondaryAction={searchTerm ? () => setSearchTerm('') : undefined}
            />
          ) : (
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Modalidad</TableCell>
                      <TableCell>Corral</TableCell>
                      <TableCell>Guía Salida</TableCell>
                      <TableCell align="right">Monto Total</TableCell>
                      <TableCell align="right">Utilidad</TableCell>
                      <TableCell align="center">Animales</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ventasFiltradas.map((v) => {
                      const utilidad = calcularUtilidadVenta(v)
                      return (
                        <TableRow key={v.id} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(v.fechaVenta).toLocaleDateString('es-BO')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {[v.cliente?.nombre, v.cliente?.apellidos].filter(Boolean).join(' ') || 'N/A'}
                            </Typography>
                            {v.cliente?.ci && (
                              <Typography variant="caption" color="text.secondary">{v.cliente.ci}</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={MODALIDAD_LABEL[v.modalidadVenta] || v.modalidadVenta}
                              size="small"
                              color={v.modalidadVenta === 'POR_KILO' ? 'info' : v.modalidadVenta === 'POR_CABEZA' ? 'secondary' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {v.corral?.nombre || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {v.guiaSalida || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#16a34a' }}>
                              Bs. {(v.montoTotal || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {utilidad !== null ? (
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: utilidad >= 0 ? '#2563eb' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}
                              >
                                <TrendingUpIcon sx={{ fontSize: 14 }} />
                                {utilidad >= 0 ? '+' : ''}Bs. {utilidad.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={v.detalles?.length || 0} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Ver detalles">
                                <IconButton size="small" onClick={() => handleViewDetails(v)} sx={{ color: '#3b82f6' }}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Editar">
                                <IconButton size="small" onClick={() => handleEdit(v)} sx={{ color: '#eab308' }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton size="small" onClick={() => handleDeleteClick(v)} sx={{ color: '#ef4444' }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          )}
        </>
      )}

      {/* PESTAÑA 1: REPORTE AVANZADO CON SELECCIÓN DE TIPO JUNTO A PERIODO */}
      {tabValue === 1 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          
          {/* Fila de Controles: Periodo, Tipo de Reporte y Botones de Descarga */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-xl border border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Selector de Período */}
              <div className="flex flex-col gap-1 border border-gray-200 rounded-lg px-3 py-1 bg-white min-w-[160px]">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Período de Análisis</label>
                <select 
                  value={periodoReporte} 
                  onChange={(e) => setPeriodoReporte(e.target.value)}
                  className="text-sm font-semibold bg-transparent text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="Día">📅 Día</option>
                  <option value="Semana">📅 Semana</option>
                  <option value="Mes">📅 Mes</option>
                  <option value="Año">📅 Año</option>
                </select>
              </div>

              {/* NUEVO Selector: Tipo de Reporte */}
              <div className="flex flex-col gap-1 border border-gray-200 rounded-lg px-3 py-1 bg-white min-w-[180px]">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Tipo de Reporte / Métrica</label>
                <select 
                  value={tipoReporte} 
                  onChange={(e) => setTipoReporte(e.target.value)}
                  className="text-sm font-semibold bg-transparent text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="Monto">💰 Monto Total (Bs.)</option>
                  <option value="Cabezas">🐄 Cantidad de Cabezas</option>
                </select>
              </div>

            </div>

            {/* Descargas */}
            <div className="flex items-center gap-2">
              <button 
                onClick={exportarExcel}
                className="flex items-center gap-1.5 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors uppercase"
              >
                📊 Excel
              </button>
              <button 
                onClick={exportarPDF}
                className="flex items-center gap-1.5 bg-[#c62828] hover:bg-[#b71c1c] text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors uppercase"
              >
                📄 PDF
              </button>
            </div>
          </div>

          {/* Micro-tarjetas de Datos Analíticos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`border rounded-xl p-4 transition-all ${tipoReporte === 'Monto' ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-100 bg-gray-50/50'}`}>
              <span className="text-xs text-gray-400 font-medium block">Total Ingresos por Ventas</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block">{formatearDinero(kpis.totalFacturado)}</span>
            </div>
            <div className={`border rounded-xl p-4 transition-all ${tipoReporte === 'Cabezas' ? 'border-blue-200 bg-blue-50/20' : 'border-gray-100 bg-gray-50/50'}`}>
              <span className="text-xs text-gray-400 font-medium block">Animales Comercializados</span>
              <span className="text-xl font-bold text-gray-700 mt-1 block">{kpis.cantidadAnimales} cabezas</span>
            </div>
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
              <span className="text-xs text-gray-400 font-medium block">Precio Promedio Unitario</span>
              <span className="text-xl font-bold text-blue-600 mt-1 block">{formatearDinero(kpis.precioPromedio)}</span>
            </div>
          </div>

          {/* Menú de Sub-Pestañas Interactivas */}
          <div className="border-b border-gray-200">
            <div className="flex gap-6 -mb-px">
              <button 
                onClick={() => setSubPestanaActiva('grafico')}
                className={`pb-3 font-medium text-sm flex items-center gap-1.5 border-b-2 transition-all ${
                  subPestanaActiva === 'grafico' 
                    ? 'border-green-600 text-green-600 font-bold' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                📊 Resumen Gráfico
              </button>
              <button 
                onClick={() => setSubPestanaActiva('detalle')}
                className={`pb-3 font-medium text-sm flex items-center gap-1.5 border-b-2 transition-all ${
                  subPestanaActiva === 'detalle' 
                    ? 'border-green-600 text-green-600 font-bold' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                📋 Detalle Proporcional
              </button>
            </div>
          </div>

          {/* Renderizado Dinámico según la Subpestaña y Tipo seleccionado */}
          <div className="pt-2">
            {subPestanaActiva === 'grafico' ? (
              <div className="h-64 bg-gray-50/30 p-4 rounded-xl border border-gray-100">
                {datosPeriodo.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosPeriodo}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={formatearEjeY} />
                      <ChartTooltip 
                        formatter={(value) => [
                          tipoReporte === 'Monto' ? formatearDinero(value) : `${value} cabezas`, 
                          tipoReporte === 'Monto' ? 'Ingresos' : 'Volumen'
                        ]} 
                      />
                      <Bar 
                        dataKey={tipoReporte === 'Monto' ? 'monto' : 'cantidad'} 
                        fill={tipoReporte === 'Monto' ? '#10b981' : '#2563eb'} 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">No hay registros cargados para graficar</div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Concepto / Fecha</th>
                      <th className="py-3 px-4">{tipoReporte === 'Monto' ? 'Monto Comercializado' : 'Volumen (Cabezas)'}</th>
                      <th className="py-3 px-4">Distribución Proporcional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {datosPeriodo.length > 0 ? (
                      datosPeriodo.map((d, index) => {
                        const valorActual = tipoReporte === 'Monto' ? d.monto : d.cantidad
                        const porcentajeBarra = Math.min((valorActual / maximoValor) * 100, 100)
                        return (
                          <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-medium">{d.name}</td>
                            <td className="py-3.5 px-4 font-bold text-gray-900">
                              {tipoReporte === 'Monto' ? formatearDinero(d.monto) : `${d.cantidad} cabezas`}
                            </td>
                            <td className="py-3.5 px-4 w-1/2">
                              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${tipoReporte === 'Monto' ? 'bg-[#10b981]' : 'bg-[#1565c0]'}`} 
                                  style={{ width: `${porcentajeBarra}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-4 text-center text-gray-400">Sin datos de distribución registrados</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form crear/editar */}
      {showForm && (
        <VentaForm
          clientes={clientes}
          animales={animalesDisponibles}
          corrales={corralesVenta}
          initialData={editingVenta ? {
            clienteId: editingVenta.cliente?.id || '',
            corralId: editingVenta.corral?.id || '',
            modalidadVenta: editingVenta.modalidadVenta || 'POR_KILO',
            fechaVenta: editingVenta.fechaVenta?.split('T')[0] || '',
            guiaSalida: editingVenta.guiaSalida || '',
            observaciones: editingVenta.observaciones || '',
            detalles: editingVenta.detalles?.map(d => ({
              animalId: d.animal?.id,
              modalidad: d.modalidad || 'POR_KILO',
              precioUnitario: d.precioUnitario,
              pesoVentaKg: d.pesoVentaKg,
              costoEstimado: d.costoEstimado || '',
              nombre: d.animal?.nombre,
              nroArete: d.animal?.nroArete,
              subtotal: d.subTotal,
              utilidad: d.utilidad,
            })) || [],
          } : null}
          onSubmit={editingVenta ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setEditingVenta(null) }}
          isEditing={!!editingVenta}
          onDelete={editingVenta ? () => handleDeleteClick(editingVenta) : null}
        />
      )}

      {/* Dialog eliminar */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar la venta #{ventaToDelete?.id} de{' '}
            <strong>{ventaToDelete?.cliente?.nombre} {ventaToDelete?.cliente?.apellidos}</strong>?
            <br /><br />
            Esta acción eliminará también todos los detalles y no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog detalle */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de Venta #{selectedVenta?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedVenta && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Cliente</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedVenta.cliente?.nombre} {selectedVenta.cliente?.apellidos || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    CI: {selectedVenta.cliente?.ci || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Fecha</Typography>
                  <Typography variant="body1">
                    {new Date(selectedVenta.fechaVenta).toLocaleDateString('es-BO')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Modalidad</Typography>
                  <Chip
                    label={MODALIDAD_LABEL[selectedVenta.modalidadVenta] || selectedVenta.modalidadVenta}
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                {selectedVenta.corral && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Corral</Typography>
                    <Typography variant="body2">{selectedVenta.corral.nombre}</Typography>
                  </Box>
                )}
                {selectedVenta.guiaSalida && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Guía de Salida</Typography>
                    <Typography variant="body2">{selectedVenta.guiaSalida}</Typography>
                  </Box>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Animales vendidos</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell>Animal</TableCell>
                      <TableCell align="center">Modalidad</TableCell>
                      <TableCell align="right">Peso (kg)</TableCell>
                      <TableCell align="right">Precio unit.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="right">Costo</TableCell>
                      <TableCell align="right">Utilidad</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedVenta.detalles?.map((d, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{d.animal?.nroArete}</Typography>
                          <Typography variant="caption" color="text.secondary">{d.animal?.nombre || 'Sin nombre'}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={d.modalidad === 'POR_KILO' ? 'x kg' : 'x cab'}
                            size="small"
                            color={d.modalidad === 'POR_KILO' ? 'info' : 'secondary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {d.modalidad === 'POR_KILO' ? `${d.pesoVentaKg} kg` : '—'}
                        </TableCell>
                        <TableCell align="right">
                          Bs. {parseFloat(d.precioUnitario || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#16a34a' }}>
                          Bs. {parseFloat(d.subTotal || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary' }}>
                          {d.costoEstimado > 0
                            ? `Bs. ${parseFloat(d.costoEstimado).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </TableCell>
                        <TableCell align="right"
                          sx={{ fontWeight: 600, color: (d.utilidad || 0) >= 0 ? '#2563eb' : '#dc2626' }}>
                          {d.costoEstimado > 0
                            ? `${(d.utilidad || 0) >= 0 ? '+' : ''}Bs. ${parseFloat(d.utilidad || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#F8FAFC', fontWeight: 700 }}>
                      <TableCell colSpan={4} align="right">
                        <Typography variant="subtitle2">Totales:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" color="#16a34a">
                          Bs. {parseFloat(selectedVenta.montoTotal || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {selectedVenta.detalles?.some(d => d.costoEstimado > 0) ? (
                          <Typography variant="subtitle2" color="text.secondary">
                            Bs. {selectedVenta.detalles.reduce((s, d) => s + parseFloat(d.costoEstimado || 0), 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                          </Typography>
                        ) : '—'}
                      </TableCell>
                      <TableCell align="right">
                        {(() => {
                          const util = calcularUtilidadVenta(selectedVenta)
                          return util !== null ? (
                            <Typography variant="subtitle2" sx={{ color: util >= 0 ? '#2563eb' : '#dc2626' }}>
                              {util >= 0 ? '+' : ''}Bs. {util.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                            </Typography>
                          ) : '—'
                        })()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>

              {selectedVenta.observaciones && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                  <Typography variant="body2" sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1, mt: 0.5 }}>
                    {selectedVenta.observaciones}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDetailDialogOpen(false); handleEdit(selectedVenta) }} color="warning">
            Editar Venta
          </Button>
          <Button onClick={() => setDetailDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}