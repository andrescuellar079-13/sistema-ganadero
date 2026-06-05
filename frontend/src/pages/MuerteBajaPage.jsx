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
  MenuItem, Select, FormControl, InputLabel, Stack,
} from '@mui/material'
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined'
import EditOutlinedIcon         from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon       from '@mui/icons-material/DeleteOutlined'
import SearchIcon               from '@mui/icons-material/Search'
import ClearIcon                from '@mui/icons-material/Clear'
import FilterListIcon           from '@mui/icons-material/FilterList'

const TIPO_CHIP = {
  MUERTE:   { label: 'Muerte',   sx: { bgcolor: '#FEE2E2', color: '#991B1B' } },
  ROBO:     { label: 'Robo',     sx: { bgcolor: '#FEF3C7', color: '#92400E' } },
  PERDIDA:  { label: 'Pérdida',  sx: { bgcolor: '#FEF3C7', color: '#92400E' } },
  DESCARTE: { label: 'Descarte', sx: { bgcolor: '#F1F5F9', color: '#475569' } },
  OTRO:     { label: 'Otro',     sx: { bgcolor: '#DBEAFE', color: '#1E40AF' } },
}

export default function MuerteBajaPage() {
  const { muertesBajas, animalesDisponibles, loading, error, crearMuerteBaja, actualizarMuerteBaja, eliminarMuerteBaja } = useMuertesBajas()
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
    
    // Filtro por búsqueda (arete, nombre, causa)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(b => 
        b.animal?.nroArete?.toLowerCase().includes(term) ||
        b.animal?.nombre?.toLowerCase().includes(term) ||
        b.causa?.toLowerCase().includes(term) ||
        b.descripcion?.toLowerCase().includes(term)
      )
    }
    
    // Filtro por tipo
    if (tipoFilter !== 'todos') {
      filtered = filtered.filter(b => b.tipo === tipoFilter)
    }
    
    // Filtro por fechas
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

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Muertes y Bajas"
        icon={RemoveCircleOutlinedIcon}
        onAdd={() => setShowForm(true)}
        addLabel="Registrar Baja"
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      {/* Barra de búsqueda y filtros */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Buscar por arete, nombre, causa..."
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

        {/* Indicador de resultados filtrados */}
        {hayFiltrosActivos && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            {muertesBajasFiltradas.length} de {muertesBajas.length} registros encontrados
          </Typography>
        )}
      </Paper>

      {muertesBajasFiltradas.length === 0 ? (
        <EmptyState
          icon={RemoveCircleOutlinedIcon}
          title={hayFiltrosActivos ? "No hay registros que coincidan con la búsqueda" : "No hay registros de bajas"}
          description={hayFiltrosActivos ? "Intentá con otros filtros." : "Registrá aquí las muertes, robos, pérdidas o descartes de animales."}
          onAction={() => setShowForm(true)}
          actionLabel={hayFiltrosActivos ? "Limpiar filtros" : "Registrar primera baja"}
          onSecondaryAction={hayFiltrosActivos ? limpiarFiltros : undefined}
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

      {showForm && (
        <MuerteBajaForm animales={animalesDisponibles} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}
      {editando && (
        <MuerteBajaForm animales={animalesDisponibles} initialData={editando} onSubmit={handleUpdate} onCancel={() => setEditando(null)} isEditing />
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