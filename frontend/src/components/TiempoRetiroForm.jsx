// frontend/src/components/TiempoRetiroForm.jsx
import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { GET_ANIMALES } from '../graphql/animales'
import {
  Box, Paper, TextField, Button, Grid, Typography, Alert,
  FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'

// Query para obtener tratamientos de un animal
const GET_TRATAMIENTOS_POR_ANIMAL = `
  query GetTratamientos($fincaId: ID!, $animalId: ID) {
    tratamientos(fincaId: $fincaId, animalId: $animalId) {
      id
      diagnostico
      fecha
      enTratamiento
    }
  }
`

const TiempoRetiroForm = ({ onSuccess }) => {
  const { data: animalesData, loading: loadingAnimales } = useQuery(GET_ANIMALES)
  const [animalSeleccionado, setAnimalSeleccionado] = useState('')
  const [tratamientos, setTratamientos] = useState([])
  const [loadingTratamientos, setLoadingTratamientos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    tratamientoId: '',
    tipoRetiro: 'CARNE',
    fechaInicio: new Date().toISOString().split('T')[0],
    diasRetiro: 15,
  })

  // Cargar tratamientos cuando se selecciona un animal
  useEffect(() => {
    const cargarTratamientos = async () => {
      if (!animalSeleccionado) {
        setTratamientos([])
        return
      }
      
      setLoadingTratamientos(true)
      const fincaId = localStorage.getItem('fincaId') || '1'
      const token = localStorage.getItem('token')
      
      try {
        const response = await fetch('http://localhost:8000/graphql/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `JWT ${token}` : '',
          },
          body: JSON.stringify({
            query: GET_TRATAMIENTOS_POR_ANIMAL,
            variables: { fincaId, animalId: animalSeleccionado }
          })
        })
        const result = await response.json()
        if (result.data?.tratamientos) {
          setTratamientos(result.data.tratamientos)
          // Limpiar tratamiento seleccionado
          setFormData(prev => ({ ...prev, tratamientoId: '' }))
        }
      } catch (err) {
        console.error('Error cargando tratamientos:', err)
      }
      setLoadingTratamientos(false)
    }
    
    cargarTratamientos()
  }, [animalSeleccionado])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!formData.tratamientoId) {
      setError('Seleccione un tratamiento')
      setLoading(false)
      return
    }
    if (formData.diasRetiro < 1) {
      setError('Los días de retiro deben ser al menos 1')
      setLoading(false)
      return
    }

    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch('http://localhost:8000/graphql/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `JWT ${token}` : '',
        },
        body: JSON.stringify({
          query: `
            mutation CrearTiempoRetiro(
              $tratamientoId: ID!
              $tipoRetiro: String!
              $fechaInicio: Date!
              $diasRetiro: Int!
            ) {
              crearTiempoRetiro(
                tratamientoId: $tratamientoId
                tipoRetiro: $tipoRetiro
                fechaInicio: $fechaInicio
                diasRetiro: $diasRetiro
              ) {
                tiempoRetiro {
                  id
                }
                success
                message
              }
            }
          `,
          variables: {
            tratamientoId: formData.tratamientoId,
            tipoRetiro: formData.tipoRetiro,
            fechaInicio: formData.fechaInicio,
            diasRetiro: parseInt(formData.diasRetiro),
          }
        })
      })

      const result = await response.json()
      
      if (result.data?.crearTiempoRetiro?.success) {
        setSuccess('Período de retiro registrado exitosamente')
        setFormData({
          tratamientoId: '',
          tipoRetiro: 'CARNE',
          fechaInicio: new Date().toISOString().split('T')[0],
          diasRetiro: 15,
        })
        setAnimalSeleccionado('')
        setTratamientos([])
        setTimeout(() => {
          if (onSuccess) onSuccess()
        }, 1500)
      } else {
        setError(result.data?.crearTiempoRetiro?.message || 'Error al registrar período de retiro')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error de conexión: ' + err.message)
    }
    setLoading(false)
  }

  const animales = animalesData?.allAnimales || []

  // Calcular fecha fin para mostrar
  const fechaInicioPreview = new Date(formData.fechaInicio)
  const fechaFinPreview = new Date(fechaInicioPreview)
  fechaFinPreview.setDate(fechaFinPreview.getDate() + (parseInt(formData.diasRetiro) || 0))

  // Obtener el animal seleccionado
  const animalObj = animales.find(a => a.id === animalSeleccionado)

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TimerOutlinedIcon sx={{ color: '#C62828', mr: 1 }} />
        <Typography variant="h6" fontWeight={600}>Registrar Período de Retiro</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Paso 1: Seleccionar animal */}
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>1. Seleccionar Animal</InputLabel>
              <Select
                value={animalSeleccionado}
                onChange={(e) => setAnimalSeleccionado(e.target.value)}
                label="1. Seleccionar Animal"
                disabled={loadingAnimales}
              >
                {loadingAnimales ? (
                  <MenuItem disabled>Cargando animales...</MenuItem>
                ) : animales.length === 0 ? (
                  <MenuItem disabled>No hay animales registrados</MenuItem>
                ) : (
                  animales.map(a => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.nroArete} - {a.nombre || 'Sin nombre'} ({a.sexo === 'MACHO' ? 'Macho' : 'Hembra'})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* Paso 2: Seleccionar tratamiento */}
          <Grid item xs={12}>
            <FormControl fullWidth size="small" required>
              <InputLabel>2. Seleccionar Tratamiento *</InputLabel>
              <Select
                value={formData.tratamientoId}
                onChange={(e) => setFormData({ ...formData, tratamientoId: e.target.value })}
                label="2. Seleccionar Tratamiento *"
                disabled={!animalSeleccionado || loadingTratamientos}
              >
                {!animalSeleccionado ? (
                  <MenuItem disabled>Primero seleccione un animal</MenuItem>
                ) : loadingTratamientos ? (
                  <MenuItem disabled>Cargando tratamientos...</MenuItem>
                ) : tratamientos.length === 0 ? (
                  <MenuItem disabled>No hay tratamientos para este animal</MenuItem>
                ) : (
                  tratamientos.map(t => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.diagnostico || 'Sin diagnóstico'} - {new Date(t.fecha).toLocaleDateString()} {t.enTratamiento ? '(Activo)' : '(Completado)'}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            {animalObj && tratamientos.length === 0 && !loadingTratamientos && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                Este animal no tiene tratamientos registrados. Primero registre un tratamiento.
              </Typography>
            )}
          </Grid>

          {/* Paso 3: Datos del retiro */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>3. Datos del Período de Retiro</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Tipo de Retiro *</InputLabel>
              <Select
                value={formData.tipoRetiro}
                onChange={(e) => setFormData({ ...formData, tipoRetiro: e.target.value })}
                label="Tipo de Retiro *"
              >
                <MenuItem value="CARNE">Retiro de Carne</MenuItem>
                <MenuItem value="LECHE">Retiro de Leche</MenuItem>
                <MenuItem value="AMBOS">Ambos (Carne y Leche)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Fecha Inicio *"
              type="date"
              value={formData.fechaInicio}
              onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
              fullWidth
              size="small"
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Días de Retiro *"
              type="number"
              value={formData.diasRetiro}
              onChange={(e) => setFormData({ ...formData, diasRetiro: parseInt(e.target.value) || 0 })}
              fullWidth
              size="small"
              required
              helperText="Días que debe esperarse para consumir carne/leche (1-365)"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
              <strong>Fecha de fin calculada:</strong> {fechaFinPreview.toLocaleDateString()}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !formData.tratamientoId}
              sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' } }}
            >
              {loading ? <CircularProgress size={24} /> : 'Registrar Período de Retiro'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
}

export default TiempoRetiroForm