// frontend/src/pages/VentasPage.jsx
import { useState } from 'react'
import { useVentas } from '../hooks/useVentas'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import VentaForm from '../components/VentaForm'
import ReportesVentas from '../components/ReportesVentas'
import PageHeader from '../components/ui/PageHeader'
import PageAlert from '../components/ui/PageAlert'
import EmptyState from '../components/ui/EmptyState'

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
import SortIcon from '@mui/icons-material/Sort'
import AssessmentIcon from '@mui/icons-material/Assessment'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'

export default function VentasPage() {
  const { 
    notasVenta, 
    clientes, 
    animalesDisponibles, 
    loading, 
    error, 
    crearNotaVenta, 
    crearDetalleVenta,
    actualizarVentaCompleta,
    eliminarNotaVenta,
    refetch 
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
  const [filterEstado, setFilterEstado] = useState('todos')
  const [showFilters, setShowFilters] = useState(false)

  const sortOptions = [
    { value: 'mas_reciente', label: 'Más reciente' },
    { value: 'mas_antiguo', label: 'Más antiguo' },
    { value: 'cliente_asc', label: 'Cliente A-Z' },
    { value: 'cliente_desc', label: 'Cliente Z-A' },
    { value: 'monto_mayor', label: 'Mayor monto' },
    { value: 'monto_menor', label: 'Menor monto' },
  ]

  const estadoOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'completada', label: 'Completadas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'anulada', label: 'Anuladas' },
  ]

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleCreate = async (formData, detalles) => {
    const result = await crearNotaVenta(formData)
    if (result.success && detalles.length > 0) {
      const notaVentaId = result.id
      for (const d of detalles) {
        await crearDetalleVenta({ 
          notaVentaId, 
          animalId: d.animalId, 
          pesoVentaKg: d.pesoVentaKg, 
          precioKg: d.precioKg 
        })
      }
      setMessage({ type: 'success', text: 'Venta registrada exitosamente' })
      setShowForm(false)
      refetch()
    } else {
      setMessage({ type: 'error', text: result.message || 'Error al registrar venta' })
    }
    setTimeout(() => setMessage(null), 3500)
  }

  const handleEdit = (venta) => {
    setEditingVenta(venta)
    setShowForm(true)
  }

  const handleUpdate = async (formData, detalles) => {
    const result = await actualizarVentaCompleta(editingVenta.id, formData, detalles)
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setShowForm(false)
      setEditingVenta(null)
      refetch()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
    setTimeout(() => setMessage(null), 3500)
  }

  const handleDeleteClick = (venta) => {
    setVentaToDelete(venta)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (ventaToDelete) {
      const result = await eliminarNotaVenta(ventaToDelete.id)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        refetch()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
      setDeleteDialogOpen(false)
      setVentaToDelete(null)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const handleViewDetails = (venta) => {
    setSelectedVenta(venta)
    setDetailDialogOpen(true)
  }

  const filtrarVentas = (venta) => {
    if (!searchTerm) return true
    
    const term = searchTerm.toLowerCase()
    const clienteNombre = `${venta.cliente?.nombre || ''} ${venta.cliente?.apellidos || ''}`.toLowerCase()
    const clienteCi = (venta.cliente?.ci || '').toLowerCase()
    const id = venta.id?.toLowerCase() || ''
    
    return clienteNombre.includes(term) || clienteCi.includes(term) || id.includes(term)
  }

  const ordenarVentas = (a, b) => {
    switch (sortBy) {
      case 'mas_reciente':
        return new Date(b.fechaVenta) - new Date(a.fechaVenta)
      case 'mas_antiguo':
        return new Date(a.fechaVenta) - new Date(b.fechaVenta)
      case 'cliente_asc':
        return (a.cliente?.nombre || '').localeCompare(b.cliente?.nombre || '')
      case 'cliente_desc':
        return (b.cliente?.nombre || '').localeCompare(a.cliente?.nombre || '')
      case 'monto_mayor':
        return (b.montoTotal || 0) - (a.montoTotal || 0)
      case 'monto_menor':
        return (a.montoTotal || 0) - (b.montoTotal || 0)
      default:
        return 0
    }
  }

  let ventasFiltradas = [...notasVenta]
  if (searchTerm) ventasFiltradas = ventasFiltradas.filter(filtrarVentas)
  if (filterEstado !== 'todos') ventasFiltradas = ventasFiltradas.filter(v => v.estado === filterEstado)
  ventasFiltradas.sort(ordenarVentas)

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Ventas"
        icon={PointOfSaleOutlinedIcon}
        onAdd={() => {
          setEditingVenta(null)
          setShowForm(true)
        }}
        addLabel="Nueva Venta"
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Listado de Ventas" />
        <Tab label="Reportes y Estadísticas" icon={<AssessmentIcon />} iconPosition="start" />
      </Tabs>

      {tabValue === 0 && (
        <>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                placeholder="Buscar por cliente, CI o número de venta..."
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
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Ordenar por</InputLabel>
                  <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Ordenar por">
                    {sortOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Stack>
            
            {showFilters && (
              <Stack direction="row" spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} label="Estado">
                    {estadoOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Box sx={{ flex: 1 }} />
                
                {(searchTerm || filterEstado !== 'todos') && (
                  <Chip label="Limpiar filtros" size="small" onClick={() => { setSearchTerm(''); setFilterEstado('todos'); }} onDelete={() => { setSearchTerm(''); setFilterEstado('todos'); }} />
                )}
              </Stack>
            )}
            
            {(searchTerm || filterEstado !== 'todos') && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                {ventasFiltradas.length} de {notasVenta.length} ventas encontradas
              </Typography>
            )}
          </Paper>

          {ventasFiltradas.length === 0 ? (
            <EmptyState
              icon={PointOfSaleOutlinedIcon}
              title={searchTerm ? "No se encontraron ventas" : "No hay ventas registradas"}
              description={searchTerm ? "Intentá con otros términos de búsqueda." : "Registrá la primera venta de animales."}
              onAction={() => setShowForm(true)}
              actionLabel={searchTerm ? "Limpiar búsqueda" : "Registrar primera venta"}
              onSecondaryAction={searchTerm ? () => setSearchTerm('') : undefined}
            />
          ) : (
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>CI / RUC</TableCell>
                      <TableCell>Monto Total</TableCell>
                      <TableCell>Observaciones</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ventasFiltradas.map((v) => (
                      <TableRow key={v.id} hover>
                        <TableCell>{new Date(v.fechaVenta).toLocaleDateString('es-PY')}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {[v.cliente?.nombre, v.cliente?.apellidos].filter(Boolean).join(' ') || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>{v.cliente?.ci || '—'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#16a34a' }}>
                            Bs. {v.montoTotal?.toLocaleString() || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>{v.observaciones || '—'}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
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
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          )}
        </>
      )}

      {tabValue === 1 && <ReportesVentas />}

      {showForm && (
        <VentaForm
          clientes={clientes}
          animales={animalesDisponibles}
          initialData={editingVenta ? {
            clienteId: editingVenta.cliente?.id,
            fechaVenta: editingVenta.fechaVenta?.split('T')[0],
            observaciones: editingVenta.observaciones || '',
            detalles: editingVenta.detalles?.map(d => ({
              animalId: d.animal?.id,
              pesoVentaKg: d.pesoVentaKg,
              precioKg: d.precioKg,
              nombre: d.animal?.nroArete,
              subtotal: d.subTotal
            })) || []
          } : null}
          onSubmit={editingVenta ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false)
            setEditingVenta(null)
          }}
          isEditing={!!editingVenta}
          onDelete={editingVenta ? () => handleDeleteClick(editingVenta) : null}
        />
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar la venta #{ventaToDelete?.id} de{' '}
            <strong>{ventaToDelete?.cliente?.nombre} {ventaToDelete?.cliente?.apellidos}</strong>?
            <br />
            <br />
            Esta acción eliminará también todos los detalles de la venta y no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de Venta #{selectedVenta?.id}</DialogTitle>
        <DialogContent dividers>
          {selectedVenta && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Cliente</Typography>
                  <Typography variant="body1">
                    {selectedVenta.cliente?.nombre} {selectedVenta.cliente?.apellidos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    CI: {selectedVenta.cliente?.ci || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Fecha</Typography>
                  <Typography variant="body1">
                    {new Date(selectedVenta.fechaVenta).toLocaleDateString('es-PY')}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Animales vendidos</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Animal</TableCell>
                      <TableCell align="right">Peso (kg)</TableCell>
                      <TableCell align="right">Precio/kg</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedVenta.detalles?.map((detalle, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{detalle.animal?.nroArete} - {detalle.animal?.nombre || 'Sin nombre'}</TableCell>
                        <TableCell align="right">{detalle.pesoVentaKg}</TableCell>
                        <TableCell align="right">Bs. {detalle.precioKg}</TableCell>
                        <TableCell align="right">Bs. {detalle.subTotal?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="subtitle2">Total:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight="bold" color="green">
                          Bs. {selectedVenta.montoTotal?.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>

              {selectedVenta.observaciones && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                  <Typography variant="body2" sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1 }}>
                    {selectedVenta.observaciones}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDetailDialogOpen(false)
            handleEdit(selectedVenta)
          }} color="warning">
            Editar Venta
          </Button>
          <Button onClick={() => setDetailDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}