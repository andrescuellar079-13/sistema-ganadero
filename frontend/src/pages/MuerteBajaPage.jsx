// frontend/src/pages/MuerteBajaPage.jsx
import { useState, useMemo } from 'react'
import { useMuertesBajas } from '../hooks/useMuertesBajas'
import LoadingSpinner  from '../components/LoadingSpinner'
import ErrorMessage    from '../components/ErrorMessage'
import MuerteBajaForm  from '../components/MuerteBajaForm'
import PageHeader      from '../components/ui/PageHeader'
import PageAlert       from '../components/ui/PageAlert'
import ConfirmDialog   from '../components/ui/ConfirmDialog'
import EmptyState      from '../components/ui/EmptyState'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Chip, IconButton, Tooltip, TextField, InputAdornment,
  MenuItem, Select, FormControl, InputLabel, Stack, Tabs, Tab,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material'
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined'
import EditOutlinedIcon         from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon       from '@mui/icons-material/DeleteOutlined'
import SearchIcon               from '@mui/icons-material/Search'
import ClearIcon                from '@mui/icons-material/Clear'
import FilterListIcon           from '@mui/icons-material/FilterList'
import AssessmentIcon           from '@mui/icons-material/Assessment'
import PictureAsPdfIcon         from '@mui/icons-material/PictureAsPdf'
import TableChartIcon           from '@mui/icons-material/TableChart'
import CloseIcon                from '@mui/icons-material/Close'

const TIPO_CHIP = {
  MUERTE:   { label: 'Muerte',   sx: { bgcolor: '#FEE2E2', color: '#991B1B' } },
  ROBO:     { label: 'Robo',     sx: { bgcolor: '#FEF3C7', color: '#92400E' } },
  PERDIDA:  { label: 'Pérdida',  sx: { bgcolor: '#FEF3C7', color: '#92400E' } },
  DESCARTE: { label: 'Descarte', sx: { bgcolor: '#F1F5F9', color: '#475569' } },
  OTRO:     { label: 'Otro',     sx: { bgcolor: '#DBEAFE', color: '#1E40AF' } },
}

const TIPO_REPORTE_LABELS = {
  MUERTE: 'Muerte',
  ROBO: 'Robo',
  PERDIDA: 'Pérdida',
  DESCARTE: 'Descarte',
  OTRO: 'Otro',
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-PY') : '—'
const fmtNumber = (n) => n ? n.toLocaleString() : '0'

// Componente de Reportes
const ReportesBajas = ({ muertesBajas }) => {
  const [tipoReporte, setTipoReporte] = useState('TODOS')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [formato, setFormato] = useState('EXCEL')
  const [reporteOpen, setReporteOpen] = useState(true)

  // Filtrar datos
  const datosFiltrados = useMemo(() => {
    let datos = [...muertesBajas]
    
    // Filtro por tipo
    if (tipoReporte !== 'TODOS') {
      datos = datos.filter(b => b.tipo === tipoReporte)
    }
    
    // Filtro por fechas
    if (fechaInicio) {
      datos = datos.filter(b => new Date(b.fechaBaja) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      datos = datos.filter(b => new Date(b.fechaBaja) <= new Date(fechaFin))
    }
    
    return datos
  }, [muertesBajas, tipoReporte, fechaInicio, fechaFin])

  // Datos para el gráfico (agrupados por fecha)
  const datosGrafico = useMemo(() => {
    const agrupado = {}
    datosFiltrados.forEach(b => {
      const fecha = new Date(b.fechaBaja).toLocaleDateString('es-PY')
      agrupado[fecha] = (agrupado[fecha] || 0) + 1
    })
    return Object.entries(agrupado)
      .sort((a, b) => new Date(a[0].split('/').reverse().join('-')) - new Date(b[0].split('/').reverse().join('-')))
      .slice(-10)
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
  }, [datosFiltrados])

  const totalRegistros = datosFiltrados.length
  const totalMuertes = datosFiltrados.filter(b => b.tipo === 'MUERTE').length
  const totalRobos = datosFiltrados.filter(b => b.tipo === 'ROBO').length
  const totalPerdidas = datosFiltrados.filter(b => b.tipo === 'PERDIDA').length
  const totalDescartes = datosFiltrados.filter(b => b.tipo === 'DESCARTE').length
  const pesoPromedio = datosFiltrados.reduce((sum, b) => sum + (b.pesoEstimadoKg || 0), 0) / (totalRegistros || 1)

  const generarReporte = () => {
    if (formato === 'EXCEL') {
      let csvContent = "Fecha Baja,Animal,Arete,Tipo,Causa,Peso Estimado (kg),Descripción\n"
      datosFiltrados.forEach(b => {
        csvContent += `"${fmt(b.fechaBaja)}","${b.animal?.nombre || ''}","${b.animal?.nroArete || ''}","${TIPO_REPORTE_LABELS[b.tipo] || b.tipo}","${b.causa || ''}","${b.pesoEstimadoKg || 0}","${b.descripcion || ''}"\n`
      })
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.setAttribute('download', `reporte_bajas_${tipoReporte}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } else {
      const printContent = `
        <html>
          <head><title>Reporte de Bajas - ${TIPO_REPORTE_LABELS[tipoReporte] || 'Todos'}</title></head>
          <body>
            <h1>Reporte de Bajas - ${TIPO_REPORTE_LABELS[tipoReporte] || 'Todos'}</h1>
            <p>Período: ${fechaInicio || 'Desde siempre'} al ${fechaFin || 'actualidad'}</p>
            <p>Total registros: ${totalRegistros}</p>
            <p>Muertes: ${totalMuertes} | Robos: ${totalRobos} | Pérdidas: ${totalPerdidas} | Descartes: ${totalDescartes}</p>
            <p>Peso promedio: ${pesoPromedio.toFixed(2)} kg</p>
            <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
              <thead>
                <tr><th>Fecha</th><th>Animal</th><th>Arete</th><th>Tipo</th><th>Causa</th><th>Peso (kg)</th><th>Descripción</th></tr>
              </thead>
              <tbody>
                ${datosFiltrados.map(b => `
                  <tr>
                    <td>${fmt(b.fechaBaja)}</td>
                    <td>${b.animal?.nombre || ''}</td>
                    <td>${b.animal?.nroArete || ''}</td>
                    <td>${TIPO_REPORTE_LABELS[b.tipo] || b.tipo}</td>
                    <td>${b.causa || ''}</td>
                    <td>${b.pesoEstimadoKg || 0}</td>
                    <td>${b.descripcion || ''}</td>
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

  return (
    <Dialog open={reporteOpen} onClose={() => setReporteOpen(false)} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ bgcolor: '#C62828', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>📊 Reportes de Bajas</Typography>
        <IconButton onClick={() => setReporteOpen(false)} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Filtros del reporte */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Filtros del Reporte</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Reporte</InputLabel>
                <Select value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value)} label="Tipo de Reporte">
                  <MenuItem value="TODOS">Todos</MenuItem>
                  <MenuItem value="MUERTE">Muerte</MenuItem>
                  <MenuItem value="ROBO">Robo</MenuItem>
                  <MenuItem value="PERDIDA">Pérdida</MenuItem>
                  <MenuItem value="DESCARTE">Descarte</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField 
                label="Fecha Inicio" 
                type="date" 
                value={fechaInicio} 
                onChange={(e) => setFechaInicio(e.target.value)} 
                fullWidth 
                size="small" 
                slotProps={{ inputLabel: { shrink: true } }} 
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField 
                label="Fecha Fin" 
                type="date" 
                value={fechaFin} 
                onChange={(e) => setFechaFin(e.target.value)} 
                fullWidth 
                size="small" 
                slotProps={{ inputLabel: { shrink: true } }} 
              />
            </Grid>
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
        </Paper>

        {/* KPIs del reporte */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F5F5' }}>
              <Typography variant="h4" fontWeight={700} color="#C62828">{totalRegistros}</Typography>
              <Typography variant="caption">Total Bajas</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F5F5' }}>
              <Typography variant="h4" fontWeight={700} color="#991B1B">{totalMuertes}</Typography>
              <Typography variant="caption">Muertes</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F5F5' }}>
              <Typography variant="h4" fontWeight={700} color="#92400E">{totalRobos}</Typography>
              <Typography variant="caption">Robos</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F5F5' }}>
              <Typography variant="h4" fontWeight={700} color="#92400E">{totalPerdidas}</Typography>
              <Typography variant="caption">Pérdidas</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F5F5' }}>
              <Typography variant="h4" fontWeight={700} color="#475569">{totalDescartes}</Typography>
              <Typography variant="caption">Descartes</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Gráfico de barras */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Bajas por Fecha</Typography>
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
                          <Box sx={{ width: `${Math.min(item.cantidad * 40, 250)}px`, height: '20px', bgcolor: '#C62828', borderRadius: 1 }} />
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
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Detalle de Bajas</Typography>
          <Box sx={{ overflowX: 'auto', maxHeight: '400px' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Animal</TableCell>
                  <TableCell>Arete</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Causa</TableCell>
                  <TableCell>Peso (kg)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datosFiltrados.slice(0, 100).map(b => (
                  <TableRow key={b.id} hover>
                    <TableCell>{fmt(b.fechaBaja)}</TableCell>
                    <TableCell>{b.animal?.nombre || '—'}</TableCell>
                    <TableCell>{b.animal?.nroArete || '—'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={TIPO_REPORTE_LABELS[b.tipo] || b.tipo} 
                        sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 500 }} />
                    </TableCell>
                    <TableCell>{b.causa || '—'}</TableCell>
                    <TableCell>{b.pesoEstimadoKg || 0} kg</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setReporteOpen(false)} variant="outlined">Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function MuerteBajaPage() {
  const { muertesBajas, animalesDisponibles, loading, error, crearMuerteBaja, actualizarMuerteBaja, eliminarMuerteBaja } = useMuertesBajas()
  const [tabIdx, setTabIdx] = useState(0)
  const [showForm, setShowForm]   = useState(false)
  const [editando, setEditando]   = useState(null)
  const [message, setMessage]     = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // ==========================================
  // FILTROS
  // ==========================================
  const muertesBajasFiltradas = useMemo(() => {
    let filtered = [...muertesBajas]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(b => 
        b.animal?.nroArete?.toLowerCase().includes(term) ||
        b.animal?.nombre?.toLowerCase().includes(term) ||
        b.causa?.toLowerCase().includes(term) ||
        b.descripcion?.toLowerCase().includes(term)
      )
    }
    
    if (tipoFilter !== 'todos') {
      filtered = filtered.filter(b => b.tipo === tipoFilter)
    }
    
    if (fechaInicio) {
      filtered = filtered.filter(b => new Date(b.fechaBaja) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(b => new Date(b.fechaBaja) <= new Date(fechaFin))
    }
    
    return filtered
  }, [muertesBajas, searchTerm, tipoFilter, fechaInicio, fechaFin])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setTipoFilter('todos')
    setFechaInicio('')
    setFechaFin('')
  }

  const notify = (r) => {
    setMessage({ type: r.success ? 'success' : 'error', text: r.message || (r.success ? 'Operación exitosa' : 'Error') })
    setTimeout(() => setMessage(null), 3500)
  }

  const handleCreate = async (data) => {
    const r = await crearMuerteBaja(data)
    notify(r)
    if (r.success) setShowForm(false)
  }

  const handleUpdate = async (data) => {
    const r = await actualizarMuerteBaja(editando.id, data)
    notify(r)
    if (r.success) setEditando(null)
  }

  const handleDelete = async () => {
    const r = await eliminarMuerteBaja(confirmId)
    notify(r)
    setConfirmId(null)
  }

  if (loading) return <LoadingSpinner />
  if (error)   return <ErrorMessage message={error.message} />

  const hayFiltrosActivos = searchTerm || tipoFilter !== 'todos' || fechaInicio || fechaFin

  const TABS = [
    { label: 'Bajas', Icon: RemoveCircleOutlinedIcon, count: muertesBajasFiltradas.length },
    { label: '+ Registrar Baja', Icon: RemoveCircleOutlinedIcon },
    { label: 'Reportes', Icon: AssessmentIcon },
  ]

  const tabsWithCount = TABS.map((t, i) => ({
    ...t,
    count: i === 0 ? muertesBajasFiltradas.length : undefined,
  }))

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Bajas y Muertes"
        icon={RemoveCircleOutlinedIcon}
        onAdd={() => setShowForm(true)}
        addLabel="Registrar Baja"
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      {/* Filtros (solo en la pestaña de Bajas) */}
      {tabIdx === 0 && (
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Buscar por arete, nombre, causa..."
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
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Tipo de Baja</InputLabel>
                <Select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} label="Tipo de Baja">
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="MUERTE">Muerte</MenuItem>
                  <MenuItem value="ROBO">Robo</MenuItem>
                  <MenuItem value="PERDIDA">Pérdida</MenuItem>
                  <MenuItem value="DESCARTE">Descarte</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </Select>
              </FormControl>

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

          {hayFiltrosActivos && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
              {muertesBajasFiltradas.length} de {muertesBajas.length} registros encontrados
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

      {/* Tabla de Bajas */}
      {tabIdx === 0 && (
        <>
          {muertesBajasFiltradas.length === 0 ? (
            <EmptyState
              icon={RemoveCircleOutlinedIcon}
              title={hayFiltrosActivos ? "No hay registros que coincidan con la búsqueda" : "No hay registros de bajas"}
              description={hayFiltrosActivos ? "Intentá con otros filtros." : "Registrá aquí las muertes, robos, pérdidas o descartes de animales."}
              onAction={() => hayFiltrosActivos ? limpiarFiltros() : setShowForm(true)}
              actionLabel={hayFiltrosActivos ? "Limpiar filtros" : "Registrar primera baja"}
            />
          ) : (
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Animal</TableCell>
                      <TableCell>Arete</TableCell>
                      <TableCell>Raza</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Causa</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Peso Est.</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {muertesBajasFiltradas.map((b) => {
                      const tipo = TIPO_CHIP[b.tipo] ?? { label: b.tipo, sx: {} }
                      return (
                        <TableRow key={b.id} hover>
                          <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{b.animal?.nombre || 'N/A'}</Typography></TableCell>
                          <TableCell><Typography variant="body2" color="text.disabled" sx={{ fontFamily: 'monospace' }}>#{b.animal?.nroArete || '—'}</Typography></TableCell>
                          <TableCell>{b.animal?.raza?.nombre || '—'}</TableCell>
                          <TableCell><Chip label={tipo.label} size="small" sx={{ ...tipo.sx, fontWeight: 500 }} /></TableCell>
                          <TableCell>{b.causa}</TableCell>
                          <TableCell>{new Date(b.fechaBaja).toLocaleDateString('es-PY')}</TableCell>
                          <TableCell>{b.pesoEstimadoKg ? `${b.pesoEstimadoKg} kg` : '—'}</TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary">{b.descripcion || '—'}</Typography></TableCell>
                          <TableCell align="right">
                            <Tooltip title="Editar">
                              <IconButton size="small" color="warning" onClick={() => setEditando(b)}>
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton size="small" color="error" onClick={() => setConfirmId(b.id)}>
                                <DeleteOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
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

      {/* Formulario de Registro */}
      {tabIdx === 1 && (
        <MuerteBajaForm 
          animales={animalesDisponibles} 
          onSubmit={handleCreate} 
          onCancel={() => setTabIdx(0)} 
        />
      )}

      {/* Reportes */}
      {tabIdx === 2 && (
        <ReportesBajas muertesBajas={muertesBajas} />
      )}

      {/* Editar (sigue siendo modal) */}
      {editando && (
        <MuerteBajaForm 
          animales={animalesDisponibles} 
          initialData={editando} 
          onSubmit={handleUpdate} 
          onCancel={() => setEditando(null)} 
          isEditing 
        />
      )}

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="¿Eliminar registro de baja?"
        message="Esta acción no se puede deshacer."
      />
    </Box>
  )
}