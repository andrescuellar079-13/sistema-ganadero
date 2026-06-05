// frontend/src/pages/ComprasPage.jsx
import { useState } from 'react'
import { useCompras } from '../hooks/useCompras'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import CompraAnimalForm from '../components/CompraAnimalForm'
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
  DialogActions,
  Button,
  Divider,
} from '@mui/material'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import FilterListIcon from '@mui/icons-material/FilterList'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CloseIcon from '@mui/icons-material/Close'

export default function ComprasPage() {
  const {
    notasCompra,
    proveedores,
    medicamentos,
    alimentos,
    razas,
    categorias,
    loading,
    error,
    crearNotaCompra,
    actualizarNotaCompra,
    eliminarNotaCompra,
    crearDetalleCompra,
    crearDetalleCompraAlimento,
    crearDetalleCompraAnimal,
    eliminarDetalleCompraAnimal,
  } = useCompras()

  const [showForm, setShowForm] = useState(false)
  const [showAnimalForm, setShowAnimalForm] = useState(false)
  const [currentNotaId, setCurrentNotaId] = useState(null)
  const [editingCompra, setEditingCompra] = useState(null)
  const [message, setMessage] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedCompra, setSelectedCompra] = useState(null)

  const [formData, setFormData] = useState({
    proveedorId: '',
    tipoCompra: 'MEDICAMENTO',
    fechaCompra: new Date().toISOString().split('T')[0],
    observaciones: '',
  })

  const [detalleMedicamento, setDetalleMedicamento] = useState({
    medicamentoId: '',
    cantidad: '',
    precioUnitario: '',
  })

  const [detalleAlimento, setDetalleAlimento] = useState({
    alimentoId: '',
    cantidad: '',
    precioUnitario: '',
  })

  const [detalles, setDetalles] = useState([])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleDetalleMedicamentoChange = (e) => {
    setDetalleMedicamento({ ...detalleMedicamento, [e.target.name]: e.target.value })
  }

  const handleDetalleAlimentoChange = (e) => {
    setDetalleAlimento({ ...detalleAlimento, [e.target.name]: e.target.value })
  }

  const agregarDetalleMedicamento = () => {
    if (detalleMedicamento.medicamentoId && detalleMedicamento.cantidad && detalleMedicamento.precioUnitario) {
      const medicamento = medicamentos.find(m => m.id === detalleMedicamento.medicamentoId)
      const subtotal = parseFloat(detalleMedicamento.cantidad) * parseFloat(detalleMedicamento.precioUnitario)
      setDetalles([...detalles, {
        tipo: 'MEDICAMENTO',
        id: medicamento?.id,
        nombre: medicamento?.nombre,
        cantidad: parseFloat(detalleMedicamento.cantidad),
        precioUnitario: parseFloat(detalleMedicamento.precioUnitario),
        subtotal: subtotal
      }])
      setDetalleMedicamento({ medicamentoId: '', cantidad: '', precioUnitario: '' })
    }
  }

  const agregarDetalleAlimento = () => {
    if (detalleAlimento.alimentoId && detalleAlimento.cantidad && detalleAlimento.precioUnitario) {
      const alimento = alimentos.find(a => a.id === detalleAlimento.alimentoId)
      const subtotal = parseFloat(detalleAlimento.cantidad) * parseFloat(detalleAlimento.precioUnitario)
      setDetalles([...detalles, {
        tipo: 'ALIMENTO',
        id: alimento?.id,
        nombre: alimento?.nombre,
        cantidad: parseFloat(detalleAlimento.cantidad),
        precioUnitario: parseFloat(detalleAlimento.precioUnitario),
        subtotal: subtotal
      }])
      setDetalleAlimento({ alimentoId: '', cantidad: '', precioUnitario: '' })
    }
  }

  const eliminarDetalle = (index) => {
    const nuevosDetalles = [...detalles]
    nuevosDetalles.splice(index, 1)
    setDetalles(nuevosDetalles)
  }

  const handleCrearNotaCompra = async (e) => {
    e.preventDefault()
    const result = await crearNotaCompra({
      proveedorId: formData.proveedorId || null,
      tipoCompra: formData.tipoCompra,
      fechaCompra: formData.fechaCompra,
      observaciones: formData.observaciones,
    })
    if (result.success) {
      const notaId = result.id
      setCurrentNotaId(notaId)
      for (const detalle of detalles) {
        if (detalle.tipo === 'MEDICAMENTO') {
          await crearDetalleCompra({
            notaCompraId: notaId,
            medicamentoId: detalle.id,
            precioUnitario: detalle.precioUnitario,
            cantidad: detalle.cantidad,
          })
        } else if (detalle.tipo === 'ALIMENTO') {
          await crearDetalleCompraAlimento({
            notaCompraId: notaId,
            alimentoId: detalle.id,
            precioUnitario: detalle.precioUnitario,
            cantidad: detalle.cantidad,
          })
        } else if (detalle.tipo === 'ANIMAL') {
          await crearDetalleCompraAnimal({
            notaCompraId: notaId,
            nroArete: detalle.nroArete,
            nombre: detalle.nombre,
            sexo: detalle.sexo,
            razaId: detalle.razaId || null,
            categoriaId: detalle.categoriaId || null,
            peso: detalle.peso ? parseFloat(detalle.peso) : null,
            precioUnitario: parseFloat(detalle.precioUnitario),
            fechaNacimiento: detalle.fechaNacimiento || null,
            observaciones: detalle.observaciones || null,
          })
        }
      }
      setMessage({ type: 'success', text: 'Compra registrada exitosamente' })
      setShowForm(false)
      setCurrentNotaId(null)
      setDetalles([])
      setFormData({
        proveedorId: '',
        tipoCompra: 'MEDICAMENTO',
        fechaCompra: new Date().toISOString().split('T')[0],
        observaciones: '',
      })
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al registrar compra' })
    }
    setTimeout(() => setMessage(null), 3500)
  }

  const handleAgregarAnimal = async (animalData) => {
    if (!currentNotaId) {
      setMessage({ type: 'error', text: 'Primero debe registrar la compra' })
      setTimeout(() => setMessage(null), 3500)
      return
    }
    const result = await crearDetalleCompraAnimal({
      notaCompraId: currentNotaId,
      ...animalData,
    })
    if (result.success) {
      setMessage({ type: 'success', text: 'Animal agregado a la compra' })
      setShowAnimalForm(false)
    } else {
      setMessage({ type: 'error', text: result.error })
    }
    setTimeout(() => setMessage(null), 3500)
  }

  const handleEliminarNotaCompra = async (id, proveedorNombre) => {
    if (window.confirm(`¿Eliminar la compra a "${proveedorNombre}"?`)) {
      const result = await eliminarNotaCompra(id)
      setMessage({ type: result.success ? 'success' : 'error', text: result.message })
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const handleViewDetails = (compra) => {
    setSelectedCompra(compra)
    setDetailDialogOpen(true)
  }

  const filtrarCompras = (compra) => {
    if (!searchTerm && tipoFilter === 'todos' && !fechaInicio && !fechaFin) return true
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const proveedor = `${compra.proveedor?.nombre || ''} ${compra.proveedor?.apellidos || ''}`.toLowerCase()
      if (!proveedor.includes(term) && !(compra.observaciones || '').toLowerCase().includes(term)) return false
    }
    
    if (tipoFilter !== 'todos' && compra.tipoCompra !== tipoFilter) return false
    
    if (fechaInicio && new Date(compra.fechaCompra) < new Date(fechaInicio)) return false
    if (fechaFin && new Date(compra.fechaCompra) > new Date(fechaFin)) return false
    
    return true
  }

  const comprasFiltradas = notasCompra.filter(filtrarCompras)

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Compras"
        icon={ShoppingCartOutlinedIcon}
        onAdd={() => {
          setEditingCompra(null)
          setFormData({
            proveedorId: '',
            tipoCompra: 'MEDICAMENTO',
            fechaCompra: new Date().toISOString().split('T')[0],
            observaciones: '',
          })
          setDetalles([])
          setShowForm(true)
        }}
        addLabel="Nueva Compra"
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      {/* Filtros */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <TextField
            placeholder="Buscar por proveedor u observación..."
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Filtros">
              <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>

        {showFilters && (
          <Stack direction="row" spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Tipo</InputLabel>
              <Select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} label="Tipo">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="MEDICAMENTO">💊 Medicamentos</MenuItem>
                <MenuItem value="ALIMENTO">🍖 Alimentos</MenuItem>
                <MenuItem value="ANIMAL">🐄 Animales</MenuItem>
                <MenuItem value="OTRO">📋 Otro</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Fecha inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Fecha fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            {(searchTerm || tipoFilter !== 'todos' || fechaInicio || fechaFin) && (
              <Chip
                label="Limpiar filtros"
                size="small"
                onClick={() => {
                  setSearchTerm('')
                  setTipoFilter('todos')
                  setFechaInicio('')
                  setFechaFin('')
                }}
                onDelete={() => {
                  setSearchTerm('')
                  setTipoFilter('todos')
                  setFechaInicio('')
                  setFechaFin('')
                }}
              />
            )}
          </Stack>
        )}
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          {comprasFiltradas.length} de {notasCompra.length} compras encontradas
        </Typography>
      </Paper>

      {comprasFiltradas.length === 0 ? (
        <EmptyState
          icon={ShoppingCartOutlinedIcon}
          title={searchTerm || tipoFilter !== 'todos' || fechaInicio || fechaFin ? "No se encontraron compras" : "No hay compras registradas"}
          description={searchTerm || tipoFilter !== 'todos' || fechaInicio || fechaFin ? "Intentá con otros filtros." : "Registrá la primera compra de insumos."}
          onAction={() => {
            setEditingCompra(null)
            setFormData({
              proveedorId: '',
              tipoCompra: 'MEDICAMENTO',
              fechaCompra: new Date().toISOString().split('T')[0],
              observaciones: '',
            })
            setDetalles([])
            setShowForm(true)
          }}
          actionLabel={searchTerm || tipoFilter !== 'todos' || fechaInicio || fechaFin ? "Limpiar filtros" : "Registrar primera compra"}
          onSecondaryAction={searchTerm || tipoFilter !== 'todos' || fechaInicio || fechaFin ? () => {
            setSearchTerm('')
            setTipoFilter('todos')
            setFechaInicio('')
            setFechaFin('')
          } : undefined}
        />
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Monto Total</TableCell>
                <TableCell>Observaciones</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comprasFiltradas.map((compra) => (
                <TableRow key={compra.id} hover>
                  <TableCell>{new Date(compra.fechaCompra).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {compra.proveedor?.nombre} {compra.proveedor?.apellidos || ''}
                    </Typography>
                    {compra.proveedor?.nit && (
                      <Typography variant="caption" color="text.secondary">
                        NIT: {compra.proveedor.nit}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        compra.tipoCompra === 'MEDICAMENTO' ? '💊 Medicamento' :
                        compra.tipoCompra === 'ALIMENTO' ? '🍖 Alimento' :
                        compra.tipoCompra === 'ANIMAL' ? '🐄 Animal' : '📋 Otro'
                      }
                      sx={{
                        bgcolor: compra.tipoCompra === 'ANIMAL' ? '#e8f5e9' : 
                                 compra.tipoCompra === 'MEDICAMENTO' ? '#e3f2fd' : '#f3e5f5',
                        color: compra.tipoCompra === 'ANIMAL' ? '#2e7d32' : 
                               compra.tipoCompra === 'MEDICAMENTO' ? '#1565c0' : '#7b1fa2',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, color: '#16a34a' }}>
                      Bs. {parseFloat(compra.montoTotal).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>{compra.observaciones || '—'}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" onClick={() => handleViewDetails(compra)} sx={{ color: '#3b82f6' }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" sx={{ color: '#eab308' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleEliminarNotaCompra(compra.id, compra.proveedor?.nombre)}
                          sx={{ color: '#ef4444' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* MODAL DE NUEVA COMPRA - DIALOG TITLE CORREGIDO */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCartOutlinedIcon color="primary" />
            <Typography variant="h6" component="span">🛒 Nueva Compra</Typography>
          </Box>
          <IconButton onClick={() => setShowForm(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <form id="compra-form" onSubmit={handleCrearNotaCompra}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                  <select
                    name="proveedorId"
                    value={formData.proveedorId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Seleccionar proveedor</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellidos || ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Compra</label>
                  <select
                    name="tipoCompra"
                    value={formData.tipoCompra}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="MEDICAMENTO">💊 Medicamentos</option>
                    <option value="ALIMENTO">🍖 Alimentos</option>
                    <option value="ANIMAL">🐄 Animales</option>
                    <option value="OTRO">📋 Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Compra</label>
                  <input
                    type="date"
                    name="fechaCompra"
                    value={formData.fechaCompra}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <input
                    type="text"
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              {/* Detalles para Medicamentos */}
              {formData.tipoCompra === 'MEDICAMENTO' && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Detalles de Medicamentos</h4>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <select
                      value={detalleMedicamento.medicamentoId}
                      onChange={handleDetalleMedicamentoChange}
                      name="medicamentoId"
                      className="px-2 py-1 border rounded-md text-sm"
                    >
                      <option value="">Seleccionar</option>
                      {medicamentos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                    <input
                      type="number"
                      name="cantidad"
                      placeholder="Cantidad"
                      value={detalleMedicamento.cantidad}
                      onChange={handleDetalleMedicamentoChange}
                      className="px-2 py-1 border rounded-md text-sm"
                    />
                    <input
                      type="number"
                      name="precioUnitario"
                      placeholder="Precio Unitario"
                      value={detalleMedicamento.precioUnitario}
                      onChange={handleDetalleMedicamentoChange}
                      className="px-2 py-1 border rounded-md text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={agregarDetalleMedicamento}
                    className="text-blue-600 text-sm mb-3"
                  >
                    + Agregar Medicamento
                  </button>
                </div>
              )}

              {/* Detalles para Alimentos */}
              {formData.tipoCompra === 'ALIMENTO' && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Detalles de Alimentos</h4>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <select
                      value={detalleAlimento.alimentoId}
                      onChange={handleDetalleAlimentoChange}
                      name="alimentoId"
                      className="px-2 py-1 border rounded-md text-sm"
                    >
                      <option value="">Seleccionar</option>
                      {alimentos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                    <input
                      type="number"
                      name="cantidad"
                      placeholder="Cantidad"
                      value={detalleAlimento.cantidad}
                      onChange={handleDetalleAlimentoChange}
                      className="px-2 py-1 border rounded-md text-sm"
                    />
                    <input
                      type="number"
                      name="precioUnitario"
                      placeholder="Precio Unitario"
                      value={detalleAlimento.precioUnitario}
                      onChange={handleDetalleAlimentoChange}
                      className="px-2 py-1 border rounded-md text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={agregarDetalleAlimento}
                    className="text-blue-600 text-sm mb-3"
                  >
                    + Agregar Alimento
                  </button>
                </div>
              )}

              {/* Detalles para Animales */}
              {formData.tipoCompra === 'ANIMAL' && (
                <div className="border-t pt-4">
                  <CompraAnimalForm
                    onSubmit={async (animalData) => {
                      setDetalles([...detalles, {
                        tipo: 'ANIMAL',
                        ...animalData,
                        nombre: animalData.nombre || animalData.nroArete,
                        subtotal: animalData.precioUnitario
                      }])
                    }}
                    onCancel={() => {}}
                    razas={razas}
                    categorias={categorias}
                  />
                </div>
              )}

              {/* Tabla de detalles agregados */}
              {detalles.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-2">Items agregados</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium">Tipo</th>
                          <th className="px-3 py-2 text-left text-xs font-medium">Producto</th>
                          <th className="px-3 py-2 text-left text-xs font-medium">Cantidad / Arete</th>
                          <th className="px-3 py-2 text-right text-xs font-medium">Precio Unit.</th>
                          <th className="px-3 py-2 text-right text-xs font-medium">Subtotal</th>
                          <th className="px-3 py-2 text-center text-xs font-medium">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {detalles.map((det, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm">
                              {det.tipo === 'MEDICAMENTO' ? '💊' : det.tipo === 'ALIMENTO' ? '🌾' : '🐄'}
                            </td>
                            <td className="px-3 py-2 text-sm font-medium">{det.nombre}</td>
                            <td className="px-3 py-2 text-sm">
                              {det.tipo === 'ANIMAL' ? det.nroArete : det.cantidad}
                            </td>
                            <td className="px-3 py-2 text-sm text-right">
                              Bs. {det.precioUnitario.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-sm text-right font-medium text-green-600">
                              Bs. {det.subtotal.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => eliminarDetalle(idx)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                          <td colSpan="4" className="px-3 py-2 text-right">Total:</td>
                          <td className="px-3 py-2 text-right text-green-600">
                            Bs. {detalles.reduce((sum, d) => sum + d.subtotal, 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </form>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForm(false)}>Cancelar</Button>
          <Button type="submit" form="compra-form" variant="contained" color="primary">
            Registrar Compra
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE DETALLES DE LA COMPRA - DIALOG TITLE CORREGIDO */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCartOutlinedIcon color="primary" />
            <Typography variant="h6" component="span">Detalle de Compra #{selectedCompra?.id}</Typography>
          </Box>
          <IconButton onClick={() => setDetailDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCompra && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="caption" color="text.secondary">Proveedor</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedCompra.proveedor?.nombre} {selectedCompra.proveedor?.apellidos || ''}
                  </Typography>
                  {selectedCompra.proveedor?.nit && (
                    <Typography variant="body2" color="text.secondary">NIT: {selectedCompra.proveedor.nit}</Typography>
                  )}
                </div>
                <div>
                  <Typography variant="caption" color="text.secondary">Fecha de Compra</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {new Date(selectedCompra.fechaCompra).toLocaleDateString('es-PY')}
                  </Typography>
                  <Chip
                    size="small"
                    label={selectedCompra.tipoCompra === 'MEDICAMENTO' ? '💊 Medicamento' :
                           selectedCompra.tipoCompra === 'ALIMENTO' ? '🍖 Alimento' :
                           selectedCompra.tipoCompra === 'ANIMAL' ? '🐄 Animal' : '📋 Otro'}
                    sx={{ mt: 0.5 }}
                  />
                </div>
              </div>

              <Divider />

              {/* Medicamentos */}
              {selectedCompra.detallesMedicamentos?.length > 0 && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold">💊 Medicamentos</Typography>
                  <table className="min-w-full border rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs">Medicamento</th>
                        <th className="px-3 py-2 text-right text-xs">Cantidad</th>
                        <th className="px-3 py-2 text-right text-xs">Precio Unit.</th>
                        <th className="px-3 py-2 text-right text-xs">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCompra.detallesMedicamentos.map((det, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-sm">{det.medicamento?.nombre}</td>
                          <td className="px-3 py-2 text-sm text-right">{det.cantidad}</td>
                          <td className="px-3 py-2 text-sm text-right">Bs. {parseFloat(det.precioUnitario).toLocaleString()}</td>
                          <td className="px-3 py-2 text-sm text-right">Bs. {parseFloat(det.subTotal).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Alimentos */}
              {selectedCompra.detallesAlimentos?.length > 0 && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold">🌾 Alimentos</Typography>
                  <table className="min-w-full border rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs">Alimento</th>
                        <th className="px-3 py-2 text-right text-xs">Cantidad</th>
                        <th className="px-3 py-2 text-right text-xs">Precio Unit.</th>
                        <th className="px-3 py-2 text-right text-xs">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCompra.detallesAlimentos.map((det, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-sm">{det.alimento?.nombre}</td>
                          <td className="px-3 py-2 text-sm text-right">{det.cantidad}</td>
                          <td className="px-3 py-2 text-sm text-right">Bs. {parseFloat(det.precioUnitario).toLocaleString()}</td>
                          <td className="px-3 py-2 text-sm text-right">Bs. {parseFloat(det.subTotal).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Animales */}
              {selectedCompra.detallesAnimales?.length > 0 && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold">🐄 Animales</Typography>
                  <table className="min-w-full border rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs">Arete</th>
                        <th className="px-3 py-2 text-left text-xs">Nombre</th>
                        <th className="px-3 py-2 text-left text-xs">Sexo</th>
                        <th className="px-3 py-2 text-right text-xs">Peso</th>
                        <th className="px-3 py-2 text-right text-xs">Precio Unit.</th>
                        <th className="px-3 py-2 text-right text-xs">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCompra.detallesAnimales.map((det, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-sm">{det.nroArete}</td>
                          <td className="px-3 py-2 text-sm">{det.nombre || '—'}</td>
                          <td className="px-3 py-2 text-sm">{det.sexo === 'MACHO' ? '🐂 Macho' : '🐄 Hembra'}</td>
                          <td className="px-3 py-2 text-sm text-right">{det.peso || '—'} kg</td>
                          <td className="px-3 py-2 text-sm text-right">Bs. {parseFloat(det.precioUnitario).toLocaleString()}</td>
                          <td className="px-3 py-2 text-sm text-right">Bs. {parseFloat(det.subTotal).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <Divider />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">Monto Total</Typography>
                  <Typography variant="h5" fontWeight="bold" color="green">
                    Bs. {parseFloat(selectedCompra.montoTotal).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {selectedCompra.observaciones && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                  <Typography variant="body2" sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1 }}>
                    {selectedCompra.observaciones}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Cerrar</Button>
          <Button variant="contained" color="warning">Editar Compra</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}