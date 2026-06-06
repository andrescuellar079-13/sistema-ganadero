// frontend/src/pages/AlertasPage.jsx
import { useState, useMemo } from 'react'
import { useAlertas } from '../hooks/useAlertas'
import LoadingSpinner from '../components/LoadingSpinner'
import PageAlert      from '../components/ui/PageAlert'
import ConfirmDialog  from '../components/ui/ConfirmDialog'
import AlertaCard     from '../components/AlertaCard'
import AlertasList    from '../components/AlertasList'
import GastoForm      from '../components/GastoForm'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Tabs, Tab, Chip, Card, CardContent, Grid,
  IconButton, Tooltip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, MenuItem, Stack, FormControl, InputLabel, Select,
} from '@mui/material'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import ListAltOutlinedIcon       from '@mui/icons-material/ListAltOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import AddCircleOutlinedIcon     from '@mui/icons-material/AddCircleOutlined'
import EditOutlinedIcon          from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon        from '@mui/icons-material/DeleteOutlined'
import SearchIcon                from '@mui/icons-material/Search'
import ClearIcon                 from '@mui/icons-material/Clear'
import FilterListIcon            from '@mui/icons-material/FilterList'

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

const KPI = ({ label, value, accent }) => (
  <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderLeft: `4px solid ${accent}`, borderRadius: 2 }}>
    <CardContent sx={{ p: '16px !important' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color: accent, lineHeight: 1.2 }}>{value}</Typography>
    </CardContent>
  </Card>
)

const TABS = [
  { label: 'Alertas pendientes', Icon: NotificationsOutlinedIcon },
  { label: 'Todas las alertas',  Icon: ListAltOutlinedIcon },
  { label: 'Gastos',             Icon: AccountBalanceOutlinedIcon },
  { label: '+ Nuevo Gasto',      Icon: AddCircleOutlinedIcon },
]

const EMPTY_EDIT = { id: '', fecha: '', tipoGasto: '', descripcion: '', cantidad: 1, precioUnitario: '', animalId: '' }

export default function AlertasPage() {
  const {
    alertas, alertasPendientes, gastos, totalGastos,
    marcarAlertaLeida, eliminarAlerta, actualizarGasto, eliminarGasto, loading,
  } = useAlertas()

  const [tabIdx, setTabIdx]           = useState(0)
  const [message, setMessage]         = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm]       = useState(EMPTY_EDIT)
  const [confirmGastoId, setConfirmGastoId] = useState(null)
  const [confirmAlertaId, setConfirmAlertaId] = useState(null)
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [tipoGastoFilter, setTipoGastoFilter] = useState('todos')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // Filtrar gastos
  const gastosFiltrados = useMemo(() => {
    let filtered = [...gastos]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(g => 
        g.descripcion?.toLowerCase().includes(term) ||
        g.tipoGasto?.toLowerCase().includes(term) ||
        g.animal?.nroArete?.toLowerCase().includes(term)
      )
    }
    
    if (tipoGastoFilter !== 'todos') {
      filtered = filtered.filter(g => g.tipoGasto === tipoGastoFilter)
    }
    
    if (fechaInicio) {
      filtered = filtered.filter(g => new Date(g.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(g => new Date(g.fecha) <= new Date(fechaFin))
    }
    
    return filtered
  }, [gastos, searchTerm, tipoGastoFilter, fechaInicio, fechaFin])

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
    
    if (fechaInicio) {
      filtered = filtered.filter(a => new Date(a.fechaAlerta) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(a => new Date(a.fechaAlerta) <= new Date(fechaFin))
    }
    
    return filtered
  }, [alertas, searchTerm, fechaInicio, fechaFin])

  // Filtrar alertas pendientes
  const alertasPendientesFiltradas = useMemo(() => {
    let filtered = [...alertasPendientes]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(a => 
        a.mensaje?.toLowerCase().includes(term) ||
        a.tipo?.toLowerCase().includes(term) ||
        a.animal?.nroArete?.toLowerCase().includes(term)
      )
    }
    
    if (fechaInicio) {
      filtered = filtered.filter(a => new Date(a.fechaAlerta) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(a => new Date(a.fechaAlerta) <= new Date(fechaFin))
    }
    
    return filtered
  }, [alertasPendientes, searchTerm, fechaInicio, fechaFin])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setTipoGastoFilter('todos')
    setFechaInicio('')
    setFechaFin('')
  }

  const notify = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3500)
  }

  const setField = (f) => (e) => setEditForm(p => ({ ...p, [f]: e.target.value }))

  const handleMarcarLeida = async (id) => {
    const r = await marcarAlertaLeida(id)
    notify(r.success ? 'success' : 'error', r.success ? 'Alerta marcada como leída' : r.error)
  }

  const handleEliminarAlerta = async () => {
    const r = await eliminarAlerta(confirmAlertaId)
    notify(r.success ? 'success' : 'error', r.success ? 'Alerta eliminada' : r.error)
    setConfirmAlertaId(null)
  }

  const handleEditarGasto = (g) => {
    setEditForm({ id: g.id, fecha: g.fecha, tipoGasto: g.tipoGasto, descripcion: g.descripcion, cantidad: g.cantidad, precioUnitario: g.precioUnitario, animalId: g.animal?.id || '' })
    setShowEditModal(true)
  }

  const handleActualizarGasto = async (e) => {
    e.preventDefault()
    const r = await actualizarGasto(editForm.id, {
      fecha: editForm.fecha, tipoGasto: editForm.tipoGasto, descripcion: editForm.descripcion,
      cantidad: parseFloat(editForm.cantidad), precioUnitario: parseFloat(editForm.precioUnitario),
      animalId: editForm.animalId || null,
    })
    notify(r.success ? 'success' : 'error', r.success ? 'Gasto actualizado' : r.error)
    if (r.success) setShowEditModal(false)
  }

  const handleEliminarGasto = async () => {
    const r = await eliminarGasto(confirmGastoId)
    notify(r.success ? 'success' : 'error', r.success ? 'Gasto eliminado' : r.error)
    setConfirmGastoId(null)
  }

  const tabsWithCount = TABS.map((t, i) => ({
    ...t,
    count: i === 0 ? alertasPendientesFiltradas.length : i === 1 ? alertasFiltradas.length : i === 2 ? gastosFiltrados.length : undefined,
  }))

  if (loading) return <LoadingSpinner />

  const hayFiltrosActivos = searchTerm || tipoGastoFilter !== 'todos' || fechaInicio || fechaFin
  const mostrarFiltros = tabIdx === 0 || tabIdx === 1 || tabIdx === 2

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>Módulo de Alertas y Gastos</Typography>
        <Typography variant="body2" color="text.secondary">Gestión de notificaciones y registro de gastos</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}><KPI label="Alertas pendientes"   value={alertasPendientesFiltradas.length}            accent="#E65100" /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPI label="Total alertas"        value={alertasFiltradas.length}                     accent="#1565C0" /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPI label="Total gastos"         value={`Gs. ${totalGastos.toLocaleString()}`} accent="#2E7D32" /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPI label="Registros de gastos"  value={gastosFiltrados.length}                      accent="#6A1B9A" /></Grid>
      </Grid>

      <PageAlert message={message} onClose={() => setMessage(null)} />

      {/* Barra de búsqueda y filtros */}
      {mostrarFiltros && (
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Buscar por descripción, tipo, arete del animal..."
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
              {tabIdx === 2 && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Tipo de Gasto</InputLabel>
                  <Select value={tipoGastoFilter} onChange={(e) => setTipoGastoFilter(e.target.value)} label="Tipo de Gasto">
                    <MenuItem value="todos">Todos</MenuItem>
                    {TIPOS_GASTO.map(tipo => (
                      <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                label="Fecha desde"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />

              <TextField
                label="Fecha hasta"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
            </Stack>
          )}

          {hayFiltrosActivos && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
              {tabIdx === 0 && `${alertasPendientesFiltradas.length} de ${alertasPendientes.length} alertas pendientes encontradas`}
              {tabIdx === 1 && `${alertasFiltradas.length} de ${alertas.length} alertas encontradas`}
              {tabIdx === 2 && `${gastosFiltrados.length} de ${gastos.length} gastos encontrados`}
            </Typography>
          )}
        </Paper>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIdx} onChange={(_, v) => setTabIdx(v)} variant="scrollable" scrollButtons="auto">
          {tabsWithCount.map(({ label, Icon, count }) => (
            <Tab key={label} icon={<Icon sx={{ fontSize: 17 }} />} iconPosition="start"
              label={count !== undefined ? `${label} (${count})` : label}
              sx={{ minHeight: 48, textTransform: 'none', fontWeight: 500, fontSize: 13 }} />
          ))}
        </Tabs>
      </Box>

      {tabIdx === 0 && (
        <AlertasList alertas={alertasPendientesFiltradas} onMarcarLeida={handleMarcarLeida} onEliminar={(id) => setConfirmAlertaId(id)} titulo="Alertas Pendientes" />
      )}

      {tabIdx === 1 && (
        <AlertasList alertas={alertasFiltradas} onMarcarLeida={handleMarcarLeida} onEliminar={(id) => setConfirmAlertaId(id)} titulo="Historial de Alertas" />
      )}

      {tabIdx === 2 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Cant.</TableCell>
                  <TableCell>Precio unit.</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Animal</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gastosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
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
                      <TableCell>{g.descripcion?.substring(0, 50)}</TableCell>
                      <TableCell>{g.cantidad}</TableCell>
                      <TableCell>Gs. {parseFloat(g.precioUnitario).toLocaleString()}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight={700}>Gs. {parseFloat(g.total).toLocaleString()}</Typography></TableCell>
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
      )}

      {tabIdx === 3 && <GastoForm onSuccess={() => setTabIdx(2)} />}

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