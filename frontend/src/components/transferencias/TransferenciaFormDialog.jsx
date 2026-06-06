// Diálogo para crear / editar una transferencia (solo cabecera)
import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Typography,
  Alert, Divider, Stack,
} from '@mui/material'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'

const MOTIVOS = [
  { value: 'CAMBIO_FINCA',        label: 'Cambio de finca' },
  { value: 'ROTACION_GENERAL',    label: 'Rotación general' },
  { value: 'COMPRA_INTERNA',      label: 'Compra interna' },
  { value: 'REUBICACION',         label: 'Reubicación' },
  { value: 'MANEJO_SANITARIO',    label: 'Manejo sanitario' },
  { value: 'MANEJO_REPRODUCTIVO', label: 'Manejo reproductivo' },
  { value: 'OTRO',                label: 'Otro' },
]

const hoy = () => new Date().toISOString().slice(0, 10)

const INIT = {
  fincaOrigenId: '',
  fincaDestinoId: '',
  fechaTransferencia: hoy(),
  motivo: 'CAMBIO_FINCA',
  observaciones: '',
  responsable: '',
}

export default function TransferenciaFormDialog({
  open,
  onClose,
  onSubmit,
  fincas = [],
  transferencia = null,
  loading = false,
}) {
  const [form, setForm] = useState(INIT)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (transferencia) {
        setForm({
          fincaOrigenId:    transferencia.fincaOrigen?.id || '',
          fincaDestinoId:   transferencia.fincaDestino?.id || '',
          fechaTransferencia: transferencia.fechaTransferencia || hoy(),
          motivo:           transferencia.motivo || 'CAMBIO_FINCA',
          observaciones:    transferencia.observaciones || '',
          responsable:      transferencia.responsable || '',
        })
      } else {
        setForm(INIT)
      }
      setError('')
    }
  }, [open, transferencia])

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async () => {
    setError('')
    if (!form.fincaOrigenId)  return setError('Seleccione la finca de origen.')
    if (!form.fincaDestinoId) return setError('Seleccione la finca de destino.')
    if (form.fincaOrigenId === form.fincaDestinoId)
      return setError('La finca origen y destino no pueden ser la misma.')
    if (!form.fechaTransferencia) return setError('Ingrese la fecha de transferencia.')

    const result = await onSubmit(form)
    if (!result?.success) setError(result?.message || 'Error al guardar.')
  }

  const fincasOrigen  = fincas
  const fincasDestino = fincas.filter(f => f.id !== form.fincaOrigenId)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SwapHorizIcon color="primary" />
        {transferencia ? 'Editar Transferencia' : 'Nueva Transferencia entre Fincas'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth required size="small"
                label="Finca origen"
                value={form.fincaOrigenId}
                onChange={set('fincaOrigenId')}
              >
                {fincasOrigen.map(f => (
                  <MenuItem key={f.id} value={f.id}>{f.nombre}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth required size="small"
                label="Finca destino"
                value={form.fincaDestinoId}
                onChange={set('fincaDestinoId')}
                disabled={!form.fincaOrigenId}
              >
                {fincasDestino.map(f => (
                  <MenuItem key={f.id} value={f.id}>{f.nombre}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth required size="small" type="date"
                label="Fecha de transferencia"
                value={form.fechaTransferencia}
                onChange={set('fechaTransferencia')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth size="small"
                label="Motivo"
                value={form.motivo}
                onChange={set('motivo')}
              >
                {MOTIVOS.map(m => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <TextField
            fullWidth size="small"
            label="Responsable"
            value={form.responsable}
            onChange={set('responsable')}
            placeholder="Nombre del responsable del traslado"
          />

          <TextField
            fullWidth size="small" multiline rows={2}
            label="Observaciones"
            value={form.observaciones}
            onChange={set('observaciones')}
          />

          {form.fincaOrigenId && form.fincaDestinoId && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Después de guardar, podrá agregar los animales a transferir.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Guardando...' : (transferencia ? 'Actualizar' : 'Crear transferencia')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
