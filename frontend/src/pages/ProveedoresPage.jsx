import { useState, useMemo } from 'react'
import { useProveedores } from '../hooks/useProveedores'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import ProveedorForm from '../components/ProveedorForm'
import PageHeader from '../components/ui/PageHeader'
import PageAlert from '../components/ui/PageAlert'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, IconButton, Tooltip, TextField, InputAdornment,
  Stack, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import FilterListIcon from '@mui/icons-material/FilterList'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'
import CloseIcon from '@mui/icons-material/Close'

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-PY') : '—'

// Modal de Reportes
const ReportesProveedores = ({ proveedores, onClose }) => {
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [formato, setFormato] = useState('EXCEL')

  // Filtrar datos por rango de fechas
  const datosFiltrados = useMemo(() => {
    let datos = [...proveedores]
    
    if (fechaInicio && fechaFin) {
      datos = proveedores.filter(p => 
        p.createdAt && new Date(p.createdAt) >= new Date(fechaInicio) && new Date(p.createdAt) <= new Date(fechaFin)
      )
    }
    
    return datos
  }, [proveedores, fechaInicio, fechaFin])

  // Datos para el gráfico
  const datosGrafico = useMemo(() => {
    const agrupado = {}
    datosFiltrados.forEach(p => {
      if (p.createdAt) {
        const fecha = new Date(p.createdAt).toLocaleDateString('es-PY')
        agrupado[fecha] = (agrupado[fecha] || 0) + 1
      }
    })
    return Object.entries(agrupado)
      .sort((a, b) => new Date(a[0].split('/').reverse().join('-')) - new Date(b[0].split('/').reverse().join('-')))
      .slice(-10)
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
  }, [datosFiltrados])

  const totalProveedores = datosFiltrados.length

  const generarReporte = () => {
    if (formato === 'EXCEL') {
      let csvContent = "Nombre,Apellidos,Teléfono,Dirección,NIT/CI\n"
      datosFiltrados.forEach(p => {
        csvContent += `"${p.nombre || ''}","${p.apellidos || ''}","${p.telefono || ''}","${p.direccion || ''}","${p.nit || p.ci || ''}"\n`
      })
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.setAttribute('download', `reporte_proveedores.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } else {
      const printContent = `
        <html>
          <head><title>Reporte de Proveedores</title></head>
          <body>
            <h1>Reporte de Proveedores</h1>
            <p>Período: ${fechaInicio || 'Desde siempre'} al ${fechaFin || 'actualidad'}</p>
            <p>Total proveedores: ${totalProveedores}</p>
            <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
              <thead>
                <tr><th>Nombre</th><th>Apellidos</th><th>Teléfono</th><th>Dirección</th><th>NIT/CI</th></tr>
              </thead>
              <tbody>
                ${datosFiltrados.map(p => `
                  <tr>
                    <td>${p.nombre || ''}</td>
                    <td>${p.apellidos || ''}</td>
                    <td>${p.telefono || ''}</td>
                    <td>${p.direccion || ''}</td>
                    <td>${p.nit || p.ci || ''}</td>
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
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1565C0', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>📊 Reportes de Proveedores</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Filtros del Reporte</Typography>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
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
              <Button 
                variant="outlined" 
                onClick={() => { setFechaInicio(''); setFechaFin(''); }} 
                size="small"
                sx={{ height: '40px' }}
              >
                Limpiar fechas
              </Button>
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
            <Grid item xs={12} md={2}>
              <Button 
                variant="contained" 
                onClick={generarReporte} 
                fullWidth 
                sx={{ bgcolor: '#2E7D32', height: '40px' }}
              >
                Generar
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F5F5' }}>
              <Typography variant="h3" fontWeight={700} color="#1565C0">{totalProveedores}</Typography>
              <Typography variant="caption">Total Proveedores</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F5F5' }}>
              <Typography variant="h3" fontWeight={700} color="#2E7D32">{datosGrafico.length}</Typography>
              <Typography variant="caption">Días con registros</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F5F5' }}>
              <Typography variant="h3" fontWeight={700} color="#E65100">{datosGrafico.reduce((sum, item) => sum + item.cantidad, 0)}</Typography>
              <Typography variant="caption">Registros en período</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Proveedores por Fecha de Registro</Typography>
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
                          <Box sx={{ width: `${Math.min(item.cantidad * 40, 250)}px`, height: '20px', bgcolor: '#1565C0', borderRadius: 1 }} />
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

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Detalle de Proveedores</Typography>
          <Box sx={{ overflowX: 'auto', maxHeight: '400px' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Apellidos</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>NIT/CI</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datosFiltrados.slice(0, 100).map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={600}>{p.nombre}</Typography></TableCell>
                    <TableCell>{p.apellidos || '—'}</TableCell>
                    <TableCell>{p.telefono || '—'}</TableCell>
                    <TableCell>{p.direccion || '—'}</TableCell>
                    <TableCell>{p.nit || p.ci || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ProveedoresPage() {
  const { proveedores, loading, error, crearProveedor, actualizarProveedor, eliminarProveedor } = useProveedores()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [showReportes, setShowReportes] = useState(false)

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // Filtrar proveedores
  const proveedoresFiltrados = useMemo(() => {
    let filtered = [...proveedores]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.nombre?.toLowerCase().includes(term) ||
        p.apellidos?.toLowerCase().includes(term) ||
        p.telefono?.toLowerCase().includes(term) ||
        p.nit?.toLowerCase().includes(term) ||
        p.ci?.toLowerCase().includes(term) ||
        p.direccion?.toLowerCase().includes(term)
      )
    }
    
    if (fechaInicio) {
      filtered = filtered.filter(p => p.createdAt && new Date(p.createdAt) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(p => p.createdAt && new Date(p.createdAt) <= new Date(fechaFin))
    }
    
    return filtered
  }, [proveedores, searchTerm, fechaInicio, fechaFin])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setFechaInicio('')
    setFechaFin('')
  }

  const notify = (result) => {
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    setTimeout(() => setMessage(null), 3500)
  }

  const handleCreate = async (data) => {
    const r = await crearProveedor(data)
    notify(r)
    if (r.success) closeForm()
  }

  const handleUpdate = async (data) => {
    const r = await actualizarProveedor(editing.id, data)
    notify(r)
    if (r.success) closeForm()
  }

  const handleDelete = async () => {
    const r = await eliminarProveedor(confirmId)
    notify(r)
    setConfirmId(null)
  }

  const openAdd = () => { setEditing(null); setShowForm(true) }
  const openEdit = (p) => { setEditing(p); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const hayFiltrosActivos = searchTerm || fechaInicio || fechaFin

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Proveedores"
        icon={LocalShippingOutlinedIcon}
        onAdd={openAdd}
        addLabel="Nuevo Proveedor"
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      {/* Barra de búsqueda */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <TextField
            placeholder="Buscar por nombre, apellidos, teléfono, NIT/CI..."
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
            <Tooltip title="Reportes">
              <IconButton onClick={() => setShowReportes(true)} color="primary">
                <AssessmentIcon />
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

        {/* Filtros avanzados (rango de fechas) */}
        {showFilters && (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
            <TextField
              label="Fecha Registro desde"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 180 }}
            />
            <TextField
              label="Fecha Registro hasta"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 180 }}
            />
          </Stack>
        )}

        {hayFiltrosActivos && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            {proveedoresFiltrados.length} de {proveedores.length} proveedores encontrados
          </Typography>
        )}
      </Paper>

      {/* Tabla de Proveedores - SIN columna Fecha Registro */}
      {proveedoresFiltrados.length === 0 ? (
        <EmptyState
          icon={LocalShippingOutlinedIcon}
          title={hayFiltrosActivos ? "No hay proveedores que coincidan con la búsqueda" : "No hay proveedores registrados"}
          description={hayFiltrosActivos ? "Intentá con otros filtros." : "Registrá el primer proveedor para comenzar a gestionar compras."}
          onAction={() => hayFiltrosActivos ? limpiarFiltros() : openAdd()}
          actionLabel={hayFiltrosActivos ? "Limpiar filtros" : "Crear primer proveedor"}
        />
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Apellidos</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>NIT / CI</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proveedoresFiltrados.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.nombre}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{p.apellidos || '—'}</Typography></TableCell>
                    <TableCell>{p.telefono || '—'}</TableCell>
                    <TableCell>{p.direccion || '—'}</TableCell>
                    <TableCell>{p.nit || p.ci || '—'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="warning" onClick={() => openEdit(p)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => setConfirmId(p.id)}>
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {showForm && (
        <ProveedorForm
          proveedor={editing}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={closeForm}
        />
      )}

      {/* Modal de Reportes */}
      {showReportes && (
        <ReportesProveedores 
          proveedores={proveedores} 
          onClose={() => setShowReportes(false)} 
        />
      )}

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="¿Eliminar proveedor?"
        message="Esta acción no se puede deshacer."
      />
    </Box>
  )
}