// frontend/src/components/IniciarEngordeDialog.jsx
import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Typography, Box, Alert, IconButton,
} from '@mui/material'
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined'
import CloseIcon from '@mui/icons-material/Close'

const TIPOS_ENGORDE = [
  { value: 'INTENSIVO', label: 'Intensivo' },
  { value: 'EXTENSIVO', label: 'Extensivo' },
  { value: 'SEMI_INTENSIVO', label: 'Semi-intensivo' },
]

const hoyISO = () => new Date().toISOString().split('T')[0]

/**
 * Diálogo para iniciar el engorde de un animal de Carne / Doble propósito.
 * No crea animales: opera sobre uno ya registrado y activo.
 *
 * Props:
 *  - open, onClose
 *  - animal   : animal seleccionado (nroArete, nombre, peso, ...)
 *  - onSubmit : (variables) => Promise<{success, message, error}>
 */
export default function IniciarEngordeDialog({ open, onClose, animal, onSubmit }) {
  const pesoActual = Number(animal?.peso) || 0

  const [form, setForm] = useState({
    fechaInicio: hoyISO(),
    pesoInicial: '',
    pesoObjetivo: '',
    tipoEngorde: 'SEMI_INTENSIVO',
    loteGrupo: '',
    observaciones: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Reiniciar al abrir, precargando el peso actual como peso inicial
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setForm({
        fechaInicio: hoyISO(),
        pesoInicial: pesoActual ? String(pesoActual) : '',
        pesoObjetivo: '',
        tipoEngorde: 'SEMI_INTENSIVO',
        loteGrupo: '',
        observaciones: '',
      })
      setError('')
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    setError('')
    const pInicial = parseFloat(form.pesoInicial)
    const pObjetivo = parseFloat(form.pesoObjetivo)

    if (!form.fechaInicio) return setError('La fecha de inicio es obligatoria.')
    if (isNaN(pInicial) || pInicial < 0) return setError('El peso inicial no puede ser negativo.')
    if (isNaN(pObjetivo) || pObjetivo < pInicial) {
      return setError('El peso objetivo no puede ser menor al peso inicial.')
    }

    setLoading(true)
    const res = await onSubmit({
      animalId: animal.id,
      fechaInicio: form.fechaInicio,
      pesoInicial: pInicial,
      pesoObjetivo: pObjetivo,
      tipoEngorde: form.tipoEngorde,
      loteGrupo: form.loteGrupo || null,
      observaciones: form.observaciones || null,
    })
    setLoading(false)

    if (res?.success) {
      onClose()
    } else {
      setError(res?.message || res?.error || 'No se pudo iniciar el engorde.')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{
        bgcolor: '#B45309', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestaurantOutlinedIcon />
          <Typography variant="h6" fontWeight={700}>Iniciar engorde</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2.5 }}>
        {animal && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Animal: <strong>{animal.nroArete}</strong>
            {animal.nombre ? ` — ${animal.nombre}` : ''}
          </Typography>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" type="date" label="Fecha de inicio *"
              value={form.fechaInicio} onChange={set('fechaInicio')}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" select label="Tipo de engorde"
              value={form.tipoEngorde} onChange={set('tipoEngorde')}>
              {TIPOS_ENGORDE.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" type="number" label="Peso inicial (kg) *"
              value={form.pesoInicial} onChange={set('pesoInicial')}
              inputProps={{ min: 0, step: 0.1 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" type="number" label="Peso objetivo (kg) *"
              value={form.pesoObjetivo} onChange={set('pesoObjetivo')}
              inputProps={{ min: 0, step: 0.1 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Lote / grupo"
              value={form.loteGrupo} onChange={set('loteGrupo')} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" multiline rows={2} label="Observaciones"
              value={form.observaciones} onChange={set('observaciones')} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          sx={{ textTransform: 'none', bgcolor: '#B45309', '&:hover': { bgcolor: '#92400E' } }}>
          {loading ? 'Guardando...' : 'Iniciar engorde'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
