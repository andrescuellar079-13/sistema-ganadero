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
  Button, TextField, MenuItem, Grid, InputAdornment, Stack, Divider,
  FormControlLabel, Checkbox,
} from '@mui/material'
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import SearchIcon from '@mui/icons-material/Search'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'

import ReportModalReusable from '../components/ReportModalReusable'
import { buildVacunacionesReportConfig } from '../components/reportes/vacunacionesReportConfig'

const EMPTY_FORM = {
  animalId: '', vacunaId: '', veterinarioId: '',
  fechaAplicacion: new Date().toISOString().split('T')[0],
  campana: '', lote: '', dosisAplicada: '', viaAplicacion: '', observaciones: '', fechaProxima: '',
}

const VIA_LABELS = {
  INTRAMUSCULAR: 'Intramuscular',
  SUBCUTANEA: 'Subcutánea',
  INTRADERMICA: 'Intradérmica',
  ORAL: 'Oral',
}

// --- Helpers de fecha ---
const addDays = (isoDate, days) => {
  if (!isoDate || !days) return ''
  const d = new Date(isoDate)
  d.setDate(d.getDate() + Number(days))
  return d.toISOString().split('T')[0]
}

const edadEnMeses = (fechaNacimiento, referenciaIso) => {
  if (!fechaNacimiento) return null
  const nac = new Date(fechaNacimiento)
  const ref = referenciaIso ? new Date(referenciaIso) : new Date()
  let meses = (ref.getFullYear() - nac.getFullYear()) * 12 + (ref.getMonth() - nac.getMonth())
  if (ref.getDate() < nac.getDate()) meses -= 1
  return Math.max(meses, 0)
}

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('es-PY') : '—')

const ESTADO_CHIP = {
  VENCIDA: { label: 'Vencida', bg: '#FEE2E2', color: '#991B1B' },
  PROXIMA: { label: 'Próxima', bg: '#FEF3C7', color: '#92400E' },
  VIGENTE: { label: 'Vigente', bg: '#DCFCE7', color: '#166534' },
  SIN_PROXIMA: { label: 'Sin próxima', bg: '#F1F5F9', color: '#475569' },
}

export default function VacunacionesPage() {
  const {
    vacunaciones, vacunasProximas, vacunasVencidas, animalesActivos, vacunas, veterinarios,
    loading, error, crearVacunacion, actualizarVacunacion, eliminarVacunacion,
  } = useVacunaciones()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [message, setMessage] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [confirmLabel, setConfirmLabel] = useState('')
  const [showReportes, setShowReportes] = useState(false)

  // Filtros
  const [busqueda, setBusqueda]               = useState('')
  const [fechaDesde, setFechaDesde]           = useState('')
  const [fechaHasta, setFechaHasta]           = useState('')
  const [filtroVacuna, setFiltroVacuna]       = useState('')
  const [filtroAnimal, setFiltroAnimal]       = useState('')
  const [filtroVeterinario, setFiltroVet]     = useState('')
  const [filtroCampana, setFiltroCampana]     = useState('')
  const [soloProximas, setSoloProximas]       = useState(false)
  const [soloVencidas, setSoloVencidas]       = useState(false)

  const notify = (r) => {
    setMessage({ type: r.success ? 'success' : 'error', text: r.message || (r.success ? 'Operación exitosa' : 'Error') })
    setTimeout(() => setMessage(null), 4500)
  }

  const selectedVacuna = useMemo(
    () => vacunas.find(v => String(v.id) === String(formData.vacunaId)) || null,
    [vacunas, formData.vacunaId]
  )
  const selectedAnimal = useMemo(
    () => animalesActivos.find(a => String(a.id) === String(formData.animalId)) || null,
    [animalesActivos, formData.animalId]
  )

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))

  // Al seleccionar vacuna: autocompletar dosis/vía y calcular próxima dosis
  const onVacunaChange = (e) => {
    const vac = vacunas.find(v => String(v.id) === String(e.target.value))
    setFormData(prev => ({
      ...prev,
      vacunaId: e.target.value,
      dosisAplicada: vac?.dosisRecomendada || prev.dosisAplicada,
      viaAplicacion: vac?.viaAplicacion || prev.viaAplicacion,
      fechaProxima: vac?.intervaloDias ? addDays(prev.fechaAplicacion, vac.intervaloDias) : prev.fechaProxima,
    }))
  }

  // Al cambiar la fecha de aplicación: recalcular próxima dosis
  const onFechaChange = (e) => {
    const nuevaFecha = e.target.value
    setFormData(prev => ({
      ...prev,
      fechaAplicacion: nuevaFecha,
      fechaProxima: selectedVacuna?.intervaloDias ? addDays(nuevaFecha, selectedVacuna.intervaloDias) : prev.fechaProxima,
    }))
  }

  const openCreate = () => { setEditingId(null); setFormData(EMPTY_FORM); setShowForm(true) }
  const openEdit = (v) => {
    setEditingId(v.id)
    setFormData({
      animalId: v.animal.id, vacunaId: v.vacuna.id, veterinarioId: v.veterinario?.id || '',
      fechaAplicacion: v.fechaAplicacion, campana: v.campana || '',
      lote: v.lote || '', dosisAplicada: v.dosisAplicada || '',
      viaAplicacion: v.viaAplicacion || '', observaciones: v.observaciones || '',
      fechaProxima: v.fechaProxima || '',
    })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditingId(null); setFormData(EMPTY_FORM) }

  // --- Indicadores / advertencias del formulario ---
  const edadAnimal = selectedAnimal ? edadEnMeses(selectedAnimal.fechaNacimiento, formData.fechaAplicacion) : null
  const advertencias = useMemo(() => {
    const out = []
    if (selectedVacuna) {
      if (!selectedVacuna.activo) out.push({ sev: 'error', text: 'La vacuna está inactiva. No se puede registrar.' })
      if (selectedVacuna.isVencida) out.push({ sev: 'error', text: `Vacuna vencida (${fmt(selectedVacuna.fechaVencimiento)}). No se puede registrar.` })
      if (Number(selectedVacuna.stockCantidad) < 1) out.push({ sev: 'error', text: 'Stock insuficiente. No se puede registrar.' })
      else if (selectedVacuna.isStockBajo) out.push({ sev: 'warning', text: `Stock bajo: ${selectedVacuna.stockCantidad} (mínimo ${selectedVacuna.stockMinimo}).` })
      if (edadAnimal !== null && selectedVacuna.edadMinimaMeses > 0 && edadAnimal < selectedVacuna.edadMinimaMeses) {
        out.push({ sev: 'warning', text: `El animal tiene ${edadAnimal} mes(es); la vacuna requiere mínimo ${selectedVacuna.edadMinimaMeses}.` })
      }
    }
    if (formData.fechaProxima && new Date(formData.fechaProxima) < new Date(new Date().toISOString().split('T')[0])) {
      out.push({ sev: 'warning', text: 'La próxima dosis calculada ya está vencida.' })
    }
    return out
  }, [selectedVacuna, edadAnimal, formData.fechaProxima])

  const bloqueado = advertencias.some(a => a.sev === 'error')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!editingId && bloqueado) {
      notify({ success: false, message: 'Corrija los errores antes de registrar.' })
      return
    }
    const r = editingId
      ? await actualizarVacunacion(editingId, {
        fechaAplicacion: formData.fechaAplicacion, veterinarioId: formData.veterinarioId || null,
        campana: formData.campana, lote: formData.lote, dosisAplicada: formData.dosisAplicada,
        viaAplicacion: formData.viaAplicacion, observaciones: formData.observaciones,
        fechaProxima: formData.fechaProxima,
      })
      : await crearVacunacion({
        animalId: formData.animalId, vacunaId: formData.vacunaId, veterinarioId: formData.veterinarioId || null,
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
      const matchVacuna = filtroVacuna === '' || String(vac.vacuna?.id) === String(filtroVacuna)
      const matchAnimal = filtroAnimal === '' || String(vac.animal?.id) === String(filtroAnimal)
      const matchVet = filtroVeterinario === '' || String(vac.veterinario?.id) === String(filtroVeterinario)
      const matchCampana = filtroCampana === '' || (vac.campana || '').toLowerCase().includes(filtroCampana.toLowerCase())
      const matchProximas = !soloProximas || vac.estadoProxima === 'PROXIMA'
      const matchVencidas = !soloVencidas || vac.estadoProxima === 'VENCIDA'
      return matchBusqueda && matchDesde && matchHasta && matchVacuna && matchAnimal && matchVet && matchCampana && matchProximas && matchVencidas
    })
  }, [vacunaciones, busqueda, fechaDesde, fechaHasta, filtroVacuna, filtroAnimal, filtroVeterinario, filtroCampana, soloProximas, soloVencidas])

  const reporteConfig = useMemo(
    () => buildVacunacionesReportConfig({ vacunaciones, veterinarios, animalesActivos }),
    [vacunaciones, veterinarios, animalesActivos]
  )

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Vacunaciones"
        icon={VaccinesOutlinedIcon}
        onAdd={openCreate}
        addLabel="Registrar Vacunación"
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

      {/* PANEL SUPERIOR: próximas y vencidas */}
      {vacunasProximas.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberOutlinedIcon />} sx={{ borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Vacunas próximas (30 días) — {vacunasProximas.length} pendiente{vacunasProximas.length !== 1 ? 's' : ''}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {vacunasProximas.map(vp => (
              <Chip key={vp.id} size="small"
                label={`${vp.vacuna?.nombre} — ${vp.animal?.nroArete} · ${fmt(vp.fechaProxima)}`}
                sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 500 }}
              />
            ))}
          </Box>
        </Alert>
      )}

      {vacunasVencidas.length > 0 && (
        <Alert severity="error" icon={<WarningAmberOutlinedIcon />} sx={{ borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Vacunas vencidas — {vacunasVencidas.length} dosis sin aplicar
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {vacunasVencidas.map(vp => (
              <Chip key={vp.id} size="small"
                label={`${vp.vacuna?.nombre} — ${vp.animal?.nroArete} · ${fmt(vp.fechaProxima)}`}
                sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 500 }}
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
            sx={{ minWidth: 240 }}
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
          <TextField select size="small" label="Vacuna" value={filtroVacuna}
            onChange={(e) => setFiltroVacuna(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="">Todas</MenuItem>
            {vacunas.map(v => <MenuItem key={v.id} value={v.id}>{v.nombre}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Animal" value={filtroAnimal}
            onChange={(e) => setFiltroAnimal(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="">Todos</MenuItem>
            {animalesActivos.map(a => <MenuItem key={a.id} value={a.id}>{a.nroArete}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Veterinario" value={filtroVeterinario}
            onChange={(e) => setFiltroVet(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="">Todos</MenuItem>
            {veterinarios.map(vt => <MenuItem key={vt.id} value={vt.id}>{vt.nombre} {vt.apellidos || ''}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Campaña" value={filtroCampana}
            onChange={(e) => setFiltroCampana(e.target.value)} sx={{ minWidth: 140 }} />
          <FormControlLabel
            control={<Checkbox size="small" checked={soloProximas} onChange={(e) => setSoloProximas(e.target.checked)} />}
            label="Próximas 30 días"
          />
          <FormControlLabel
            control={<Checkbox size="small" checked={soloVencidas} onChange={(e) => setSoloVencidas(e.target.checked)} />}
            label="Vencidas"
          />
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
                  <TableCell>Dosis</TableCell>
                  <TableCell>Vía</TableCell>
                  <TableCell>Veterinario</TableCell>
                  <TableCell>Próxima dosis</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vacunacionesFiltradas.map((vac) => {
                  const est = ESTADO_CHIP[vac.estadoProxima] || ESTADO_CHIP.SIN_PROXIMA
                  return (
                    <TableRow key={vac.id} hover>
                      <TableCell>{fmt(vac.fechaAplicacion)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{vac.animal?.nroArete}</Typography>
                        <Typography variant="caption" color="text.secondary">{vac.animal?.nombre || ''}</Typography>
                      </TableCell>
                      <TableCell>{vac.vacuna?.nombre}</TableCell>
                      <TableCell>
                        <div>{vac.campana || '—'}</div>
                        <Typography variant="caption" color="text.secondary">Lote: {vac.lote || '—'}</Typography>
                      </TableCell>
                      <TableCell>{vac.dosisAplicada || '—'}</TableCell>
                      <TableCell>{VIA_LABELS[vac.viaAplicacion] || vac.viaAplicacion || '—'}</TableCell>
                      <TableCell>{vac.nombreVeterinario || '—'}</TableCell>
                      <TableCell>{vac.fechaProxima ? fmt(vac.fechaProxima) : '—'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={est.label} sx={{ bgcolor: est.bg, color: est.color, fontWeight: 500 }} />
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
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      <Dialog open={showForm} onClose={closeForm} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? 'Editar Vacunación' : 'Registrar Vacunación'}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="vac-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField select label="Animal *" required size="small" value={formData.animalId} onChange={set('animalId')} disabled={!!editingId}>
              <MenuItem value="">Seleccionar animal</MenuItem>
              {animalesActivos.map(a => (
                <MenuItem key={a.id} value={a.id}>{a.nroArete} — {a.nombre || 'Sin nombre'}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Vacuna *" required size="small" value={formData.vacunaId}
              onChange={onVacunaChange} disabled={!!editingId}>
              <MenuItem value="">Seleccionar vacuna</MenuItem>
              {vacunas.map(v => (
                <MenuItem key={v.id} value={v.id}>{v.nombre}{!v.activo ? ' (inactiva)' : ''}</MenuItem>
              ))}
            </TextField>

            {/* Datos informativos de la vacuna */}
            {selectedVacuna && (
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap divider={<Divider orientation="vertical" flexItem />}>
                  <Typography variant="caption">Intervalo: <b>{selectedVacuna.intervaloDias || '—'} días</b></Typography>
                  <Typography variant="caption">Stock: <b>{selectedVacuna.stockCantidad}</b> (mín {selectedVacuna.stockMinimo})</Typography>
                  <Typography variant="caption">Vence: <b>{fmt(selectedVacuna.fechaVencimiento)}</b></Typography>
                  <Typography variant="caption">Edad mín.: <b>{selectedVacuna.edadMinimaMeses} m</b></Typography>
                  {edadAnimal !== null && <Typography variant="caption">Edad animal: <b>{edadAnimal} m</b></Typography>}
                </Stack>
              </Paper>
            )}

            {/* Indicadores / advertencias */}
            {advertencias.map((a, i) => (
              <Alert key={i} severity={a.sev} sx={{ borderRadius: 2, py: 0 }}>{a.text}</Alert>
            ))}

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Fecha aplicación *" type="date" required size="small" fullWidth
                  InputLabelProps={{ shrink: true }} value={formData.fechaAplicacion} onChange={onFechaChange} />
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
              <Grid item xs={12}>
                <TextField select label="Veterinario" size="small" fullWidth
                  value={formData.veterinarioId} onChange={set('veterinarioId')}>
                  <MenuItem value="">Sin veterinario</MenuItem>
                  {veterinarios.filter(vt => vt.activo).map(vt => (
                    <MenuItem key={vt.id} value={vt.id}>{vt.nombre} {vt.apellidos || ''}</MenuItem>
                  ))}
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
          <Button type="submit" form="vac-form" variant="contained" color="primary" disabled={!editingId && bloqueado}>
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

      <ReportModalReusable
        open={showReportes}
        onClose={() => setShowReportes(false)}
        {...reporteConfig}
      />
    </Box>
  )
}
