// frontend/src/components/DesteteForm.jsx
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

export default function DesteteForm({ open, onClose, onSubmit, crias, loading, initialData = null, isEditing = false }) {
  const [formData, setFormData] = useState({
    criaId: '',
    madreId: '',
    fechaDestete: new Date().toISOString().split('T')[0],
    tipo: 'NATURAL',
    edadDesteteDias: '',
    pesoCria: '',
    estadoCria: '',
    observaciones: '',
  })

  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        criaId: initialData.cria?.id || '',
        madreId: initialData.madre?.id || '',
        fechaDestete: initialData.fechaDestete || new Date().toISOString().split('T')[0],
        tipo: initialData.tipo || 'NATURAL',
        edadDesteteDias: initialData.edadDesteteDias || '',
        pesoCria: initialData.pesoCria || '',
        estadoCria: initialData.estadoCria || '',
        observaciones: initialData.observaciones || '',
      })
    }
  }, [initialData])

  useEffect(() => {
    if (!open) {
      setFormData({
        criaId: '',
        madreId: '',
        fechaDestete: new Date().toISOString().split('T')[0],
        tipo: 'NATURAL',
        edadDesteteDias: '',
        pesoCria: '',
        estadoCria: '',
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

  const handleCriaChange = (e) => {
    const criaId = e.target.value
    const cria = crias.find(c => c.id === criaId)
    
    if (cria) {
      const madreId = cria.madre?.id || ''
      
      let edadDias = ''
      if (cria.fechaNacimiento) {
        const nacimiento = new Date(cria.fechaNacimiento)
        const hoy = new Date()
        const diffDays = Math.ceil((hoy - nacimiento) / (1000 * 60 * 60 * 24))
        edadDias = diffDays.toString()
      }
      
      setFormData({
        ...formData,
        criaId: criaId,
        madreId: madreId,
        edadDesteteDias: edadDias,
      })
    } else {
      setFormData({ ...formData, criaId: criaId, madreId: '' })
    }
    setError('')
  }

  const handleSubmit = async () => {
    if (!formData.criaId && !isEditing) {
      setError('Debe seleccionar una cría')
      return
    }
    if (!formData.madreId && !isEditing) {
      setError('La cría seleccionada no tiene una madre registrada')
      return
    }
    
    const edadNumerica = parseInt(formData.edadDesteteDias, 10)
    if (isNaN(edadNumerica) || edadNumerica <= 0) {
      setError('La edad de destete debe ser un número mayor a 0')
      return
    }

    let result
    if (isEditing && initialData) {
      // MODO EDICIÓN
      const payload = {
        fechaDestete: formData.fechaDestete,
        tipo: formData.tipo,
        edadDesteteDias: edadNumerica,
        pesoCria: formData.pesoCria ? parseFloat(formData.pesoCria) : null,
        estadoCria: formData.estadoCria || null,
        observaciones: formData.observaciones || null,
      }
      result = await onSubmit(initialData.id, payload)
    } else {
      // MODO CREACIÓN
      const payload = {
        madreId: formData.madreId,
        criaId: formData.criaId,
        fechaDestete: formData.fechaDestete,
        tipo: formData.tipo,
        edadDesteteDias: edadNumerica,
        pesoCria: formData.pesoCria ? parseFloat(formData.pesoCria) : null,
        estadoCria: formData.estadoCria || null,
        observaciones: formData.observaciones || null,
      }
      result = await onSubmit(payload)
    }
    
    if (result?.success) {
      onClose()
    } else {
      setError(result?.message || 'Error al registrar el destete')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="span">{isEditing ? '✏️ Editar Destete' : '🍼 Registrar Destete'}</Typography>
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
            <InputLabel>Cría</InputLabel>
            <Select
              name="criaId"
              value={formData.criaId}
              onChange={handleCriaChange}
              label="Cría"
              disabled={isEditing}
            >
              <MenuItem value="">Seleccionar cría</MenuItem>
              {crias && crias.length > 0 ? (
                crias.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    🐄 {c.nroArete} - {c.nombre || 'Sin nombre'}
                    {c.madre?.nroArete ? ` (Madre: ${c.madre.nroArete})` : ' ⚠️ Sin madre registrada'}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No hay crías disponibles</MenuItem>
              )}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="Madre"
            value={formData.madreId ? `ID: ${formData.madreId}` : 'Seleccione una cría primero'}
            disabled
            error={!formData.madreId && formData.criaId !== ''}
            helperText={!formData.madreId && formData.criaId !== '' ? '⚠️ Esta cría no tiene madre registrada' : ''}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Fecha Destete"
                name="fechaDestete"
                type="date"
                value={formData.fechaDestete}
                onChange={handleChange}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Destete</InputLabel>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  label="Tipo de Destete"
                >
                  <MenuItem value="NATURAL">Natural</MenuItem>
                  <MenuItem value="PRECOZ">Precoz</MenuItem>
                  <MenuItem value="FORZADO">Forzado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Edad al Destete (días)"
                name="edadDesteteDias"
                type="number"
                value={formData.edadDesteteDias}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Peso de la Cría (kg)"
                name="pesoCria"
                type="number"
                step="0.1"
                value={formData.pesoCria}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            size="small"
            label="Estado de la Cría"
            name="estadoCria"
            value={formData.estadoCria}
            onChange={handleChange}
            placeholder="Buena, Regular, Mala"
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
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
          {loading ? 'Guardando...' : (isEditing ? 'Actualizar Destete' : 'Registrar Destete')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}