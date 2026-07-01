// frontend/src/pages/SanidadPage.jsx
import { useState, useMemo } from 'react'
import { useSanidad } from '../hooks/useSanidad'
import LoadingSpinner from '../components/LoadingSpinner'
import TratamientoForm from '../components/TratamientoForm'
import DesparasitacionForm from '../components/DesparasitacionForm'
import ExamenLaboratorioForm from '../components/ExamenLaboratorioForm'
import MastitisForm from '../components/MastitisForm'
import TiempoRetiroForm from '../components/TiempoRetiroForm'
import AdvertenciaRetiro from '../components/AdvertenciaRetiro'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Tabs, Tab, Chip, Card, CardContent, Grid,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Stack, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Button
} from '@mui/material'
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import NoteOutlinedIcon from '@mui/icons-material/NoteOutlined'
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import FilterListIcon from '@mui/icons-material/FilterList'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'
import CloseIcon from '@mui/icons-material/Close'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined'

const KPI = ({ label, value, sub, accent }) => (
  <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderLeft: `4px solid ${accent}`, borderRadius: 2 }}>
    <CardContent sx={{ p: '16px !important' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color: accent, lineHeight: 1.2 }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </CardContent>
  </Card>
)

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-PY') : '—'

// Componente de Reportes
const ReportesSanidad = ({ 
  tratamientos, 
  desparasitaciones, 
  diagnosticos, 
  observaciones, 
  examenesLaboratorio, 
  registrosMastitis, 
  animalesEnRetiro 
}) => {
  const [tipoModulo, setTipoModulo] = useState('TRATAMIENTOS')
  const [tipoReporte, setTipoReporte] = useState('SEMANA')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [formato, setFormato] = useState('EXCEL')
  const [reporteOpen, setReporteOpen] = useState(false)

  // Datos según el módulo seleccionado
  const datosModulo = useMemo(() => {
    switch(tipoModulo) {
      case 'TRATAMIENTOS':
        return tratamientos.map(t => ({
          fecha: t.fecha,
          principal: t.diagnostico || '—',
          secundario: t.animal?.nroArete || '—',
          tercero: `Gs. ${parseFloat(t.costoTotal || 0).toLocaleString()}`,
          estado: t.enTratamiento ? 'Activo' : 'Completado',
          tipo: 'Tratamiento'
        }))
      case 'DESPARASITACIONES':
        return desparasitaciones.map(d => ({
          fecha: d.fecha,
          principal: d.producto || '—',
          secundario: d.animal?.nroArete || '—',
          tercero: d.tipoParasiticida || '—',
          estado: d.fechaProxima ? `Próxima: ${fmt(d.fechaProxima)}` : 'Completado',
          tipo: 'Desparasitación'
        }))
      case 'DIAGNOSTICOS':
        return diagnosticos.map(d => ({
          fecha: d.fecha,
          principal: d.descripcion?.substring(0, 50) || '—',
          secundario: d.animal?.nroArete || '—',
          tercero: d.veterinario ? `${d.veterinario.nombre} ${d.veterinario.apellidos || ''}` : '—',
          estado: d.enfermedad?.nombre || '—',
          tipo: 'Diagnóstico'
        }))
      case 'OBSERVACIONES':
        return observaciones.map(o => ({
          fecha: o.fecha,
          principal: o.descripcion?.substring(0, 50) || '—',
          secundario: o.animal?.nroArete || '—',
          tercero: '—',
          estado: 'Registrado',
          tipo: 'Observación'
        }))
      case 'EXAMENES_LAB':
        return examenesLaboratorio.map(e => ({
          fecha: e.fechaToma,
          principal: e.tipoExamen || '—',
          secundario: e.animal?.nroArete || '—',
          tercero: e.laboratorio || '—',
          estado: e.esNormal ? 'Normal' : 'Anormal',
          tipo: 'Examen Lab'
        }))
      case 'MASTITIS':
        return registrosMastitis.map(m => ({
          fecha: m.fecha,
          principal: m.tipo || '—',
          secundario: m.animal?.nroArete || '—',
          tercero: m.cuartoAfectado || '—',
          estado: m.seCuro ? 'Curado' : 'Activo',
          tipo: 'Mastitis'
        }))
      case 'TIEMPO_RETIRO':
        return animalesEnRetiro.map(r => ({
          fecha: r.fechaInicio,
          principal: r.tipoRetiro === 'CARNE' ? 'Retiro Carne' : r.tipoRetiro === 'LECHE' ? 'Retiro Leche' : 'Ambos',
          secundario: r.animal?.nroArete || '—',
          tercero: `${r.diasRestantes} días restantes`,
          estado: r.activo ? 'Activo' : 'Completado',
          tipo: 'Tiempo Retiro'
        }))
      default:
        return []
    }
  }, [tipoModulo, tratamientos, desparasitaciones, diagnosticos, observaciones, examenesLaboratorio, registrosMastitis, animalesEnRetiro])

  // Filtrar por fechas
  const datosFiltrados = useMemo(() => {
    let datos = [...datosModulo]
    const hoy = new Date()
    let inicio = null, fin = null

    if (tipoReporte === 'DIA') {
      inicio = hoy.toISOString().split('T')[0]
      fin = hoy.toISOString().split('T')[0]
    } else if (tipoReporte === 'SEMANA') {
      const start = new Date(hoy)
      start.setDate(hoy.getDate() - hoy.getDay())
      inicio = start.toISOString().split('T')[0]
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      fin = end.toISOString().split('T')[0]
    } else if (tipoReporte === 'MES') {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]
    } else if (tipoReporte === 'ANIO') {
      inicio = new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0]
      fin = new Date(hoy.getFullYear(), 11, 31).toISOString().split('T')[0]
    } else if (tipoReporte === 'PERSONALIZADO' && fechaInicio && fechaFin) {
      inicio = fechaInicio
      fin = fechaFin
    }

    if (inicio && fin) {
      datos = datos.filter(d => new Date(d.fecha) >= new Date(inicio) && new Date(d.fecha) <= new Date(fin))
    }
    return datos
  }, [datosModulo, tipoReporte, fechaInicio, fechaFin])

  // Datos para el gráfico
  const datosGrafico = useMemo(() => {
    const agrupado = {}
    datosFiltrados.forEach(d => {
      const fecha = new Date(d.fecha).toLocaleDateString('es-PY')
      agrupado[fecha] = (agrupado[fecha] || 0) + 1
    })
    return Object.entries(agrupado)
      .sort((a, b) => new Date(a[0].split('/').reverse().join('-')) - new Date(b[0].split('/').reverse().join('-')))
      .slice(-10)
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
  }, [datosFiltrados])

  const totalRegistros = datosFiltrados.length

  const getColumnas = () => {
    switch(tipoModulo) {
      case 'TRATAMIENTOS':
        return ['Fecha', 'Diagnóstico', 'Animal', 'Costo', 'Estado']
      case 'DESPARASITACIONES':
        return ['Fecha', 'Producto', 'Animal', 'Tipo', 'Estado']
      case 'DIAGNOSTICOS':
        return ['Fecha', 'Descripción', 'Animal', 'Veterinario', 'Enfermedad']
      case 'OBSERVACIONES':
        return ['Fecha', 'Observación', 'Animal', '', 'Estado']
      case 'EXAMENES_LAB':
        return ['Fecha', 'Tipo Examen', 'Animal', 'Laboratorio', 'Resultado']
      case 'MASTITIS':
        return ['Fecha', 'Tipo', 'Animal', 'Cuarto', 'Estado']
      case 'TIEMPO_RETIRO':
        return ['Fecha Inicio', 'Tipo Retiro', 'Animal', 'Detalle', 'Estado']
      default:
        return ['Fecha', 'Descripción', 'Animal', '', 'Estado']
    }
  }

  const generarReporte = () => {
    const columnas = getColumnas()
    
    if (formato === 'EXCEL') {
      let csvContent = columnas.join(',') + '\n'
      datosFiltrados.forEach(d => {
        const row = [
          `"${fmt(d.fecha)}"`,
          `"${d.principal}"`,
          `"${d.secundario}"`,
          `"${d.tercero}"`,
          `"${d.estado}"`
        ].join(',')
        csvContent += row + '\n'
      })
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.setAttribute('download', `reporte_${tipoModulo.toLowerCase()}_${tipoReporte}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } else {
      const printContent = `
        <html>
          <head><title>Reporte de ${tipoModulo}</title></head>
          <body>
            <h1>Reporte de ${tipoModulo} - ${tipoReporte}</h1>
            <p>Total registros: ${totalRegistros}</p>
            <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
              <thead>
                <tr>${columnas.map(col => `<th>${col}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${datosFiltrados.map(d => `
                  <tr>
                    <td>${fmt(d.fecha)}</td>
                    <td>${d.principal}</td>
                    <td>${d.secundario}</td>
                    <td>${d.tercero}</td>
                    <td>${d.estado}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `
      const printWindow = window.open('', '_blank')
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const getModuloNombre = () => {
    switch(tipoModulo) {
      case 'TRATAMIENTOS': return 'Tratamientos'
      case 'DESPARASITACIONES': return 'Desparasitaciones'
      case 'DIAGNOSTICOS': return 'Diagnósticos'
      case 'OBSERVACIONES': return 'Observaciones'
      case 'EXAMENES_LAB': return 'Exámenes de Laboratorio'
      case 'MASTITIS': return 'Mastitis'
      case 'TIEMPO_RETIRO': return 'Tiempo de Retiro'
      default: return 'Sanidad'
    }
  }

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Módulo</InputLabel>
            <Select value={tipoModulo} onChange={(e) => setTipoModulo(e.target.value)} label="Módulo">
              <MenuItem value="TRATAMIENTOS">Tratamientos</MenuItem>
              <MenuItem value="DESPARASITACIONES">Desparasitaciones</MenuItem>
              <MenuItem value="DIAGNOSTICOS">Diagnósticos</MenuItem>
              <MenuItem value="OBSERVACIONES">Observaciones</MenuItem>
              <MenuItem value="EXAMENES_LAB">Exámenes Laboratorio</MenuItem>
              <MenuItem value="MASTITIS">Mastitis</MenuItem>
              <MenuItem value="TIEMPO_RETIRO">Tiempo Retiro</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo de Reporte</InputLabel>
            <Select value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value)} label="Tipo de Reporte">
              <MenuItem value="DIA">Día</MenuItem>
              <MenuItem value="SEMANA">Semana</MenuItem>
              <MenuItem value="MES">Mes</MenuItem>
              <MenuItem value="ANIO">Año</MenuItem>
              <MenuItem value="PERSONALIZADO">Personalizado</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {tipoReporte === 'PERSONALIZADO' && (
          <>
            <Grid item xs={12} md={2}>
              <TextField label="Fecha Inicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField label="Fecha Fin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
          </>
        )}
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Formato</InputLabel>
            <Select value={formato} onChange={(e) => setFormato(e.target.value)} label="Formato">
              <MenuItem value="EXCEL"><TableChartIcon sx={{ mr: 1, fontSize: 16 }} /> Excel</MenuItem>
              <MenuItem value="PDF"><PictureAsPdfIcon sx={{ mr: 1, fontSize: 16 }} /> PDF</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={1}>
          <Button variant="contained" onClick={generarReporte} fullWidth sx={{ bgcolor: '#2E7D32', height: '40px' }}>
            Generar
          </Button>
        </Grid>
      </Grid>

      {/* KPIs del reporte */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F5F5' }}>
            <Typography variant="h3" fontWeight={700} color="#E65100">{totalRegistros}</Typography>
            <Typography variant="caption">Total {getModuloNombre()}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F5F5' }}>
            <Typography variant="h3" fontWeight={700} color="#2E7D32">{datosGrafico.length}</Typography>
            <Typography variant="caption">Días con registros</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F5F5' }}>
            <Typography variant="h3" fontWeight={700} color="#1565C0">{datosGrafico.reduce((sum, item) => sum + item.cantidad, 0)}</Typography>
            <Typography variant="caption">Total en período</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Gráfico de barras */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>{getModuloNombre()} por Fecha</Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Cantidad</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Gráfico</th>
              </tr>
            </thead>
            <tbody>
              {datosGrafico.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>No hay datos en el período seleccionado</td></tr>
              ) : (
                datosGrafico.slice().reverse().map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.fecha}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.cantidad}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: `${Math.min(item.cantidad * 30, 200)}px`, height: '20px', bgcolor: '#E65100', borderRadius: 1 }} />
                        <Typography variant="caption">{item.cantidad}</Typography>
                      </Box>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Box>
      </Paper>

      {/* Tabla de datos */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Detalle de {getModuloNombre()}</Typography>
        <Box sx={{ overflowX: 'auto', maxHeight: '400px' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {getColumnas().map(col => (
                  <TableCell key={col} sx={{ fontWeight: 700 }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {datosFiltrados.slice(0, 100).map((item, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{fmt(item.fecha)}</TableCell>
                  <TableCell>{item.principal}</TableCell>
                  <TableCell>{item.secundario}</TableCell>
                  <TableCell>{item.tercero}</TableCell>
                  <TableCell>
                    <Chip size="small" label={item.estado} 
                      sx={item.estado === 'Activo' || item.estado === 'Normal' 
                        ? { bgcolor: '#DCFCE7', color: '#166534' }
                        : item.estado === 'Completado' || item.estado === 'Curado'
                        ? { bgcolor: '#DBEAFE', color: '#1E40AF' }
                        : { bgcolor: '#FEF3C7', color: '#92400E' }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  )
}

const TABS = [
  { label: 'Dashboard', Icon: HealthAndSafetyOutlinedIcon },
  { label: 'Tratamientos', Icon: MedicalServicesOutlinedIcon },
  { label: 'Desparasitaciones', Icon: BugReportOutlinedIcon },
  { label: 'Diagnósticos', Icon: AssignmentOutlinedIcon },
  { label: 'Observaciones', Icon: NoteOutlinedIcon },
  { label: 'Exámenes Lab', Icon: ScienceOutlinedIcon },
  { label: 'Mastitis', Icon: LocalHospitalOutlinedIcon },
  { label: 'Tiempo Retiro', Icon: TimerOutlinedIcon },
  { label: '+ Tratamiento', Icon: AddCircleOutlinedIcon },
  { label: '+ Desparasitación', Icon: AddCircleOutlinedIcon },
  { label: '+ Examen Lab', Icon: ScienceOutlinedIcon },
  { label: '+ Mastitis', Icon: LocalHospitalOutlinedIcon },
  { label: '+ Tiempo Retiro', Icon: TimerOutlinedIcon },
  { label: 'Reportes', Icon: AssessmentIcon },
  { label: 'Calendario', Icon: CalendarMonthOutlinedIcon },
]

const TAB_CALENDARIO = 14

// Colores de prioridad y estado para el calendario sanitario
const PRIORIDAD_SX = {
  CRITICA: { bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 600 },
  ALTA: { bgcolor: '#FFE0B2', color: '#E65100', fontWeight: 600 },
  MEDIA: { bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 500 },
  BAJA: { bgcolor: '#E2E8F0', color: '#475569', fontWeight: 500 },
}
const estadoSx = (estado) => {
  if (['Vencida', 'Activa'].includes(estado)) return { bgcolor: '#FEE2E2', color: '#991B1B' }
  if (estado === 'Próxima') return { bgcolor: '#FEF3C7', color: '#92400E' }
  if (estado === 'Activo') return { bgcolor: '#E0F2FE', color: '#075985' }
  return { bgcolor: '#EDE9FE', color: '#5B21B6' }
}
const hoyISO = () => new Date().toISOString().slice(0, 10)

export default function SanidadPage() {
  const {
    tratamientos,
    tratamientosActivos,
    desparasitaciones,
    diagnosticos,
    observaciones,
    examenesLaboratorio,
    registrosMastitis,
    animalesEnRetiro,
    resumenSanidad,
    calendarioSanitario,
    finalizarTratamiento,
    crearTiempoRetiro,
    crearObservacion,
    refetchResumen,
    refetchCalendario,
    loading
  } = useSanidad()

  const [tabIdx, setTabIdx] = useState(0)

  // ==========================================
  // Acciones sobre Tratamientos Activos
  // ==========================================
  const [detalleTratamiento, setDetalleTratamiento] = useState(null)
  const [retiroTratamiento, setRetiroTratamiento] = useState(null)
  const [seguimientoTratamiento, setSeguimientoTratamiento] = useState(null)
  const [retiroForm, setRetiroForm] = useState({ tipoRetiro: 'LECHE', diasRetiro: 3, fechaInicio: hoyISO() })
  const [seguimientoTexto, setSeguimientoTexto] = useState('')
  const [accionMsg, setAccionMsg] = useState(null)
  const [calPrioridad, setCalPrioridad] = useState('todos')

  const refrescarDashboard = () => { refetchResumen?.(); refetchCalendario?.() }

  const handleFinalizar = async (t) => {
    if (!window.confirm(`¿Finalizar el tratamiento de ${t.animal?.nroArete}?`)) return
    const res = await finalizarTratamiento(t.id, hoyISO())
    setAccionMsg(res?.success
      ? { type: 'success', text: 'Tratamiento finalizado.' }
      : { type: 'error', text: res?.error || 'No se pudo finalizar.' })
    refrescarDashboard()
  }

  const abrirRetiro = (t) => {
    setRetiroForm({ tipoRetiro: 'LECHE', diasRetiro: 3, fechaInicio: hoyISO() })
    setRetiroTratamiento(t)
  }
  const guardarRetiro = async () => {
    const res = await crearTiempoRetiro({
      tratamientoId: retiroTratamiento.id,
      tipoRetiro: retiroForm.tipoRetiro,
      fechaInicio: retiroForm.fechaInicio,
      diasRetiro: parseInt(retiroForm.diasRetiro, 10) || 0,
    })
    setAccionMsg(res?.success
      ? { type: 'success', text: 'Tiempo de retiro registrado.' }
      : { type: 'error', text: res?.error || 'No se pudo registrar el retiro.' })
    setRetiroTratamiento(null)
    refrescarDashboard()
  }

  const abrirSeguimiento = (t) => {
    setSeguimientoTexto('')
    setSeguimientoTratamiento(t)
  }
  const guardarSeguimiento = async () => {
    if (!seguimientoTexto.trim()) return
    const res = await crearObservacion({
      animalId: seguimientoTratamiento.animal.id,
      fecha: hoyISO(),
      descripcion: seguimientoTexto.trim(),
    })
    setAccionMsg(res?.success
      ? { type: 'success', text: 'Seguimiento registrado como observación.' }
      : { type: 'error', text: res?.error || 'No se pudo registrar el seguimiento.' })
    setSeguimientoTratamiento(null)
  }

  // Estados para filtros generales
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // Filtros específicos para tratamientos
  const [tratamientoEstadoFilter, setTratamientoEstadoFilter] = useState('todos')

  // Filtros específicos para desparasitaciones
  const [desparasitacionTipoFilter, setDesparasitacionTipoFilter] = useState('todos')

  // Filtros específicos para diagnósticos
  const [diagnosticoVeterinarioFilter, setDiagnosticoVeterinarioFilter] = useState('')

  // Filtros específicos para observaciones
  const [observacionSearchTerm, setObservacionSearchTerm] = useState('')

  // Filtros específicos para exámenes de laboratorio
  const [examenTipoFilter, setExamenTipoFilter] = useState('todos')
  const [examenEstadoFilter, setExamenEstadoFilter] = useState('todos')

  // Filtros específicos para mastitis
  const [mastitisTipoFilter, setMastitisTipoFilter] = useState('todos')
  const [mastitisEstadoFilter, setMastitisEstadoFilter] = useState('todos')

  // ==========================================
  // FILTROS PARA TRATAMIENTOS
  // ==========================================
  const tratamientosFiltrados = useMemo(() => {
    let filtered = [...tratamientos]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.animal?.nroArete?.toLowerCase().includes(term) ||
        t.animal?.nombre?.toLowerCase().includes(term) ||
        t.diagnostico?.toLowerCase().includes(term)
      )
    }

    if (tratamientoEstadoFilter !== 'todos') {
      filtered = filtered.filter(t =>
        tratamientoEstadoFilter === 'activo' ? t.enTratamiento === true : t.enTratamiento === false
      )
    }

    if (fechaInicio) {
      filtered = filtered.filter(t => new Date(t.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(t => new Date(t.fecha) <= new Date(fechaFin))
    }

    return filtered
  }, [tratamientos, searchTerm, tratamientoEstadoFilter, fechaInicio, fechaFin])

  // ==========================================
  // FILTROS PARA DESPARASITACIONES
  // ==========================================
  const desparasitacionesFiltradas = useMemo(() => {
    let filtered = [...desparasitaciones]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(d =>
        d.animal?.nroArete?.toLowerCase().includes(term) ||
        d.animal?.nombre?.toLowerCase().includes(term) ||
        d.producto?.toLowerCase().includes(term)
      )
    }

    if (desparasitacionTipoFilter !== 'todos') {
      filtered = filtered.filter(d => d.tipoParasiticida === desparasitacionTipoFilter)
    }

    if (fechaInicio) {
      filtered = filtered.filter(d => new Date(d.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(d => new Date(d.fecha) <= new Date(fechaFin))
    }

    return filtered
  }, [desparasitaciones, searchTerm, desparasitacionTipoFilter, fechaInicio, fechaFin])

  // ==========================================
  // FILTROS PARA DIAGNÓSTICOS
  // ==========================================
  const diagnosticosFiltrados = useMemo(() => {
    let filtered = [...diagnosticos]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(d =>
        d.animal?.nroArete?.toLowerCase().includes(term) ||
        d.animal?.nombre?.toLowerCase().includes(term) ||
        d.descripcion?.toLowerCase().includes(term)
      )
    }

    if (diagnosticoVeterinarioFilter) {
      const vetTerm = diagnosticoVeterinarioFilter.toLowerCase()
      filtered = filtered.filter(d =>
        d.veterinario?.nombre?.toLowerCase().includes(vetTerm) ||
        d.veterinario?.apellidos?.toLowerCase().includes(vetTerm)
      )
    }

    if (fechaInicio) {
      filtered = filtered.filter(d => new Date(d.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(d => new Date(d.fecha) <= new Date(fechaFin))
    }

    return filtered
  }, [diagnosticos, searchTerm, diagnosticoVeterinarioFilter, fechaInicio, fechaFin])

  // ==========================================
  // FILTROS PARA OBSERVACIONES
  // ==========================================
  const observacionesFiltradas = useMemo(() => {
    let filtered = [...observaciones]

    if (observacionSearchTerm) {
      const term = observacionSearchTerm.toLowerCase()
      filtered = filtered.filter(o =>
        o.animal?.nroArete?.toLowerCase().includes(term) ||
        o.animal?.nombre?.toLowerCase().includes(term) ||
        o.descripcion?.toLowerCase().includes(term)
      )
    }

    if (fechaInicio) {
      filtered = filtered.filter(o => new Date(o.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(o => new Date(o.fecha) <= new Date(fechaFin))
    }

    return filtered
  }, [observaciones, observacionSearchTerm, fechaInicio, fechaFin])

  // ==========================================
  // FILTROS PARA EXÁMENES DE LABORATORIO
  // ==========================================
  const examenesFiltrados = useMemo(() => {
    let filtered = [...(examenesLaboratorio || [])]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(e =>
        e.animal?.nroArete?.toLowerCase().includes(term) ||
        e.animal?.nombre?.toLowerCase().includes(term) ||
        e.laboratorio?.toLowerCase().includes(term) ||
        e.resultado?.toLowerCase().includes(term)
      )
    }

    if (examenTipoFilter !== 'todos') {
      filtered = filtered.filter(e => e.tipoExamen === examenTipoFilter)
    }

    if (examenEstadoFilter !== 'todos') {
      filtered = filtered.filter(e => 
        examenEstadoFilter === 'normal' ? e.esNormal === true : e.esNormal === false
      )
    }

    if (fechaInicio) {
      filtered = filtered.filter(e => new Date(e.fechaToma) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(e => new Date(e.fechaToma) <= new Date(fechaFin))
    }

    return filtered
  }, [examenesLaboratorio, searchTerm, examenTipoFilter, examenEstadoFilter, fechaInicio, fechaFin])

  // ==========================================
  // FILTROS PARA MASTITIS
  // ==========================================
  const mastitisFiltrados = useMemo(() => {
    let filtered = [...(registrosMastitis || [])]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(m =>
        m.animal?.nroArete?.toLowerCase().includes(term) ||
        m.animal?.nombre?.toLowerCase().includes(term) ||
        (m.bacteria || '').toLowerCase().includes(term)
      )
    }

    if (mastitisTipoFilter !== 'todos') {
      filtered = filtered.filter(m => m.tipo === mastitisTipoFilter)
    }

    if (mastitisEstadoFilter !== 'todos') {
      filtered = filtered.filter(m =>
        mastitisEstadoFilter === 'activo' ? m.seCuro === false : m.seCuro === true
      )
    }

    if (fechaInicio) {
      filtered = filtered.filter(m => new Date(m.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(m => new Date(m.fecha) <= new Date(fechaFin))
    }

    return filtered
  }, [registrosMastitis, searchTerm, mastitisTipoFilter, mastitisEstadoFilter, fechaInicio, fechaFin])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setTratamientoEstadoFilter('todos')
    setDesparasitacionTipoFilter('todos')
    setDiagnosticoVeterinarioFilter('')
    setObservacionSearchTerm('')
    setExamenTipoFilter('todos')
    setExamenEstadoFilter('todos')
    setMastitisTipoFilter('todos')
    setMastitisEstadoFilter('todos')
    setFechaInicio('')
    setFechaFin('')
  }

  const tabsWithCount = TABS.map((t, i) => ({
    ...t,
    count: i === 1 ? tratamientosFiltrados.length
         : i === 2 ? desparasitacionesFiltradas.length
         : i === 3 ? diagnosticosFiltrados.length
         : i === 4 ? observacionesFiltradas.length
         : i === 5 ? examenesFiltrados?.length || 0
         : i === 6 ? mastitisFiltrados?.length || 0
         : i === 7 ? animalesEnRetiro?.length || 0
         : undefined,
  }))

  if (loading) return <LoadingSpinner />

  const hayFiltrosActivos = searchTerm || tratamientoEstadoFilter !== 'todos' ||
    desparasitacionTipoFilter !== 'todos' || diagnosticoVeterinarioFilter ||
    observacionSearchTerm || examenTipoFilter !== 'todos' || examenEstadoFilter !== 'todos' ||
    mastitisTipoFilter !== 'todos' || mastitisEstadoFilter !== 'todos' ||
    fechaInicio || fechaFin

  const mostrarFiltros = [1, 2, 3, 4, 5, 6, 7].includes(tabIdx)

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">Módulo de Sanidad</Typography>
        <Typography variant="body2" color="text.secondary">Tratamientos, desparasitaciones, diagnósticos, exámenes y registros sanitarios</Typography>
      </Box>

      {/* Advertencia global de animales en tiempo de retiro */}
      <AdvertenciaRetiro />

      {/* KPIs del dashboard sanitario (datos reales en tiempo real) */}
      <Grid container spacing={2}>
        {[
          { label: 'Tratamientos activos', value: resumenSanidad?.tratamientosActivos ?? tratamientosActivos.length, accent: '#E65100' },
          { label: 'Vacunas próximas', value: resumenSanidad?.vacunasProximas ?? 0, accent: '#1565C0' },
          { label: 'Vacunas vencidas', value: resumenSanidad?.vacunasVencidas ?? 0, accent: '#C62828' },
          { label: 'Desparasit. próximas', value: resumenSanidad?.desparasitacionesProximas ?? 0, accent: '#2E7D32' },
          { label: 'Desparasit. vencidas', value: resumenSanidad?.desparasitacionesVencidas ?? 0, accent: '#C62828' },
          { label: 'Mastitis activas', value: resumenSanidad?.mastitisActivas ?? 0, accent: '#AD1457' },
          { label: 'Exámenes pendientes', value: resumenSanidad?.examenesPendientes ?? 0, accent: '#6A1B9A' },
          { label: 'Animales en retiro', value: resumenSanidad?.animalesEnRetiro ?? (animalesEnRetiro?.length || 0), accent: '#B71C1C' },
        ].map((k) => (
          <Grid item xs={6} sm={4} md={3} lg={1.5} key={k.label}>
            <KPI label={k.label} value={k.value} accent={k.accent} />
          </Grid>
        ))}
      </Grid>

      {/* Barra de búsqueda y filtros */}
      {mostrarFiltros && (
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Buscar por arete, nombre, diagnóstico, laboratorio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              slotProps={{
                input: {
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
                }
              }}
            />

            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Tooltip title="Filtros avanzados">
                <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              {hayFiltrosActivos && (
                <Chip
                  label="Limpiar filtros"
                  size="small"
                  onClick={limpiarFiltros}
                  onDelete={limpiarFiltros}
                />
              )}
            </Box>
          </Stack>

          {/* Filtros avanzados */}
          {showFilters && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
              {/* Filtro específico para Tratamientos */}
              {tabIdx === 1 && (
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Estado Tratamiento</InputLabel>
                  <Select value={tratamientoEstadoFilter} onChange={(e) => setTratamientoEstadoFilter(e.target.value)} label="Estado Tratamiento">
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="activo">Activos</MenuItem>
                    <MenuItem value="completado">Completados</MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* Filtro específico para Desparasitaciones */}
              {tabIdx === 2 && (
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Tipo Parasiticida</InputLabel>
                  <Select value={desparasitacionTipoFilter} onChange={(e) => setDesparasitacionTipoFilter(e.target.value)} label="Tipo Parasiticida">
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="INTERNO">Interno</MenuItem>
                    <MenuItem value="EXTERNO">Externo</MenuItem>
                    <MenuItem value="AMBOS">Ambos</MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* Filtro específico para Diagnósticos */}
              {tabIdx === 3 && (
                <TextField
                  label="Veterinario"
                  value={diagnosticoVeterinarioFilter}
                  onChange={(e) => setDiagnosticoVeterinarioFilter(e.target.value)}
                  size="small"
                  placeholder="Nombre del veterinario"
                  sx={{ minWidth: 180 }}
                />
              )}

              {/* Filtro específico para Observaciones */}
              {tabIdx === 4 && (
                <TextField
                  label="Buscar en observaciones"
                  value={observacionSearchTerm}
                  onChange={(e) => setObservacionSearchTerm(e.target.value)}
                  size="small"
                  placeholder="Palabra clave..."
                  sx={{ minWidth: 180 }}
                  slotProps={{
                    input: {
                      endAdornment: observacionSearchTerm && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setObservacionSearchTerm('')}>
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
                  }}
                />
              )}

              {/* Filtros específicos para Exámenes de Laboratorio */}
              {tabIdx === 5 && (
                <>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Tipo Examen</InputLabel>
                    <Select value={examenTipoFilter} onChange={(e) => setExamenTipoFilter(e.target.value)} label="Tipo Examen">
                      <MenuItem value="todos">Todos</MenuItem>
                      <MenuItem value="SANGRE">Sangre</MenuItem>
                      <MenuItem value="HECES">Heces</MenuItem>
                      <MenuItem value="LECHE">Leche</MenuItem>
                      <MenuItem value="ORINA">Orina</MenuItem>
                      <MenuItem value="CULTIVO">Cultivo</MenuItem>
                      <MenuItem value="PCR">PCR</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Resultado</InputLabel>
                    <Select value={examenEstadoFilter} onChange={(e) => setExamenEstadoFilter(e.target.value)} label="Resultado">
                      <MenuItem value="todos">Todos</MenuItem>
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="anormal">Anormal</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              {/* Filtros específicos para Mastitis */}
              {tabIdx === 6 && (
                <>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select value={mastitisTipoFilter} onChange={(e) => setMastitisTipoFilter(e.target.value)} label="Tipo">
                      <MenuItem value="todos">Todos</MenuItem>
                      <MenuItem value="CLINICA">Clínica</MenuItem>
                      <MenuItem value="SUBCLINICA">Subclínica</MenuItem>
                      <MenuItem value="CRONICA">Crónica</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select value={mastitisEstadoFilter} onChange={(e) => setMastitisEstadoFilter(e.target.value)} label="Estado">
                      <MenuItem value="todos">Todos</MenuItem>
                      <MenuItem value="activo">Activo</MenuItem>
                      <MenuItem value="curado">Curado</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              <TextField
                label="Fecha desde"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 150 }}
              />

              <TextField
                label="Fecha hasta"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 150 }}
              />
            </Stack>
          )}

          {/* Indicador de resultados filtrados */}
          {hayFiltrosActivos && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
              {tabIdx === 1 && `${tratamientosFiltrados.length} de ${tratamientos.length} tratamientos encontrados`}
              {tabIdx === 2 && `${desparasitacionesFiltradas.length} de ${desparasitaciones.length} desparasitaciones encontradas`}
              {tabIdx === 3 && `${diagnosticosFiltrados.length} de ${diagnosticos.length} diagnósticos encontrados`}
              {tabIdx === 4 && `${observacionesFiltradas.length} de ${observaciones.length} observaciones encontradas`}
              {tabIdx === 5 && `${examenesFiltrados.length} de ${examenesLaboratorio?.length || 0} exámenes encontrados`}
              {tabIdx === 6 && `${mastitisFiltrados.length} de ${registrosMastitis?.length || 0} registros encontrados`}
            </Typography>
          )}
        </Paper>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIdx} onChange={(_, v) => setTabIdx(v)} variant="scrollable" scrollButtons="auto">
          {tabsWithCount.map(({ label, Icon, count }) => (
            <Tab
              key={label}
              icon={<Icon sx={{ fontSize: 17 }} />}
              iconPosition="start"
              label={count !== undefined ? `${label} (${count})` : label}
              sx={{ minHeight: 48, textTransform: 'none', fontWeight: 500, fontSize: 13 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Dashboard */}
      {tabIdx === 0 && (
        <Stack spacing={2}>
          {accionMsg && (
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2,
              border: `1px solid ${accionMsg.type === 'success' ? '#86EFAC' : '#FCA5A5'}`,
              bgcolor: accionMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: accionMsg.type === 'success' ? '#166534' : '#991B1B' }}>
                  {accionMsg.text}
                </Typography>
                <IconButton size="small" onClick={() => setAccionMsg(null)}><CloseIcon fontSize="small" /></IconButton>
              </Stack>
            </Paper>
          )}

          {/* Tratamientos Activos (operativo) */}
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#E65100', color: '#fff', px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>Tratamientos Activos</Typography>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Animal</TableCell>
                    <TableCell>Diagnóstico</TableCell>
                    <TableCell>Medicamento</TableCell>
                    <TableCell>Fecha inicio</TableCell>
                    <TableCell align="center">Días activo</TableCell>
                    <TableCell align="right">Costo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tratamientosActivos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No hay tratamientos activos
                      </TableCell>
                    </TableRow>
                  ) : (
                    tratamientosActivos.map(t => (
                      <TableRow key={t.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{t.animal?.nroArete}</Typography>
                          <Typography variant="caption" color="text.secondary">{t.animal?.nombre}</Typography>
                        </TableCell>
                        <TableCell>{t.diagnostico || '—'}</TableCell>
                        <TableCell>{t.nombreMedicamento || t.medicamento?.nombre || '—'}</TableCell>
                        <TableCell>{fmt(t.fechaInicio || t.fecha)}</TableCell>
                        <TableCell align="center">{t.diasActivo ?? '—'}</TableCell>
                        <TableCell align="right">Bs {Number(t.costoTotal || 0).toLocaleString('es-PY')}</TableCell>
                        <TableCell>
                          <Chip size="small" label="Activo" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 500 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Ver detalle">
                              <IconButton size="small" onClick={() => setDetalleTratamiento(t)}>
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Finalizar tratamiento">
                              <IconButton size="small" color="success" onClick={() => handleFinalizar(t)}>
                                <TaskAltOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Crear tiempo de retiro">
                              <IconButton size="small" color="error" onClick={() => abrirRetiro(t)}>
                                <TimerOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Registrar seguimiento">
                              <IconButton size="small" color="primary" onClick={() => abrirSeguimiento(t)}>
                                <NoteAddOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>

          {/* Últimos Diagnósticos */}
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#6A1B9A', color: '#fff', px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>Últimos Diagnósticos</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              {diagnosticosFiltrados.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>No hay diagnósticos</Typography>
              ) : (
                diagnosticosFiltrados.slice(0, 5).map(d => (
                  <Box key={d.id} sx={{ borderBottom: '1px solid #F1F5F9', pb: 1, mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight={600}>{d.animal?.nroArete}</Typography>
                      <Typography variant="caption" color="text.secondary">{fmt(d.fecha)}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{d.descripcion?.substring(0, 80)}…</Typography>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Stack>
      )}

      {/* Tratamientos con filtros */}
      {tabIdx === 1 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Animal</TableCell>
                  <TableCell>Diagnóstico</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tratamientosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {searchTerm ? 'No hay tratamientos que coincidan con la búsqueda' : 'Sin tratamientos registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  tratamientosFiltrados.map(t => (
                    <TableRow key={t.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{t.animal?.nroArete}</Typography></TableCell>
                      <TableCell>{t.diagnostico?.substring(0, 50)}</TableCell>
                      <TableCell>{new Date(t.fecha).toLocaleDateString('es-PY')}</TableCell>
                      <TableCell>
                        <Chip size="small" label={t.enTratamiento ? 'Activo' : 'Completado'}
                          sx={t.enTratamiento
                            ? { bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 500 }
                            : { bgcolor: '#DCFCE7', color: '#166534', fontWeight: 500 }} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Desparasitaciones con filtros */}
      {tabIdx === 2 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Animal</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Próxima</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {desparasitacionesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {searchTerm ? 'No hay desparasitaciones que coincidan con la búsqueda' : 'Sin desparasitaciones registradas'}
                    </TableCell>
                  </TableRow>
                ) : (
                  desparasitacionesFiltradas.map(d => (
                    <TableRow key={d.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{d.animal?.nroArete}</Typography></TableCell>
                      <TableCell>{d.producto}</TableCell>
                      <TableCell>
                        <Chip size="small" label={
                          d.tipoParasiticida === 'INTERNO' ? 'Interno' :
                            d.tipoParasiticida === 'EXTERNO' ? 'Externo' : 'Ambos'
                        } sx={{ fontSize: 11 }} />
                      </TableCell>
                      <TableCell>{new Date(d.fecha).toLocaleDateString('es-PY')}</TableCell>
                      <TableCell>{d.fechaProxima ? new Date(d.fechaProxima).toLocaleDateString('es-PY') : '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Diagnósticos con filtros */}
      {tabIdx === 3 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Animal</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Veterinario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diagnosticosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {searchTerm ? 'No hay diagnósticos que coincidan con la búsqueda' : 'Sin diagnósticos registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  diagnosticosFiltrados.map(d => (
                    <TableRow key={d.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{d.animal?.nroArete}</Typography></TableCell>
                      <TableCell>{d.descripcion?.substring(0, 60)}</TableCell>
                      <TableCell>{new Date(d.fecha).toLocaleDateString('es-PY')}</TableCell>
                      <TableCell>{[d.veterinario?.nombre, d.veterinario?.apellidos].filter(Boolean).join(' ') || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Observaciones con filtros */}
      {tabIdx === 4 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Animal</TableCell>
                  <TableCell>Observación</TableCell>
                  <TableCell>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {observacionesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {observacionSearchTerm ? 'No hay observaciones que coincidan con la búsqueda' : 'Sin observaciones registradas'}
                    </TableCell>
                  </TableRow>
                ) : (
                  observacionesFiltradas.map(o => (
                    <TableRow key={o.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{o.animal?.nroArete}</Typography></TableCell>
                      <TableCell>{o.descripcion?.substring(0, 80)}</TableCell>
                      <TableCell>{new Date(o.fecha).toLocaleDateString('es-PY')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Exámenes de Laboratorio con filtros */}
      {tabIdx === 5 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Animal</TableCell>
                  <TableCell>Tipo Examen</TableCell>
                  <TableCell>Laboratorio</TableCell>
                  <TableCell>Fecha Toma</TableCell>
                  <TableCell>Resultado</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {examenesFiltrados?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {searchTerm ? 'No hay exámenes que coincidan con la búsqueda' : 'No hay exámenes de laboratorio registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  examenesFiltrados?.map(e => (
                    <TableRow key={e.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{e.animal?.nroArete}</Typography></TableCell>
                      <TableCell>{e.tipoExamen}</TableCell>
                      <TableCell>{e.laboratorio}</TableCell>
                      <TableCell>{new Date(e.fechaToma).toLocaleDateString('es-PY')}</TableCell>
                      <TableCell>{e.resultado?.substring(0, 50)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={e.esNormal ? 'Normal' : 'Anormal'}
                          sx={e.esNormal
                            ? { bgcolor: '#DCFCE7', color: '#166534', fontWeight: 500 }
                            : { bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 500 }} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Registros de Mastitis con filtros */}
      {tabIdx === 6 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Animal</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Cuarto</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Bacteria</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mastitisFiltrados?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {searchTerm ? 'No hay registros que coincidan con la búsqueda' : 'No hay registros de mastitis'}
                    </TableCell>
                  </TableRow>
                ) : (
                  mastitisFiltrados?.map(m => (
                    <TableRow key={m.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{m.animal?.nroArete}</Typography></TableCell>
                      <TableCell>{new Date(m.fecha).toLocaleDateString('es-PY')}</TableCell>
                      <TableCell>{m.cuartoAfectado}</TableCell>
                      <TableCell>
                        <Chip size="small" label={m.tipo}
                          sx={m.tipo === 'CLINICA'
                            ? { bgcolor: '#FEE2E2', color: '#991B1B' }
                            : { bgcolor: '#FEF3C7', color: '#92400E' }} />
                      </TableCell>
                      <TableCell>{m.bacteria || '—'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={m.seCuro ? 'Curado' : 'Activo'}
                          sx={m.seCuro
                            ? { bgcolor: '#DCFCE7', color: '#166534' }
                            : { bgcolor: '#FEE2E2', color: '#991B1B' }} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Tiempos de Retiro */}
      {tabIdx === 7 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Animal</TableCell>
                  <TableCell>Tipo Retiro</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Fin</TableCell>
                  <TableCell>Días Restantes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {animalesEnRetiro?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No hay animales en período de retiro
                    </TableCell>
                  </TableRow>
                ) : (
                  animalesEnRetiro?.map(r => (
                    <TableRow key={r.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{r.animal?.nroArete}</Typography></TableCell>
                      <TableCell>{r.tipoRetiro === 'CARNE' ? 'Retiro Carne' : r.tipoRetiro === 'LECHE' ? 'Retiro Leche' : 'Ambos'}</TableCell>
                      <TableCell>{new Date(r.fechaInicio).toLocaleDateString('es-PY')}</TableCell>
                      <TableCell>{new Date(r.fechaFin).toLocaleDateString('es-PY')}</TableCell>
                      <TableCell>
                        <Chip size="small" label={`${r.diasRestantes} días`}
                          sx={r.diasRestantes <= 3
                            ? { bgcolor: '#FEE2E2', color: '#991B1B' }
                            : { bgcolor: '#FEF3C7', color: '#92400E' }} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Formularios */}
      {tabIdx === 8 && <TratamientoForm onSuccess={() => setTabIdx(1)} />}
      {tabIdx === 9 && <DesparasitacionForm onSuccess={() => setTabIdx(2)} />}
      {tabIdx === 10 && <ExamenLaboratorioForm onSuccess={() => setTabIdx(5)} />}
      {tabIdx === 11 && <MastitisForm onSuccess={() => setTabIdx(6)} />}
      {tabIdx === 12 && <TiempoRetiroForm onSuccess={() => setTabIdx(7)} />}
      
      {/* Reportes */}
      {tabIdx === 13 && (
        <ReportesSanidad
          tratamientos={tratamientos}
          desparasitaciones={desparasitaciones}
          diagnosticos={diagnosticos}
          observaciones={observaciones}
          examenesLaboratorio={examenesLaboratorio}
          registrosMastitis={registrosMastitis}
          animalesEnRetiro={animalesEnRetiro}
        />
      )}

      {/* Calendario Sanitario */}
      {tabIdx === TAB_CALENDARIO && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, borderBottom: '1px solid #E2E8F0' }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>Calendario Sanitario</Typography>
              <Typography variant="caption" color="text.secondary">
                Eventos preventivos y operativos (próximos 30 días y pendientes)
              </Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Prioridad</InputLabel>
              <Select value={calPrioridad} onChange={(e) => setCalPrioridad(e.target.value)} label="Prioridad">
                <MenuItem value="todos">Todas</MenuItem>
                <MenuItem value="CRITICA">Crítica</MenuItem>
                <MenuItem value="ALTA">Alta</MenuItem>
                <MenuItem value="MEDIA">Media</MenuItem>
                <MenuItem value="BAJA">Baja</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Animal</TableCell>
                  <TableCell>Tipo de evento</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Prioridad</TableCell>
                  <TableCell>Acción recomendada</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const eventos = (calendarioSanitario || []).filter(
                    (e) => calPrioridad === 'todos' || e.prioridad === calPrioridad
                  )
                  if (eventos.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No hay eventos sanitarios en el período
                        </TableCell>
                      </TableRow>
                    )
                  }
                  return eventos.map((e, i) => (
                    <TableRow key={`${e.referenciaTipo}-${e.referenciaId}-${i}`} hover>
                      <TableCell>{fmt(e.fecha)}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{e.animal || '—'}</Typography></TableCell>
                      <TableCell>{e.tipoEvento}</TableCell>
                      <TableCell><Chip size="small" label={e.estado} sx={estadoSx(e.estado)} /></TableCell>
                      <TableCell><Chip size="small" label={e.prioridad} sx={PRIORIDAD_SX[e.prioridad] || PRIORIDAD_SX.BAJA} /></TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{e.accionRecomendada}</Typography></TableCell>
                    </TableRow>
                  ))
                })()}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* ===== Diálogo: detalle de tratamiento ===== */}
      <Dialog open={!!detalleTratamiento} onClose={() => setDetalleTratamiento(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalle del tratamiento</DialogTitle>
        <DialogContent dividers>
          {detalleTratamiento && (
            <Stack spacing={1.2}>
              <DetalleRow label="Animal" value={`${detalleTratamiento.animal?.nroArete || ''} ${detalleTratamiento.animal?.nombre ? '· ' + detalleTratamiento.animal.nombre : ''}`} />
              <DetalleRow label="Diagnóstico" value={detalleTratamiento.diagnostico || '—'} />
              <DetalleRow label="Medicamento" value={detalleTratamiento.nombreMedicamento || detalleTratamiento.medicamento?.nombre || '—'} />
              <DetalleRow label="Fecha inicio" value={fmt(detalleTratamiento.fechaInicio || detalleTratamiento.fecha)} />
              <DetalleRow label="Días activo" value={`${detalleTratamiento.diasActivo ?? '—'} días`} />
              <DetalleRow label="Costo" value={`Bs ${Number(detalleTratamiento.costoTotal || 0).toLocaleString('es-PY')}`} />
              <DetalleRow label="Observaciones" value={detalleTratamiento.observaciones || '—'} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetalleTratamiento(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Diálogo: crear tiempo de retiro ===== */}
      <Dialog open={!!retiroTratamiento} onClose={() => setRetiroTratamiento(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Crear tiempo de retiro</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {retiroTratamiento?.animal?.nroArete} · {retiroTratamiento?.diagnostico || 'Tratamiento'}
          </Typography>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Tipo de retiro</InputLabel>
              <Select
                value={retiroForm.tipoRetiro}
                onChange={(e) => setRetiroForm({ ...retiroForm, tipoRetiro: e.target.value })}
                label="Tipo de retiro"
              >
                <MenuItem value="LECHE">Retiro de leche</MenuItem>
                <MenuItem value="CARNE">Retiro de carne</MenuItem>
                <MenuItem value="AMBOS">Carne y leche</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Fecha de inicio" type="date" size="small" fullWidth
              value={retiroForm.fechaInicio}
              onChange={(e) => setRetiroForm({ ...retiroForm, fechaInicio: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Días de retiro" type="number" size="small" fullWidth
              value={retiroForm.diasRetiro}
              onChange={(e) => setRetiroForm({ ...retiroForm, diasRetiro: e.target.value })}
              slotProps={{ htmlInput: { min: 1 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRetiroTratamiento(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={guardarRetiro}>Registrar retiro</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Diálogo: registrar seguimiento (observación) ===== */}
      <Dialog open={!!seguimientoTratamiento} onClose={() => setSeguimientoTratamiento(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Registrar seguimiento</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Se guardará como observación sanitaria de {seguimientoTratamiento?.animal?.nroArete}.
          </Typography>
          <TextField
            label="Seguimiento / evolución" multiline minRows={3} fullWidth autoFocus
            value={seguimientoTexto}
            onChange={(e) => setSeguimientoTexto(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSeguimientoTratamiento(null)}>Cancelar</Button>
          <Button variant="contained" disabled={!seguimientoTexto.trim()} onClick={guardarSeguimiento}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

const DetalleRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Typography variant="body2" sx={{ minWidth: 120, color: 'text.secondary' }}>{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value}</Typography>
  </Box>
)