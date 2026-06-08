// frontend/src/components/CeloForm.jsx
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

export default function CeloForm({ open, onClose, onSubmit, hembras, loading, initialData = null, isEditing = false }) {
  const [formData, setFormData] = useState({
    hembraId: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    tipo: 'NATURAL',
    intensidad: 'MEDIA',
    detectadoPor: '',
    observaciones: '',
  })

  const [error, setError] = useState('')

  // Cargar datos iniciales cuando hay edición
  useEffect(() => {
    if (initialData) {
      setFormData({
        hembraId: initialData.hembra?.id || '',
        fechaInicio: initialData.fechaInicio || new Date().toISOString().split('T')[0],
        fechaFin: initialData.fechaFin || '',
        tipo: initialData.tipo || 'NATURAL',
        intensidad: initialData.intensidad || 'MEDIA',
        detectadoPor: initialData.detectadoPor || '',
        observaciones: initialData.observaciones || '',
      })
    }
  }, [initialData])

  // Resetear cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setFormData({
        hembraId: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: '',
        tipo: 'NATURAL',
        intensidad: 'MEDIA',
        detectadoPor: '',
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
    if (!formData.hembraId) {
      setError('Debe seleccionar una hembra')
      return
    }
    if (!formData.fechaInicio) {
      setError('Debe ingresar la fecha de inicio del celo')
      return
    }

    let result
    if (isEditing && initialData) {
      // MODO EDICIÓN: enviar solo los campos editables, SIN hembraId
      const payload = {
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin || null,
        tipo: formData.tipo,
        intensidad: formData.intensidad,
        detectadoPor: formData.detectadoPor || null,
        observaciones: formData.observaciones || null,
      }
      result = await onSubmit(initialData.id, payload)
    } else {
      // MODO CREACIÓN: enviar todos los datos incluyendo hembraId
      result = await onSubmit(formData)
    }

    if (result?.success) {
      onClose()
    } else {
      setError(result?.message || 'Error al registrar el celo')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="span">{isEditing ? '✏️ Editar Celo' : '❤️ Registrar Celo'}</Typography>
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
                label="Fecha Inicio"
                name="fechaInicio"
                type="date"
                value={formData.fechaInicio}
                onChange={handleChange}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Fecha Fin"
                name="fechaFin"
                type="date"
                value={formData.fechaFin}
                onChange={handleChange}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Celo</InputLabel>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  label="Tipo de Celo"
                >
                  <MenuItem value="NATURAL">Celo Natural</MenuItem>
                  <MenuItem value="INDUCIDO">Celo Inducido</MenuItem>
                  <MenuItem value="SINCRONIZADO">Celo Sincronizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Intensidad</InputLabel>
                <Select
                  name="intensidad"
                  value={formData.intensidad}
                  onChange={handleChange}
                  label="Intensidad"
                >
                  <MenuItem value="BAJA">Baja</MenuItem>
                  <MenuItem value="MEDIA">Media</MenuItem>
                  <MenuItem value="ALTA">Alta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            size="small"
            label="Detectado por"
            name="detectadoPor"
            value={formData.detectadoPor}
            onChange={handleChange}
            placeholder="Nombre de la persona que detectó el celo"
          />

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
          {loading ? 'Guardando...' : (isEditing ? 'Actualizar Celo' : 'Registrar Celo')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}