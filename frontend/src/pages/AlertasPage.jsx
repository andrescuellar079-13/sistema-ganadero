// frontend/src/pages/AlertasPage.jsx
import { useState, useMemo, useEffect } from 'react'
import { useAlertas } from '../hooks/useAlertas'
import LoadingSpinner from '../components/LoadingSpinner'
import PageAlert      from '../components/ui/PageAlert'
import ConfirmDialog  from '../components/ui/ConfirmDialog'
import AlertasList    from '../components/AlertasList'
import GastoForm      from '../components/GastoForm'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Tabs, Tab, Chip, Card, CardContent, Grid,
  IconButton, Tooltip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, MenuItem, Stack, FormControl, InputLabel, Select,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import AddCircleOutlinedIcon     from '@mui/icons-material/AddCircleOutlined'
import EditOutlinedIcon          from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon        from '@mui/icons-material/DeleteOutlined'
import SearchIcon                from '@mui/icons-material/Search'
import ClearIcon                 from '@mui/icons-material/Clear'
import FilterListIcon            from '@mui/icons-material/FilterList'
import RefreshIcon               from '@mui/icons-material/Refresh'

const TIPOS_GASTO = [
  { value: 'SANIDAD',       label: 'Sanidad' },
  { value: 'REPRODUCCION',  label: 'Reproducción' },
  { value: 'ALIMENTO',      label: 'Alimento' },
  { value: 'MANO_DE_OBRA',  label: 'Mano de obra' },
  { value: 'TRANSPORTE',    label: 'Transporte' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'COMBUSTIBLE',   label: 'Combustible' },
  { value: 'OTRO',          label: 'Otro' },
]

const CENTROS_COSTO = [
  { value: 'SANIDAD',      label: 'Sanidad' },
  { value: 'REPRODUCCION', label: 'Reproducción' },
  { value: 'ALIMENTACION', label: 'Alimentación' },
  { value: 'MANO_DE_OBRA', label: 'Mano de obra' },
  { value: 'PARCELA',      label: 'Parcela' },
  { value: 'FINCA',        label: 'Finca' },
  { value: 'COMERCIO',     label: 'Comercio' },
  { value: 'OTRO',         label: 'Otro' },
]

const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA']
const ESTADOS = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'LEIDA', label: 'Leída' },
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'RESUELTA', label: 'Resuelta' },
  { value: 'DESCARTADA', label: 'Descartada' },
]
const MODULOS = ['SANIDAD', 'REPRODUCCION', 'PRODUCCION', 'FINCAS', 'PARCELAS', 'COMERCIO', 'CATALOGOS', 'SISTEMA']
const TIPOS_ALERTA = [
  'VACUNA_PROXIMA', 'VACUNA_VENCIDA', 'PARTO_PROXIMO', 'STOCK_BAJO_MEDICAMENTO',
  'STOCK_BAJO_ALIMENTO', 'PESAJE_PENDIENTE', 'TRANSFERENCIA_PENDIENTE', 'OTRO',
]

const KPI = ({ label, value, accent }) => (
  <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderLeft: `4px solid ${accent}`, borderRadius: 2 }}>
    <CardContent sx={{ p: '16px !important' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color: accent, lineHeight: 1.2 }}>{value}</Typography>
    </CardContent>
  </Card>
)

const EMPTY_EDIT = {
  id: '', fecha: '', tipoGasto: '', descripcion: '', cantidad: 1, precioUnitario: '',
  animalId: '', centroCosto: '', metodoPago: '', proveedor: '', comprobante: '', observaciones: '',
}

const inicioDeMes = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export default function AlertasPage() {
  const {
    alertas, resumenAlertas, gastos, totalGastos,
    marcarAlertaLeida, marcarEnProceso, resolverAlerta, descartarAlerta,
    eliminarAlerta, actualizarGasto, eliminarGasto, generarAlertas, loading,
  } = useAlertas()

  // Sección principal: 'alertas' | 'gastos'
  const [seccion, setSeccion] = useState('alertas')
  const [message, setMessage] = useState(null)
  const [generando, setGenerando] = useState(false)

  // Gasto edit
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm]   = useState(EMPTY_EDIT)
  const [confirmGastoId, setConfirmGastoId]   = useState(null)
  const [confirmAlertaId, setConfirmAlertaId] = useState(null)

  // Filtros comunes
  const [searchTerm, setSearchTerm]   = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin]       = useState('')

  // Filtros alertas
  const [estadoFilter, setEstadoFilter]       = useState('todos')
  const [prioridadFilter, setPrioridadFilter] = useState('todos')
  const [moduloFilter, setModuloFilter]       = useState('todos')
  const [tipoAlertaFilter, setTipoAlertaFilter] = useState('todos')

  // Filtros gastos
  const [tipoGastoFilter, setTipoGastoFilter]   = useState('todos')
  const [centroCostoFilter, setCentroCostoFilter] = useState('todos')

  // Generar alertas automáticas al entrar a la sección Alertas (una vez)
  const [yaGenero, setYaGenero] = useState(false)
  useEffect(() => {
    if (seccion === 'alertas' && !yaGenero && !loading) {
      setYaGenero(true)
      generarAlertas()
    }
  }, [seccion, yaGenero, loading, generarAlertas])

  const handleGenerar = async () => {
    setGenerando(true)
    const r = await generarAlertas()
    setGenerando(false)
    if (r.success) {
      const n = r.data?.total ?? 0
      notify('success', n > 0 ? `Se generaron ${n} alerta(s) nueva(s)` : 'No hay alertas nuevas')
    } else {
      notify('error', r.error || 'Error al generar alertas')
    }
  }

  // Filtrar alertas
  const alertasFiltradas = useMemo(() => {
    let filtered = [...alertas]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(a =>
        a.mensaje?.toLowerCase().includes(term) ||
        a.tipo?.toLowerCase().includes(term) ||
        a.animal?.nroArete?.toLowerCase().includes(term)
      )
    }
    if (estadoFilter !== 'todos')    filtered = filtered.filter(a => a.estado === estadoFilter)
    if (prioridadFilter !== 'todos') filtered = filtered.filter(a => a.prioridad === prioridadFilter)
    if (moduloFilter !== 'todos')    filtered = filtered.filter(a => a.moduloOrigen === moduloFilter)
    if (tipoAlertaFilter !== 'todos') filtered = filtered.filter(a => a.tipo === tipoAlertaFilter)
    if (fechaInicio) filtered = filtered.filter(a => new Date(a.fechaAlerta) >= new Date(fechaInicio))
    if (fechaFin)    filtered = filtered.filter(a => new Date(a.fechaAlerta) <= new Date(fechaFin))
    return filtered
  }, [alertas, searchTerm, estadoFilter, prioridadFilter, moduloFilter, tipoAlertaFilter, fechaInicio, fechaFin])

  // Filtrar gastos
  const gastosFiltrados = useMemo(() => {
    let filtered = [...gastos]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(g =>
        g.descripcion?.toLowerCase().includes(term) ||
        g.tipoGasto?.toLowerCase().includes(term) ||
        g.proveedor?.toLowerCase().includes(term) ||
        g.animal?.nroArete?.toLowerCase().includes(term)
      )
    }
    if (tipoGastoFilter !== 'todos')   filtered = filtered.filter(g => g.tipoGasto === tipoGastoFilter)
    if (centroCostoFilter !== 'todos') filtered = filtered.filter(g => g.centroCosto === centroCostoFilter)
    if (fechaInicio) filtered = filtered.filter(g => new Date(g.fecha) >= new Date(fechaInicio))
    if (fechaFin)    filtered = filtered.filter(g => new Date(g.fecha) <= new Date(fechaFin))
    return filtered
  }, [gastos, searchTerm, tipoGastoFilter, centroCostoFilter, fechaInicio, fechaFin])

  // Total de gastos del mes actual
  const totalMes = useMemo(() => {
    const desde = inicioDeMes()
    return gastos
      .filter(g => new Date(g.fecha) >= desde)
      .reduce((acc, g) => acc + parseFloat(g.total || 0), 0)
  }, [gastos])

  const limpiarFiltros = () => {
    setSearchTerm(''); setFechaInicio(''); setFechaFin('')
    setEstadoFilter('todos'); setPrioridadFilter('todos'); setModuloFilter('todos'); setTipoAlertaFilter('todos')
    setTipoGastoFilter('todos'); setCentroCostoFilter('todos')
  }

  const notify = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3500)
  }

  const setField = (f) => (e) => setEditForm(p => ({ ...p, [f]: e.target.value }))

  // --- Acciones alertas ---
  const wrap = (fn, okMsg) => async (...args) => {
    const r = await fn(...args)
    notify(r.success ? 'success' : 'error', r.success ? okMsg : r.error)
  }
  const handleMarcarLeida = wrap(marcarAlertaLeida, 'Alerta marcada como leída')
  const handleEnProceso   = wrap(marcarEnProceso, 'Alerta marcada en proceso')
  const handleResolver    = wrap(resolverAlerta, 'Alerta resuelta')
  const handleDescartar   = wrap(descartarAlerta, 'Alerta descartada')

  const handleEliminarAlerta = async () => {
    const r = await eliminarAlerta(confirmAlertaId)
    notify(r.success ? 'success' : 'error', r.success ? 'Alerta eliminada' : r.error)
    setConfirmAlertaId(null)
  }

  // --- Acciones gastos ---
  const handleEditarGasto = (g) => {
    setEditForm({
      id: g.id, fecha: g.fecha, tipoGasto: g.tipoGasto, descripcion: g.descripcion,
      cantidad: g.cantidad, precioUnitario: g.precioUnitario, animalId: g.animal?.id || '',
      centroCosto: g.centroCosto || '', metodoPago: g.metodoPago || '',
      proveedor: g.proveedor || '', comprobante: g.comprobante || '', observaciones: g.observaciones || '',
    })
    setShowEditModal(true)
  }

  const handleActualizarGasto = async (e) => {
    e.preventDefault()
    const r = await actualizarGasto(editForm.id, {
      fecha: editForm.fecha, tipoGasto: editForm.tipoGasto, descripcion: editForm.descripcion,
      cantidad: parseFloat(editForm.cantidad), precioUnitario: parseFloat(editForm.precioUnitario),
      animalId: editForm.animalId || null,
      centroCosto: editForm.centroCosto || null, metodoPago: editForm.metodoPago || null,
      proveedor: editForm.proveedor || null, comprobante: editForm.comprobante || null,
      observaciones: editForm.observaciones || null,
    })
    notify(r.success ? 'success' : 'error', r.success ? 'Gasto actualizado' : r.error)
    if (r.success) setShowEditModal(false)
  }

  const handleEliminarGasto = async () => {
    const r = await eliminarGasto(confirmGastoId)
    notify(r.success ? 'success' : 'error', r.success ? 'Gasto eliminado' : r.error)
    setConfirmGastoId(null)
  }

  if (loading) return <LoadingSpinner />

  const hayFiltrosActivos = searchTerm || fechaInicio || fechaFin ||
    estadoFilter !== 'todos' || prioridadFilter !== 'todos' || moduloFilter !== 'todos' ||
    tipoAlertaFilter !== 'todos' || tipoGastoFilter !== 'todos' || centroCostoFilter !== 'todos'

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>Alertas y Gastos</Typography>
        <Typography variant="body2" color="text.secondary">
          Centro de notificaciones ganaderas y registro de egresos
        </Typography>
      </Box>

      {/* Toggle de sección principal */}
      <ToggleButtonGroup
        value={seccion}
        exclusive
        onChange={(_, v) => { if (v) { setSeccion(v); limpiarFiltros() } }}
        size="small"
        color="primary"
      >
        <ToggleButton value="alertas" sx={{ textTransform: 'none', px: 3 }}>
          <NotificationsOutlinedIcon sx={{ fontSize: 18, mr: 1 }} /> Alertas
        </ToggleButton>
        <ToggleButton value="gastos" sx={{ textTransform: 'none', px: 3 }}>
          <AccountBalanceOutlinedIcon sx={{ fontSize: 18, mr: 1 }} /> Gastos
        </ToggleButton>
      </ToggleButtonGroup>

      <PageAlert message={message} onClose={() => setMessage(null)} />

      {/* ============================== SECCIÓN ALERTAS ============================== */}
      {seccion === 'alertas' && (
        <>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}><KPI label="Pendientes" value={resumenAlertas.pendientes} accent="#E65100" /></Grid>
            <Grid item xs={6} md={3}><KPI label="Críticas"   value={resumenAlertas.criticas}   accent="#C62828" /></Grid>
            <Grid item xs={6} md={3}><KPI label="Vencidas"   value={resumenAlertas.vencidas}   accent="#AD1457" /></Grid>
            <Grid item xs={6} md={3}><KPI label="Resueltas"  value={resumenAlertas.resueltas}  accent="#2E7D32" /></Grid>
          </Grid>

          <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                placeholder="Buscar por mensaje, tipo, arete del animal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon fontSize="small" /></IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <Tooltip title="Filtros avanzados">
                  <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={handleGenerar}
                  disabled={generando}
                  sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                >
                  {generando ? 'Generando...' : 'Generar alertas'}
                </Button>
                {hayFiltrosActivos && (
                  <Chip label="Limpiar" size="small" onClick={limpiarFiltros} onDelete={limpiarFiltros} />
                )}
              </Box>
            </Stack>

            {showFilters && (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} label="Estado">
                    <MenuItem value="todos">Todos</MenuItem>
                    {ESTADOS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Prioridad</InputLabel>
                  <Select value={prioridadFilter} onChange={(e) => setPrioridadFilter(e.target.value)} label="Prioridad">
                    <MenuItem value="todos">Todas</MenuItem>
                    {PRIORIDADES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Módulo</InputLabel>
                  <Select value={moduloFilter} onChange={(e) => setModuloFilter(e.target.value)} label="Módulo">
                    <MenuItem value="todos">Todos</MenuItem>
                    {MODULOS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select value={tipoAlertaFilter} onChange={(e) => setTipoAlertaFilter(e.target.value)} label="Tipo">
                    <MenuItem value="todos">Todos</MenuItem>
                    {TIPOS_ALERTA.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Fecha desde" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                  size="small" InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
                <TextField label="Fecha hasta" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                  size="small" InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
              </Stack>
            )}

            {hayFiltrosActivos && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                {alertasFiltradas.length} de {alertas.length} alertas encontradas
              </Typography>
            )}
          </Paper>

          <AlertasList
            alertas={alertasFiltradas}
            titulo="Alertas"
            onMarcarLeida={handleMarcarLeida}
            onEnProceso={handleEnProceso}
            onResolver={handleResolver}
            onDescartar={handleDescartar}
            onEliminar={(id) => setConfirmAlertaId(id)}
          />
        </>
      )}

      {/* ============================== SECCIÓN GASTOS ============================== */}
      {seccion === 'gastos' && (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}><KPI label="Total gastos del mes" value={`Gs. ${totalMes.toLocaleString()}`} accent="#2E7D32" /></Grid>
            <Grid item xs={12} sm={6} md={3}><KPI label="Total gastos del año" value={`Gs. ${totalGastos.toLocaleString()}`} accent="#1565C0" /></Grid>
            <Grid item xs={12} sm={6} md={3}><KPI label="Registros de gastos" value={gastosFiltrados.length} accent="#6A1B9A" /></Grid>
          </Grid>

          <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                placeholder="Buscar por descripción, tipo, proveedor, arete..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon fontSize="small" /></IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <Tooltip title="Filtros avanzados">
                  <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddCircleOutlinedIcon />}
                  onClick={() => setSeccion('nuevo-gasto')}
                  sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                >
                  Nuevo gasto
                </Button>
                {hayFiltrosActivos && (
                  <Chip label="Limpiar" size="small" onClick={limpiarFiltros} onDelete={limpiarFiltros} />
                )}
              </Box>
            </Stack>

            {showFilters && (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Tipo de gasto</InputLabel>
                  <Select value={tipoGastoFilter} onChange={(e) => setTipoGastoFilter(e.target.value)} label="Tipo de gasto">
                    <MenuItem value="todos">Todos</MenuItem>
                    {TIPOS_GASTO.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Centro de costo</InputLabel>
                  <Select value={centroCostoFilter} onChange={(e) => setCentroCostoFilter(e.target.value)} label="Centro de costo">
                    <MenuItem value="todos">Todos</MenuItem>
                    {CENTROS_COSTO.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Fecha desde" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                  size="small" InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
                <TextField label="Fecha hasta" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                  size="small" InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
              </Stack>
            )}

            {hayFiltrosActivos && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                {gastosFiltrados.length} de {gastos.length} gastos encontrados
              </Typography>
            )}
          </Paper>

          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Centro de costo</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Cant.</TableCell>
                    <TableCell>Precio unit.</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell>Animal</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gastosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        {searchTerm ? 'No hay gastos que coincidan con la búsqueda' : 'No hay gastos registrados'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    gastosFiltrados.map(g => (
                      <TableRow key={g.id} hover>
                        <TableCell>{new Date(g.fecha).toLocaleDateString('es-PY')}</TableCell>
                        <TableCell>
                          <Chip size="small" label={g.tipoGasto} sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 500 }} />
                        </TableCell>
                        <TableCell>{g.centroCosto || '—'}</TableCell>
                        <TableCell>{g.descripcion?.substring(0, 50)}</TableCell>
                        <TableCell>{g.cantidad}</TableCell>
                        <TableCell>Gs. {parseFloat(g.precioUnitario).toLocaleString()}</TableCell>
                        <TableCell><Typography variant="body2" fontWeight={700}>Gs. {parseFloat(g.total).toLocaleString()}</Typography></TableCell>
                        <TableCell>{g.proveedor || '—'}</TableCell>
                        <TableCell>{g.animal?.nroArete || '—'}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Editar">
                            <IconButton size="small" color="warning" onClick={() => handleEditarGasto(g)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" color="error" onClick={() => setConfirmGastoId(g.id)}>
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </>
      )}

      {/* ============================== NUEVO GASTO ============================== */}
      {seccion === 'nuevo-gasto' && (
        <Box>
          <Button onClick={() => setSeccion('gastos')} sx={{ mb: 2, textTransform: 'none' }}>← Volver a Gastos</Button>
          <GastoForm onSuccess={() => setSeccion('gastos')} />
        </Box>
      )}

      {/* Edit gasto dialog */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Editar Gasto</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="gasto-form" onSubmit={handleActualizarGasto} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Fecha" type="date" required size="small" InputLabelProps={{ shrink: true }} value={editForm.fecha} onChange={setField('fecha')} />
            <TextField select label="Tipo de gasto" required size="small" value={editForm.tipoGasto} onChange={setField('tipoGasto')}>
              {TIPOS_GASTO.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField label="Descripción" required size="small" multiline rows="2" value={editForm.descripcion} onChange={setField('descripcion')} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Cantidad" type="number" size="small" fullWidth value={editForm.cantidad} onChange={setField('cantidad')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Precio unitario" type="number" step="0.01" size="small" fullWidth value={editForm.precioUnitario} onChange={setField('precioUnitario')} />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Centro de costo" size="small" fullWidth value={editForm.centroCosto} onChange={setField('centroCosto')}>
                  <MenuItem value="">— Sin asignar —</MenuItem>
                  {CENTROS_COSTO.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Método de pago" size="small" fullWidth value={editForm.metodoPago} onChange={setField('metodoPago')}>
                  <MenuItem value="">— Sin asignar —</MenuItem>
                  <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                  <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                  <MenuItem value="CREDITO">Crédito</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Proveedor" size="small" fullWidth value={editForm.proveedor} onChange={setField('proveedor')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="N° comprobante" size="small" fullWidth value={editForm.comprobante} onChange={setField('comprobante')} />
              </Grid>
            </Grid>
            <TextField label="Observaciones" size="small" multiline rows="2" value={editForm.observaciones} onChange={setField('observaciones')} />
            <TextField label="ID del animal (opcional)" size="small" value={editForm.animalId} onChange={setField('animalId')} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setShowEditModal(false)} variant="outlined" color="inherit">Cancelar</Button>
          <Button type="submit" form="gasto-form" variant="contained" color="primary">Guardar cambios</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmGastoId}
        onClose={() => setConfirmGastoId(null)}
        onConfirm={handleEliminarGasto}
        title="¿Eliminar gasto?"
        message="Esta acción no se puede deshacer."
      />
      <ConfirmDialog
        open={!!confirmAlertaId}
        onClose={() => setConfirmAlertaId(null)}
        onConfirm={handleEliminarAlerta}
        title="¿Eliminar alerta?"
        message="Esta acción no se puede deshacer."
      />
    </Box>
  )
}
