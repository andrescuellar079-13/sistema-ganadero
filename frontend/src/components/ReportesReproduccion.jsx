// frontend/src/components/ReportesReproduccion.jsx
import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Alert,
} from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'
import BarChartIcon from '@mui/icons-material/BarChart'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ReportesReproduccion = ({ 
  partos = [], 
  inseminaciones = [], 
  vacasPrenadas = [],
  diagnosticos = [],
  celos = [],
  palpaciones = [],
  destetes = []
}) => {
  const [tabValue, setTabValue] = useState(0)
  const [periodo, setPeriodo] = useState('mes')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [tipoReporte, setTipoReporte] = useState('partos')

  // Calcular fechas según período seleccionado
  const calcularFechas = () => {
    const hoy = new Date()
    let inicio = new Date()
    let fin = new Date()

    switch (periodo) {
      case 'dia':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
        fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
        break
      case 'semana':
        const diaSemana = hoy.getDay()
        inicio = new Date(hoy)
        inicio.setDate(hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1))
        fin = new Date(inicio)
        fin.setDate(inicio.getDate() + 6)
        break
      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        break
      case 'año':
        inicio = new Date(hoy.getFullYear(), 0, 1)
        fin = new Date(hoy.getFullYear(), 11, 31)
        break
      default:
        break
    }
    return { inicio, fin }
  }

  // Filtrar partos por fecha
  const getPartosFiltrados = () => {
    let filtrados = [...partos]
    if (fechaInicio && fechaFin) {
      filtrados = filtrados.filter(p => 
        p.fechaPartoReal && new Date(p.fechaPartoReal) >= new Date(fechaInicio) &&
        new Date(p.fechaPartoReal) <= new Date(fechaFin)
      )
    } else if (periodo !== 'personalizado') {
      const { inicio, fin } = calcularFechas()
      filtrados = filtrados.filter(p => 
        p.fechaPartoReal && new Date(p.fechaPartoReal) >= inicio &&
        new Date(p.fechaPartoReal) <= fin
      )
    }
    return filtrados
  }

  // Filtrar inseminaciones por fecha
  const getInseminacionesFiltradas = () => {
    let filtrados = [...inseminaciones]
    if (fechaInicio && fechaFin) {
      filtrados = filtrados.filter(i => 
        i.fecha && new Date(i.fecha) >= new Date(fechaInicio) &&
        new Date(i.fecha) <= new Date(fechaFin)
      )
    } else if (periodo !== 'personalizado') {
      const { inicio, fin } = calcularFechas()
      filtrados = filtrados.filter(i => 
        i.fecha && new Date(i.fecha) >= inicio &&
        new Date(i.fecha) <= fin
      )
    }
    return filtrados
  }

  // Filtrar celos por fecha
  const getCelosFiltrados = () => {
    let filtrados = [...celos]
    if (fechaInicio && fechaFin) {
      filtrados = filtrados.filter(c => 
        c.fechaInicio && new Date(c.fechaInicio) >= new Date(fechaInicio) &&
        new Date(c.fechaInicio) <= new Date(fechaFin)
      )
    } else if (periodo !== 'personalizado') {
      const { inicio, fin } = calcularFechas()
      filtrados = filtrados.filter(c => 
        c.fechaInicio && new Date(c.fechaInicio) >= inicio &&
        new Date(c.fechaInicio) <= fin
      )
    }
    return filtrados
  }

  // Filtrar palpaciones por fecha
  const getPalpacionesFiltradas = () => {
    let filtrados = [...palpaciones]
    if (fechaInicio && fechaFin) {
      filtrados = filtrados.filter(p => 
        p.fecha && new Date(p.fecha) >= new Date(fechaInicio) &&
        new Date(p.fecha) <= new Date(fechaFin)
      )
    } else if (periodo !== 'personalizado') {
      const { inicio, fin } = calcularFechas()
      filtrados = filtrados.filter(p => 
        p.fecha && new Date(p.fecha) >= inicio &&
        new Date(p.fecha) <= fin
      )
    }
    return filtrados
  }

  // Filtrar destetes por fecha
  const getDestetesFiltrados = () => {
    let filtrados = [...destetes]
    if (fechaInicio && fechaFin) {
      filtrados = filtrados.filter(d => 
        d.fechaDestete && new Date(d.fechaDestete) >= new Date(fechaInicio) &&
        new Date(d.fechaDestete) <= new Date(fechaFin)
      )
    } else if (periodo !== 'personalizado') {
      const { inicio, fin } = calcularFechas()
      filtrados = filtrados.filter(d => 
        d.fechaDestete && new Date(d.fechaDestete) >= inicio &&
        new Date(d.fechaDestete) <= fin
      )
    }
    return filtrados
  }

  // Datos para gráficos
  const partosPorFecha = () => {
    const partosFiltrados = getPartosFiltrados()
    const agrupado = {}
    partosFiltrados.forEach(p => {
      if (p.fechaPartoReal) {
        const fecha = new Date(p.fechaPartoReal).toLocaleDateString('es-PY')
        agrupado[fecha] = (agrupado[fecha] || 0) + 1
      }
    })
    return Object.entries(agrupado).map(([fecha, cantidad]) => ({ fecha, cantidad }))
  }

  // Exportar a Excel
  const exportToExcel = () => {
    let data = []
    let titulo = ''

    if (tipoReporte === 'partos') {
      titulo = 'Reporte de Partos'
      data = getPartosFiltrados().map(p => ({
        'Fecha Parto': p.fechaPartoReal ? new Date(p.fechaPartoReal).toLocaleDateString('es-PY') : '—',
        'Madre (Arete)': p.madre?.nroArete || '—',
        'Madre (Nombre)': p.madre?.nombre || '—',
        'Tipo Parto': p.tipoParto || '—',
        'N° Crías': p.numCrias || 0,
        'Estado': p.estado || '—'
      }))
    } else if (tipoReporte === 'inseminaciones') {
      titulo = 'Reporte de Inseminaciones'
      data = getInseminacionesFiltradas().map(i => ({
        'Fecha IA': i.fecha ? new Date(i.fecha).toLocaleDateString('es-PY') : '—',
        'Hembra': i.hembra?.nroArete || '—',
        'Reproductor': i.reproductor?.codigo || '—',
        'Resultado': i.resultado || 'Pendiente'
      }))
    } else if (tipoReporte === 'celos') {
      titulo = 'Reporte de Celos'
      data = getCelosFiltrados().map(c => ({
        'Fecha Inicio': c.fechaInicio ? new Date(c.fechaInicio).toLocaleDateString('es-PY') : '—',
        'Fecha Fin': c.fechaFin ? new Date(c.fechaFin).toLocaleDateString('es-PY') : '—',
        'Hembra': c.hembra?.nroArete || '—',
        'Tipo': c.tipo || '—',
        'Intensidad': c.intensidad || '—',
        'Detectado por': c.detectadoPor || '—'
      }))
    } else if (tipoReporte === 'palpaciones') {
      titulo = 'Reporte de Palpaciones'
      data = getPalpacionesFiltradas().map(p => ({
        'Fecha': p.fecha ? new Date(p.fecha).toLocaleDateString('es-PY') : '—',
        'Hembra': p.hembra?.nroArete || '—',
        'Resultado': p.resultado || '—',
        'Días Gestación': p.diasGestacionEstimados || '—',
        'Veterinario': p.veterinario?.nombre || '—'
      }))
    } else if (tipoReporte === 'destetes') {
      titulo = 'Reporte de Destetes'
      data = getDestetesFiltrados().map(d => ({
        'Fecha Destete': d.fechaDestete ? new Date(d.fechaDestete).toLocaleDateString('es-PY') : '—',
        'Madre': d.madre?.nroArete || '—',
        'Cría': d.cria?.nroArete || '—',
        'Tipo': d.tipo || '—',
        'Edad (días)': d.edadDesteteDias || '—',
        'Peso (kg)': d.pesoCria || '—'
      }))
    } else if (tipoReporte === 'vacas-prenadas') {
      titulo = 'Reporte de Vacas Preñadas'
      data = vacasPrenadas.map(v => ({
        'Vaca': v.madre?.nroArete || '—',
        'Fecha Servicio': v.fechaServicio ? new Date(v.fechaServicio).toLocaleDateString('es-PY') : '—',
        'Parto Esperado': v.fechaPartoEsperado ? new Date(v.fechaPartoEsperado).toLocaleDateString('es-PY') : '—',
        'Días Restantes': v.fechaPartoEsperado ? Math.ceil((new Date(v.fechaPartoEsperado) - new Date()) / (1000 * 60 * 60 * 24)) : '—'
      }))
    }

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, titulo)
    XLSX.writeFile(wb, `${titulo}_${new Date().toLocaleDateString('es-PY')}.xlsx`)
  }

  // Exportar a PDF - VERSIÓN CORREGIDA
  const exportToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      let titulo = ''
      let headers = []
      let data = []

      if (tipoReporte === 'partos') {
        titulo = 'Reporte de Partos'
        headers = [['Fecha', 'Madre', 'Tipo Parto', 'N° Crías', 'Estado']]
        data = getPartosFiltrados().map(p => [
          p.fechaPartoReal ? new Date(p.fechaPartoReal).toLocaleDateString('es-PY') : '—',
          p.madre?.nroArete || '—',
          p.tipoParto || '—',
          p.numCrias || 0,
          p.estado || '—'
        ])
      } else if (tipoReporte === 'inseminaciones') {
        titulo = 'Reporte de Inseminaciones'
        headers = [['Fecha', 'Hembra', 'Reproductor', 'Resultado']]
        data = getInseminacionesFiltradas().map(i => [
          i.fecha ? new Date(i.fecha).toLocaleDateString('es-PY') : '—',
          i.hembra?.nroArete || '—',
          i.reproductor?.codigo || '—',
          i.resultado || 'Pendiente'
        ])
      } else if (tipoReporte === 'celos') {
        titulo = 'Reporte de Celos'
        headers = [['Fecha Inicio', 'Fecha Fin', 'Hembra', 'Tipo', 'Intensidad', 'Detectado por']]
        data = getCelosFiltrados().map(c => [
          c.fechaInicio ? new Date(c.fechaInicio).toLocaleDateString('es-PY') : '—',
          c.fechaFin ? new Date(c.fechaFin).toLocaleDateString('es-PY') : '—',
          c.hembra?.nroArete || '—',
          c.tipo || '—',
          c.intensidad || '—',
          c.detectadoPor || '—'
        ])
      } else if (tipoReporte === 'palpaciones') {
        titulo = 'Reporte de Palpaciones'
        headers = [['Fecha', 'Hembra', 'Resultado', 'Días Gestación', 'Veterinario']]
        data = getPalpacionesFiltradas().map(p => [
          p.fecha ? new Date(p.fecha).toLocaleDateString('es-PY') : '—',
          p.hembra?.nroArete || '—',
          p.resultado || '—',
          p.diasGestacionEstimados || '—',
          p.veterinario?.nombre || '—'
        ])
      } else if (tipoReporte === 'destetes') {
        titulo = 'Reporte de Destetes'
        headers = [['Fecha Destete', 'Madre', 'Cría', 'Tipo', 'Edad (días)', 'Peso (kg)', 'Estado']]
        data = getDestetesFiltrados().map(d => [
          d.fechaDestete ? new Date(d.fechaDestete).toLocaleDateString('es-PY') : '—',
          d.madre?.nroArete || '—',
          d.cria?.nroArete || '—',
          d.tipo || '—',
          d.edadDesteteDias || '—',
          d.pesoCria || '—',
          d.estadoCria || '—'
        ])
      } else if (tipoReporte === 'vacas-prenadas') {
        titulo = 'Reporte de Vacas Preñadas'
        headers = [['Vaca', 'Fecha Servicio', 'Parto Esperado', 'Días Restantes']]
        data = vacasPrenadas.map(v => [
          v.madre?.nroArete || '—',
          v.fechaServicio ? new Date(v.fechaServicio).toLocaleDateString('es-PY') : '—',
          v.fechaPartoEsperado ? new Date(v.fechaPartoEsperado).toLocaleDateString('es-PY') : '—',
          v.fechaPartoEsperado ? Math.ceil((new Date(v.fechaPartoEsperado) - new Date()) / (1000 * 60 * 60 * 24)) : '—'
        ])
      }

      // Agregar título
      doc.setFontSize(16)
      doc.text(titulo, 14, 15)
      doc.setFontSize(10)
      doc.text(`Generado: ${new Date().toLocaleDateString('es-PY')}`, 14, 25)
      
      if (fechaInicio && fechaFin) {
        doc.text(`Período: ${new Date(fechaInicio).toLocaleDateString('es-PY')} - ${new Date(fechaFin).toLocaleDateString('es-PY')}`, 14, 32)
      } else if (periodo !== 'personalizado') {
        const { inicio, fin } = calcularFechas()
        doc.text(`Período: ${inicio.toLocaleDateString('es-PY')} - ${fin.toLocaleDateString('es-PY')}`, 14, 32)
      }

      // Agregar tabla usando autoTable
      if (headers.length > 0 && data.length > 0) {
        autoTable(doc, {
          startY: 40,
          head: headers,
          body: data,
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [240, 240, 240] },
          styles: { fontSize: 9, cellPadding: 3 }
        })
      } else {
        doc.text('No hay datos para mostrar en el período seleccionado', 14, 45)
      }

      // Guardar el PDF
      doc.save(`${titulo}_${new Date().toLocaleDateString('es-PY')}.pdf`)
    } catch (error) {
      console.error('Error detallado al generar PDF:', error)
      alert(`Error al generar PDF: ${error.message}\n\nVerifica que las dependencias estén instaladas:\nnpm install jspdf jspdf-autotable`)
    }
  }

  // Estadísticas resumen
  const getEstadisticas = () => {
    const partosFiltrados = getPartosFiltrados()
    const inseminacionesFiltradas = getInseminacionesFiltradas()
    const celosFiltrados = getCelosFiltrados()
    const destetesFiltrados = getDestetesFiltrados()
    const palpacionesFiltradas = getPalpacionesFiltradas()
    
    const partosNormales = partosFiltrados.filter(p => p.tipoParto === 'NORMAL').length
    const partosDistocicos = partosFiltrados.filter(p => p.tipoParto === 'DISTOCICO').length
    
    const inseminacionesExitosas = inseminacionesFiltradas.filter(i => i.resultado === 'PRENADA').length
    const totalCrias = partosFiltrados.reduce((sum, p) => sum + (p.numCrias || 0), 0)
    
    return {
      totalPartos: partosFiltrados.length,
      partosNormales,
      partosDistocicos,
      totalInseminaciones: inseminacionesFiltradas.length,
      inseminacionesExitosas,
      tasaExito: inseminacionesFiltradas.length > 0 
        ? ((inseminacionesExitosas / inseminacionesFiltradas.length) * 100).toFixed(1)
        : 0,
      totalCrias,
      promedioCriasPorParto: partosFiltrados.length > 0 
        ? (totalCrias / partosFiltrados.length).toFixed(1)
        : 0,
      vacasPrenadasActuales: vacasPrenadas.length,
      totalCelos: celosFiltrados.length,
      totalPalpaciones: palpacionesFiltradas.length,
      totalDestetes: destetesFiltrados.length
    }
  }

  const estadisticas = getEstadisticas()
  const partosPorFechaData = partosPorFecha()
  const maxCantidad = Math.max(...partosPorFechaData.map(p => p.cantidad), 1)

  // Mostrar datos según el tipo de reporte seleccionado
  const getDatosMostrar = () => {
    switch (tipoReporte) {
      case 'partos': return getPartosFiltrados()
      case 'inseminaciones': return getInseminacionesFiltradas()
      case 'celos': return getCelosFiltrados()
      case 'palpaciones': return getPalpacionesFiltradas()
      case 'destetes': return getDestetesFiltrados()
      case 'vacas-prenadas': return vacasPrenadas
      default: return []
    }
  }

  const datosMostrar = getDatosMostrar()

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>
        📊 Reportes de Reproducción
      </Typography>

      {/* Filtros */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Reporte</InputLabel>
              <Select value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value)} label="Tipo de Reporte">
                <MenuItem value="partos">📋 Partos</MenuItem>
                <MenuItem value="inseminaciones">💉 Inseminaciones</MenuItem>
                <MenuItem value="celos">❤️ Celos</MenuItem>
                <MenuItem value="palpaciones">🩺 Palpaciones</MenuItem>
                <MenuItem value="destetes">🍼 Destetes</MenuItem>
                <MenuItem value="vacas-prenadas">🤰 Vacas Preñadas</MenuItem>
                <MenuItem value="diagnosticos">🔬 Diagnósticos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Período</InputLabel>
              <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)} label="Período">
                <MenuItem value="dia">📅 Día</MenuItem>
                <MenuItem value="semana">📆 Semana</MenuItem>
                <MenuItem value="mes">📆 Mes</MenuItem>
                <MenuItem value="año">📅 Año</MenuItem>
                <MenuItem value="personalizado">🎯 Personalizado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {periodo === 'personalizado' && (
            <>
              <Grid item xs={12} sm={2}>
                <TextField
                  type="date"
                  label="Fecha Inicio"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  type="date"
                  label="Fecha Fin"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={periodo === 'personalizado' ? 4 : 4}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="success"
                startIcon={<TableChartIcon />}
                onClick={exportToExcel}
                fullWidth
                size="small"
              >
                Excel
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<PictureAsPdfIcon />}
                onClick={exportToPDF}
                fullWidth
                size="small"
              >
                PDF
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Tarjetas de Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Total Partos</Typography>
              <Typography variant="h5" fontWeight={700} color="#2E7D32">{estadisticas.totalPartos}</Typography>
              <Typography variant="caption" color="text.secondary">
                Normales: {estadisticas.partosNormales}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Inseminaciones</Typography>
              <Typography variant="h5" fontWeight={700} color="#1565C0">{estadisticas.totalInseminaciones}</Typography>
              <Typography variant="caption" color="text.secondary">
                Exitosas: {estadisticas.inseminacionesExitosas} ({estadisticas.tasaExito}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Vacas Preñadas</Typography>
              <Typography variant="h5" fontWeight={700} color="#6A1B9A">{estadisticas.vacasPrenadasActuales}</Typography>
              <Typography variant="caption" color="text.secondary">Actualmente</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Crías Nacidas</Typography>
              <Typography variant="h5" fontWeight={700} color="#E65100">{estadisticas.totalCrias}</Typography>
              <Typography variant="caption" color="text.secondary">
                Promedio: {estadisticas.promedioCriasPorParto}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ px: 2, pt: 1 }}>
          <Tab icon={<BarChartIcon />} iconPosition="start" label="Resumen Gráfico" />
          <Tab icon={<TableChartIcon />} iconPosition="start" label="Detalle" />
        </Tabs>

        {/* Vista Gráfica */}
        {tabValue === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Partos por Fecha</Typography>
            {partosPorFechaData.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No hay datos en el período seleccionado
              </Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #E2E8F0' }}>Fecha</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #E2E8F0' }}>Cantidad</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #E2E8F0' }}>Barra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partosPorFechaData.map((item, idx) => {
                      const width = (item.cantidad / maxCantidad) * 100
                      return (
                        <tr key={idx}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>{item.fecha}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>{item.cantidad}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                            <Box sx={{ bgcolor: '#1565C0', height: '24px', width: `${width}%`, borderRadius: 1, minWidth: '4px' }} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Box>
            )}
          </Box>
        )}

        {/* Vista Detalle */}
        {tabValue === 1 && (
          <Box sx={{ overflowX: 'auto', p: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  {tipoReporte === 'partos' && (
                    <>
                      <TableCell>Fecha Parto</TableCell>
                      <TableCell>Madre</TableCell>
                      <TableCell>Tipo Parto</TableCell>
                      <TableCell align="center">N° Crías</TableCell>
                      <TableCell>Estado</TableCell>
                    </>
                  )}
                  {tipoReporte === 'inseminaciones' && (
                    <>
                      <TableCell>Fecha IA</TableCell>
                      <TableCell>Hembra</TableCell>
                      <TableCell>Reproductor</TableCell>
                      <TableCell>Resultado</TableCell>
                    </>
                  )}
                  {tipoReporte === 'celos' && (
                    <>
                      <TableCell>Fecha Inicio</TableCell>
                      <TableCell>Fecha Fin</TableCell>
                      <TableCell>Hembra</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Intensidad</TableCell>
                      <TableCell>Detectado por</TableCell>
                    </>
                  )}
                  {tipoReporte === 'palpaciones' && (
                    <>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Hembra</TableCell>
                      <TableCell>Resultado</TableCell>
                      <TableCell>Días Gestación</TableCell>
                      <TableCell>Veterinario</TableCell>
                    </>
                  )}
                  {tipoReporte === 'destetes' && (
                    <>
                      <TableCell>Fecha Destete</TableCell>
                      <TableCell>Madre</TableCell>
                      <TableCell>Cría</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Edad (días)</TableCell>
                      <TableCell>Peso (kg)</TableCell>
                      <TableCell>Estado</TableCell>
                    </>
                  )}
                  {tipoReporte === 'vacas-prenadas' && (
                    <>
                      <TableCell>Vaca</TableCell>
                      <TableCell>Fecha Servicio</TableCell>
                      <TableCell>Parto Esperado</TableCell>
                      <TableCell align="right">Días Restantes</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {datosMostrar.map((item) => (
                  <TableRow key={item.id} hover>
                    {tipoReporte === 'partos' && (
                      <>
                        <TableCell>{fmt(item.fechaPartoReal)}</TableCell>
                        <TableCell>{item.madre?.nroArete || '—'}</TableCell>
                        <TableCell>{item.tipoParto || '—'}</TableCell>
                        <TableCell align="center">{item.numCrias || 0}</TableCell>
                        <TableCell>{item.estado || '—'}</TableCell>
                      </>
                    )}
                    {tipoReporte === 'inseminaciones' && (
                      <>
                        <TableCell>{fmt(item.fecha)}</TableCell>
                        <TableCell>{item.hembra?.nroArete || '—'}</TableCell>
                        <TableCell>{item.reproductor?.codigo || '—'}</TableCell>
                        <TableCell>{item.resultado || 'Pendiente'}</TableCell>
                      </>
                    )}
                    {tipoReporte === 'celos' && (
                      <>
                        <TableCell>{fmt(item.fechaInicio)}</TableCell>
                        <TableCell>{fmt(item.fechaFin)}</TableCell>
                        <TableCell>{item.hembra?.nroArete || '—'}</TableCell>
                        <TableCell>{item.tipo || '—'}</TableCell>
                        <TableCell>{item.intensidad || '—'}</TableCell>
                        <TableCell>{item.detectadoPor || '—'}</TableCell>
                      </>
                    )}
                    {tipoReporte === 'palpaciones' && (
                      <>
                        <TableCell>{fmt(item.fecha)}</TableCell>
                        <TableCell>{item.hembra?.nroArete || '—'}</TableCell>
                        <TableCell>{item.resultado || '—'}</TableCell>
                        <TableCell>{item.diasGestacionEstimados || '—'}</TableCell>
                        <TableCell>{item.veterinario?.nombre || '—'}</TableCell>
                      </>
                    )}
                    {tipoReporte === 'destetes' && (
                      <>
                        <TableCell>{fmt(item.fechaDestete)}</TableCell>
                        <TableCell>{item.madre?.nroArete || '—'}</TableCell>
                        <TableCell>{item.cria?.nroArete || '—'}</TableCell>
                        <TableCell>{item.tipo || '—'}</TableCell>
                        <TableCell>{item.edadDesteteDias}</TableCell>
                        <TableCell>{item.pesoCria || '—'}</TableCell>
                        <TableCell>{item.estadoCria || '—'}</TableCell>
                      </>
                    )}
                    {tipoReporte === 'vacas-prenadas' && (
                      <>
                        <TableCell>{item.madre?.nroArete || '—'}</TableCell>
                        <TableCell>{fmt(item.fechaServicio)}</TableCell>
                        <TableCell>{fmt(item.fechaPartoEsperado)}</TableCell>
                        <TableCell align="right">
                          <Chip size="small" label={Math.ceil((new Date(item.fechaPartoEsperado) - new Date()) / (1000 * 60 * 60 * 24))} variant="outlined" />
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                {datosMostrar.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                      No hay datos en el período seleccionado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="caption">
          Los reportes exportados incluyen los datos filtrados según el período seleccionado.
          Los archivos se guardarán en tu carpeta de descargas.
        </Typography>
      </Alert>
    </Box>
  )
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-PY') : '—'

export default ReportesReproduccion