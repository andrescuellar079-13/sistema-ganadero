// frontend/src/pages/FincaPage.jsx
import { useState, useMemo } from 'react'
import { useFincas } from '../hooks/useFincas'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage   from '../components/ErrorMessage'
import FincaForm      from '../components/FincaForm'
import PageHeader     from '../components/ui/PageHeader'
import PageAlert      from '../components/ui/PageAlert'
import ConfirmDialog  from '../components/ui/ConfirmDialog'
import StatusChip     from '../components/ui/StatusChip'
import EmptyState     from '../components/ui/EmptyState'
import TransferenciasTab from '../components/transferencias/TransferenciasTab'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Alert, IconButton, Tooltip, TextField, InputAdornment,
  Chip, Stack, Tabs, Tab,
} from '@mui/material'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import EditOutlinedIcon     from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon   from '@mui/icons-material/DeleteOutlined'
import SearchIcon           from '@mui/icons-material/Search'
import ClearIcon            from '@mui/icons-material/Clear'
import FilterListIcon       from '@mui/icons-material/FilterList'
import SwapHorizIcon        from '@mui/icons-material/SwapHoriz'

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null
}

export default function FincaPage() {
  const { fincas, fincaActual, loading, error, crearFinca, actualizarFinca, eliminarFinca } = useFincas()
  const [tab, setTab]               = useState(0)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [message, setMessage]       = useState(null)
  const [confirmId, setConfirmId]   = useState(null)
  const [confirmNombre, setConfirmNombre] = useState('')

  // Filtros pestaña Fincas
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [estadoFilter, setEstadoFilter] = useState('todos')

  const fincasFiltradas = useMemo(() => {
    let filtered = [...fincas]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(f =>
        f.nombre?.toLowerCase().includes(term) ||
        f.propietario?.toLowerCase().includes(term) ||
        f.departamento?.toLowerCase().includes(term) ||
        f.municipio?.toLowerCase().includes(term) ||
        f.telefono?.toLowerCase().includes(term)
      )
    }
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter(f => estadoFilter === 'activo' ? f.activo : !f.activo)
    }
    return filtered
  }, [fincas, searchTerm, estadoFilter])

  const limpiarFiltros = () => { setSearchTerm(''); setEstadoFilter('todos') }

  const notify = (r) => {
    setMessage({ type: r.success ? 'success' : 'error', text: r.message || (r.success ? 'Operación exitosa' : 'Error') })
    setTimeout(() => setMessage(null), 3500)
  }

  const handleCreate = async (data) => { const r = await crearFinca(data); notify(r); if (r.success) closeForm() }
  const handleUpdate = async (data) => { const r = await actualizarFinca(editing.id, data); notify(r); if (r.success) closeForm() }
  const handleDelete = async () => { const r = await eliminarFinca(confirmId); notify(r); setConfirmId(null) }

  const openEdit  = (f) => { setEditing(f); setShowForm(true) }
  const openAdd   = () => { setEditing(null); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  if (loading) return <LoadingSpinner />
  if (error)   return <ErrorMessage message={error.message} />

  const hayFiltrosActivos = searchTerm || estadoFilter !== 'todos'

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Gestión de Finca"
        icon={HomeWorkOutlinedIcon}
        onAdd={tab === 0 ? openAdd : undefined}
        addLabel="Nueva Finca"
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      {/* Finca actual destacada */}
      {fincaActual && (
        <Alert
          severity="info"
          action={
            <Tooltip title="Editar finca actual">
              <IconButton size="small" color="info" onClick={() => openEdit(fincaActual)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
          sx={{ borderRadius: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Finca activa: {fincaActual.nombre}
          </Typography>
          {fincaActual.propietario && (
            <Typography variant="caption" color="text.secondary">
              Propietario: {fincaActual.propietario}
            </Typography>
          )}
        </Alert>
      )}

      {/* Pestañas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab icon={<HomeWorkOutlinedIcon fontSize="small" />} iconPosition="start" label="Fincas" />
          <Tab icon={<SwapHorizIcon fontSize="small" />} iconPosition="start" label="Transferencias" />
        </Tabs>
      </Box>

      {/* ======================== TAB FINCAS ======================== */}
      <TabPanel value={tab} index={0}>
        {/* Barra de búsqueda */}
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
            <TextField
              placeholder="Buscar por nombre, propietario, ubicación, teléfono..."
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
                },
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Tooltip title="Filtros avanzados">
                <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              {hayFiltrosActivos && (
                <Chip label="Limpiar filtros" size="small" onClick={limpiarFiltros} onDelete={limpiarFiltros} />
              )}
            </Box>
          </Stack>

          {showFilters && (
            <Stack direction="row" spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0' }}>
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', fontSize: '14px' }}
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activas</option>
                <option value="inactivo">Inactivas</option>
              </select>
            </Stack>
          )}

          {hayFiltrosActivos && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
              {fincasFiltradas.length} de {fincas.length} fincas encontradas
            </Typography>
          )}
        </Paper>

        {fincasFiltradas.length === 0 ? (
          <EmptyState
            icon={HomeWorkOutlinedIcon}
            title={hayFiltrosActivos ? "No hay fincas que coincidan con la búsqueda" : "No hay fincas registradas"}
            description={hayFiltrosActivos ? "Intentá con otros términos de búsqueda." : "Registrá la finca para comenzar a gestionar el sistema."}
            onAction={openAdd}
            actionLabel={hayFiltrosActivos ? "Limpiar filtros" : "Registrar finca"}
            onSecondaryAction={hayFiltrosActivos ? limpiarFiltros : undefined}
          />
        ) : (
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Propietario</TableCell>
                    <TableCell>Ubicación</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fincasFiltradas.map((f) => (
                    <TableRow key={f.id} hover>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{f.nombre}</Typography></TableCell>
                      <TableCell>{f.propietario || '—'}</TableCell>
                      <TableCell>{[f.municipio, f.departamento].filter(Boolean).join(', ') || '—'}</TableCell>
                      <TableCell>{f.telefono || '—'}</TableCell>
                      <TableCell><StatusChip value={f.activo} /></TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton size="small" color="warning" onClick={() => openEdit(f)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error" onClick={() => { setConfirmId(f.id); setConfirmNombre(f.nombre) }}>
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
          <FincaForm
            fincaParaEditar={editing}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={closeForm}
          />
        )}

        <ConfirmDialog
          open={!!confirmId}
          onClose={() => setConfirmId(null)}
          onConfirm={handleDelete}
          title="¿Eliminar finca?"
          message={`¿Estás seguro de eliminar la finca "${confirmNombre}"? Esta acción no se puede deshacer.`}
        />
      </TabPanel>

      {/* ======================== TAB TRANSFERENCIAS ======================== */}
      <TabPanel value={tab} index={1}>
        <TransferenciasTab fincas={fincas} fincaId={fincaActual?.id || null} />
      </TabPanel>
    </Box>
  )
}
