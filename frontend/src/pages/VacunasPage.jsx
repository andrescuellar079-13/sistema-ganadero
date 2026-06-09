// frontend/src/pages/VacunasPage.jsx
import { useState, useMemo } from 'react'
import { useVacunas } from '../hooks/useVacunas'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import VacunaForm from '../components/VacunaForm'
import PageHeader from '../components/ui/PageHeader'
import PageAlert from '../components/ui/PageAlert'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import StatusChip from '../components/ui/StatusChip'
import EmptyState from '../components/ui/EmptyState'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, IconButton, Tooltip, TextField, InputAdornment,
  MenuItem, Select, FormControl, InputLabel, Chip, Stack, Button,
} from '@mui/material'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import FilterListIcon from '@mui/icons-material/FilterList'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'

import ReportModalReusable from '../components/ReportModalReusable'
import { buildVacunasReportConfig } from '../components/reportes/vacunasReportConfig'

export default function VacunasPage() {
  const { vacunas, loading, error, crearVacuna, actualizarVacuna, eliminarVacuna } = useVacunas()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [showReportes, setShowReportes] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viaFilter, setViaFilter] = useState('todos')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [intervaloMin, setIntervaloMin] = useState('')
  const [intervaloMax, setIntervaloMax] = useState('')

  const vacunasFiltradas = useMemo(() => {
    let filtered = [...vacunas]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(v => 
        v.nombre?.toLowerCase().includes(term) ||
        v.descripcion?.toLowerCase().includes(term)
      )
    }
    if (viaFilter !== 'todos') {
      filtered = filtered.filter(v => v.viaAplicacion === viaFilter)
    }
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter(v => estadoFilter === 'activo' ? v.activo === true : v.activo === false)
    }
    if (intervaloMin) {
      filtered = filtered.filter(v => (v.intervaloDias || 0) >= parseInt(intervaloMin))
    }
    if (intervaloMax) {
      filtered = filtered.filter(v => (v.intervaloDias || 0) <= parseInt(intervaloMax))
    }
    return filtered
  }, [vacunas, searchTerm, viaFilter, estadoFilter, intervaloMin, intervaloMax])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setViaFilter('todos')
    setEstadoFilter('todos')
    setIntervaloMin('')
    setIntervaloMax('')
  }

  const notify = (result) => {
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    setTimeout(() => setMessage(null), 3500)
  }

  const handleCreate = async (data) => {
    const r = await crearVacuna(data)
    notify(r)
    if (r.success) closeForm()
  }

  const handleUpdate = async (data) => {
    const r = await actualizarVacuna(editing.id, data)
    notify(r)
    if (r.success) closeForm()
  }

  const handleDelete = async () => {
    const r = await eliminarVacuna(confirmId)
    notify(r)
    setConfirmId(null)
  }

  const openAdd = () => { setEditing(null); setShowForm(true) }
  const openEdit = (v) => { setEditing(v); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  const reporteConfig = useMemo(() => buildVacunasReportConfig({ vacunas }), [vacunas])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const hayFiltrosActivos = searchTerm || viaFilter !== 'todos' || estadoFilter !== 'todos' || intervaloMin || intervaloMax
  const viasAplicacion = [...new Set(vacunas.map(v => v.viaAplicacion).filter(Boolean))]

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Vacunas"
        icon={MedicalServicesOutlinedIcon}
        onAdd={openAdd}
        addLabel="Nueva Vacuna"
        extra={
          <Button
            variant="outlined"
            size="small"
            startIcon={<AssessmentOutlinedIcon />}
            onClick={() => setShowReportes(true)}
            sx={{ textTransform: 'none' }}
          >
            Reportes
          </Button>
        }
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <TextField
            placeholder="Buscar por nombre o descripción..."
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
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
            {viasAplicacion.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Vía de Aplicación</InputLabel>
                <Select value={viaFilter} onChange={(e) => setViaFilter(e.target.value)} label="Vía de Aplicación">
                  <MenuItem value="todos">Todas</MenuItem>
                  {viasAplicacion.map(via => <MenuItem key={via} value={via}>{via}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Estado</InputLabel>
              <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} label="Estado">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="activo">Activas</MenuItem>
                <MenuItem value="inactivo">Inactivas</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Intervalo mínimo (días)"
              type="number"
              value={intervaloMin}
              onChange={(e) => setIntervaloMin(e.target.value)}
              size="small"
              placeholder="Mínimo días"
              sx={{ width: 150 }}
              inputProps={{ min: 0 }}
            />

            <TextField
              label="Intervalo máximo (días)"
              type="number"
              value={intervaloMax}
              onChange={(e) => setIntervaloMax(e.target.value)}
              size="small"
              placeholder="Máximo días"
              sx={{ width: 150 }}
              inputProps={{ min: 0 }}
            />
          </Stack>
        )}

        {hayFiltrosActivos && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            {vacunasFiltradas.length} de {vacunas.length} vacunas encontradas
          </Typography>
        )}
      </Paper>

      {vacunasFiltradas.length === 0 ? (
        <EmptyState
          icon={MedicalServicesOutlinedIcon}
          title={hayFiltrosActivos ? "No hay vacunas que coincidan con la búsqueda" : "No hay vacunas registradas"}
          description={hayFiltrosActivos ? "Intentá con otros filtros." : "Registrá la primera vacuna para empezar el programa sanitario."}
          onAction={openAdd}
          actionLabel={hayFiltrosActivos ? "Limpiar filtros" : "Crear primera vacuna"}
          onSecondaryAction={hayFiltrosActivos ? limpiarFiltros : undefined}
        />
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Dosis</TableCell>
                  <TableCell>Vía</TableCell>
                  <TableCell>Intervalo</TableCell>
                  <TableCell>Edad Mín.</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vacunasFiltradas.map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{v.nombre}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{v.descripcion || '—'}</Typography></TableCell>
                    <TableCell>{v.dosisRecomendada}</TableCell>
                    <TableCell>{v.viaAplicacion}</TableCell>
                    <TableCell>{v.intervaloDias} días</TableCell>
                    <TableCell>{v.edadMinimaMeses} meses</TableCell>
                    <TableCell><StatusChip value={v.activo} /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="warning" onClick={() => openEdit(v)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => setConfirmId(v.id)}>
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
        <VacunaForm
          vacuna={editing}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={closeForm}
        />
      )}

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="¿Eliminar vacuna?"
        message="Esta acción no se puede deshacer."
      />

      <ReportModalReusable
        open={showReportes}
        onClose={() => setShowReportes(false)}
        {...reporteConfig}
      />
    </Box>
  )
}