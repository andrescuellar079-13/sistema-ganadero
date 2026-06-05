import { useState, useMemo } from 'react'
import { useVacunaciones } from '../hooks/useVacunaciones'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import PageHeader from '../components/ui/PageHeader'
import PageAlert from '../components/ui/PageAlert'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Alert, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, InputAdornment,
} from '@mui/material'
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import SearchIcon from '@mui/icons-material/Search'

const EMPTY_FORM = {
  animalId: '', vacunaId: '',
  fechaAplicacion: new Date().toISOString().split('T')[0],
  campana: '', lote: '', dosisAplicada: '', viaAplicacion: '', observaciones: '', fechaProxima: '',
}

export default function VacunacionesPage() {
  const {
    vacunaciones, vacunasProximas, animalesActivos, vacunas,
    loading, error, crearVacunacion, actualizarVacunacion, eliminarVacunacion,
  } = useVacunaciones()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [message, setMessage] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [confirmLabel, setConfirmLabel] = useState('')

  const [busqueda, setBusqueda]     = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const notify = (r) => {
    setMessage({ type: r.success ? 'success' : 'error', text: r.message || (r.success ? 'Operación exitosa' : 'Error') })
    setTimeout(() => setMessage(null), 3500)
  }

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))

  const openCreate = () => { setEditingId(null); setFormData(EMPTY_FORM); setShowForm(true) }
  const openEdit = (v) => {
    setEditingId(v.id)
    setFormData({
      animalId: v.animal.id, vacunaId: v.vacuna.id,
      fechaAplicacion: v.fechaAplicacion, campana: v.campana || '',
      lote: v.lote || '', dosisAplicada: v.dosisAplicada || '',
      viaAplicacion: v.viaAplicacion || '', observaciones: v.observaciones || '',
      fechaProxima: v.fechaProxima || '',
    })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditingId(null); setFormData(EMPTY_FORM) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const r = editingId
      ? await actualizarVacunacion(editingId, {
        fechaAplicacion: formData.fechaAplicacion, campana: formData.campana,
        lote: formData.lote, dosisAplicada: formData.dosisAplicada,
        viaAplicacion: formData.viaAplicacion, observaciones: formData.observaciones,
        fechaProxima: formData.fechaProxima,
      })
      : await crearVacunacion({
        animalId: formData.animalId, vacunaId: formData.vacunaId,
        fechaAplicacion: formData.fechaAplicacion, campana: formData.campana,
        lote: formData.lote, dosisAplicada: formData.dosisAplicada,
        viaAplicacion: formData.viaAplicacion, observaciones: formData.observaciones,
        fechaProxima: formData.fechaProxima,
      })
    notify(r)
    if (r.success) closeForm()
  }

  const handleDelete = async () => {
    const r = await eliminarVacunacion(confirmId)
    notify(r)
    setConfirmId(null)
  }

  const vacunacionesFiltradas = useMemo(() => {
    return (vacunaciones || []).filter((vac) => {
      const texto = [vac.animal?.nroArete, vac.animal?.nombre, vac.vacuna?.nombre, vac.campana, vac.lote].filter(Boolean).join(' ').toLowerCase()
      const matchBusqueda = busqueda === '' || texto.includes(busqueda.toLowerCase())
      const fecha = new Date(vac.fechaAplicacion)
      const matchDesde = fechaDesde === '' || fecha >= new Date(fechaDesde)
      const matchHasta = fechaHasta === '' || fecha <= new Date(fechaHasta)
      return matchBusqueda && matchDesde && matchHasta
    })
  }, [vacunaciones, busqueda, fechaDesde, fechaHasta])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Vacunaciones"
        icon={VaccinesOutlinedIcon}
        onAdd={openCreate}
        addLabel="Registrar Vacunación"
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      {vacunasProximas.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberOutlinedIcon />} sx={{ borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Vacunas próximas (30 días) — {vacunasProximas.length} pendiente{vacunasProximas.length !== 1 ? 's' : ''}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {vacunasProximas.map(vp => (
              <Chip key={vp.id} size="small"
                label={`${vp.vacuna?.nombre} — ${vp.animal?.nroArete} · ${new Date(vp.fechaProxima).toLocaleDateString('es-PY')}`}
                sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 500 }}
              />
            ))}
          </Box>
        </Alert>
      )}

      {/* FILTROS */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar por animal, vacuna, campaña..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField size="small" label="Desde" type="date" value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="Hasta" type="date" value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Box>
      </Paper>

      {vacunacionesFiltradas.length === 0 && vacunaciones.length === 0 ? (
        <EmptyState
          icon={VaccinesOutlinedIcon}
          title="No hay vacunaciones registradas"
          description="Registrá las vacunaciones aplicadas a los animales."
          onAction={openCreate}
          actionLabel="Registrar primera vacunación"
        />
      ) : vacunacionesFiltradas.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, border: '1px solid #E2E8F0', borderRadius: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No se encontraron vacunaciones con los filtros aplicados.</Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Animal</TableCell>
                  <TableCell>Vacuna</TableCell>
                  <TableCell>Campaña / Lote</TableCell>
                  <TableCell>Próxima dosis</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vacunacionesFiltradas.map((vac) => (
                  <TableRow key={vac.id} hover>
                    <TableCell>{new Date(vac.fechaAplicacion).toLocaleDateString('es-PY')}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{vac.animal?.nroArete}</Typography>
                      <Typography variant="caption" color="text.secondary">{vac.animal?.nombre || ''}</Typography>
                    </TableCell>
                    <TableCell>{vac.vacuna?.nombre}</TableCell>
                    <TableCell>
                      <div>{vac.campana || '—'}</div>
                      <Typography variant="caption" color="text.secondary">Lote: {vac.lote || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      {vac.fechaProxima
                        ? <Chip size="small" label={new Date(vac.fechaProxima).toLocaleDateString('es-PY')} sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 500 }} />
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="warning" onClick={() => openEdit(vac)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => { setConfirmId(vac.id); setConfirmLabel(vac.animal?.nroArete) }}>
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

      <Dialog open={showForm} onClose={closeForm} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? 'Editar Vacunación' : 'Nueva Vacunación'}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="vac-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField select label="Animal *" required size="small" value={formData.animalId} onChange={set('animalId')} disabled={!!editingId}>
              <MenuItem value="">Seleccionar animal</MenuItem>
              {animalesActivos.map(a => (
                <MenuItem key={a.id} value={a.id}>{a.nroArete} — {a.nombre || 'Sin nombre'}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Vacuna *" required size="small" value={formData.vacunaId} onChange={set('vacunaId')}>
              <MenuItem value="">Seleccionar vacuna</MenuItem>
              {vacunas.map(v => (
                <MenuItem key={v.id} value={v.id}>{v.nombre}</MenuItem>
              ))}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Fecha aplicación *" type="date" required size="small" fullWidth
                  InputLabelProps={{ shrink: true }} value={formData.fechaAplicacion} onChange={set('fechaAplicacion')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Próxima dosis" type="date" size="small" fullWidth
                  InputLabelProps={{ shrink: true }} value={formData.fechaProxima} onChange={set('fechaProxima')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Campaña" size="small" fullWidth placeholder="Ej: Aftosa 2024"
                  value={formData.campana} onChange={set('campana')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Lote" size="small" fullWidth placeholder="N° de lote"
                  value={formData.lote} onChange={set('lote')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Dosis aplicada" size="small" fullWidth placeholder="Ej: 2 ml"
                  value={formData.dosisAplicada} onChange={set('dosisAplicada')} />
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Vía de aplicación" size="small" fullWidth
                  value={formData.viaAplicacion} onChange={set('viaAplicacion')}>
                  <MenuItem value="">Seleccionar</MenuItem>
                  <MenuItem value="INTRAMUSCULAR">Intramuscular</MenuItem>
                  <MenuItem value="SUBCUTANEA">Subcutánea</MenuItem>
                  <MenuItem value="INTRADERMICA">Intradérmica</MenuItem>
                  <MenuItem value="ORAL">Oral</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <TextField label="Observaciones" size="small" multiline rows={2} fullWidth
              placeholder="Observaciones adicionales..."
              value={formData.observaciones} onChange={set('observaciones')} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={closeForm} variant="outlined" color="inherit">Cancelar</Button>
          <Button type="submit" form="vac-form" variant="contained" color="primary">
            {editingId ? 'Actualizar' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="¿Eliminar vacunación?"
        message={`¿Eliminar la vacunación del animal "${confirmLabel}"? Esta acción no se puede deshacer.`}
      />
    </Box>
  )
}