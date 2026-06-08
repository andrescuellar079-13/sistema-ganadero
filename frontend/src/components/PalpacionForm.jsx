// frontend/src/components/PalpacionForm.jsx
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Grid,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

export default function PalpacionForm({ open, onClose, onSubmit, hembras, veterinarios, loading, initialData = null, isEditing = false }) {
  const [formData, setFormData] = useState({
    hembraId: '',
    fecha: new Date().toISOString().split('T')[0],
    resultado: 'POSITIVO',
    diasGestacionEstimados: '',
    veterinarioId: '',
    observaciones: '',
  })

  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        hembraId: initialData.hembra?.id || '',
        fecha: initialData.fecha || new Date().toISOString().split('T')[0],
        resultado: initialData.resultado || 'POSITIVO',
        diasGestacionEstimados: initialData.diasGestacionEstimados || '',
        veterinarioId: initialData.veterinario?.id || '',
        observaciones: initialData.observaciones || '',
      })
    }
  }, [initialData])

  useEffect(() => {
    if (!open) {
      setFormData({
        hembraId: '',
        fecha: new Date().toISOString().split('T')[0],
        resultado: 'POSITIVO',
        diasGestacionEstimados: '',
        veterinarioId: '',
        observaciones: '',
      })
      setError('')
    }
  }, [open])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    setError('')
  }

  const handleSubmit = async () => {
    if (!formData.hembraId && !isEditing) {
      setError('Debe seleccionar una hembra')
      return
    }
    if (!formData.fecha) {
      setError('Debe ingresar la fecha de la palpación')
      return
    }

    let result
    if (isEditing && initialData) {
      // MODO EDICIÓN
      const payload = {
        fecha: formData.fecha,
        resultado: formData.resultado,
        diasGestacionEstimados: formData.diasGestacionEstimados ? parseInt(formData.diasGestacionEstimados, 10) : null,
        observaciones: formData.observaciones || null,
        veterinarioId: formData.veterinarioId || null,
      }
      result = await onSubmit(initialData.id, payload)
    } else {
      // MODO CREACIÓN
      const payload = {
        ...formData,
        diasGestacionEstimados: formData.diasGestacionEstimados ? parseInt(formData.diasGestacionEstimados, 10) : null,
      }
      result = await onSubmit(payload)
    }

    if (result?.success) {
      onClose()
    } else {
      setError(result?.message || 'Error al registrar la palpación')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="span">{isEditing ? '✏️ Editar Palpación' : '🩺 Registrar Palpación'}</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth size="small" required disabled={isEditing}>
            <InputLabel>Hembra</InputLabel>
            <Select
              name="hembraId"
              value={formData.hembraId}
              onChange={handleChange}
              label="Hembra"
              disabled={isEditing}
            >
              <MenuItem value="">Seleccionar hembra</MenuItem>
              {hembras.map(h => (
                <MenuItem key={h.id} value={h.id}>
                  {h.nroArete} - {h.nombre || 'Sin nombre'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Fecha"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleChange}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Resultado</InputLabel>
                <Select
                  name="resultado"
                  value={formData.resultado}
                  onChange={handleChange}
                  label="Resultado"
                >
                  <MenuItem value="POSITIVO">Positivo (Preñada)</MenuItem>
                  <MenuItem value="NEGATIVO">Negativo (Vacía)</MenuItem>
                  <MenuItem value="SOSPECHOSO">Sospechoso</MenuItem>
                  <MenuItem value="QUISTE">Quiste</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Días de Gestación Estimados"
                name="diasGestacionEstimados"
                type="number"
                value={formData.diasGestacionEstimados}
                onChange={handleChange}
                placeholder="Ej: 45"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Veterinario</InputLabel>
                <Select
                  name="veterinarioId"
                  value={formData.veterinarioId}
                  onChange={handleChange}
                  label="Veterinario"
                >
                  <MenuItem value="">Seleccionar veterinario</MenuItem>
                  {veterinarios?.map(v => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.nombre} {v.apellidos || ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            size="small"
            label="Observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            multiline
            rows={2}
            placeholder="Observaciones adicionales..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
          {loading ? 'Guardando...' : (isEditing ? 'Actualizar Palpación' : 'Registrar Palpación')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}