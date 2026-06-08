// frontend/src/components/MastitisForm.jsx
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_ANIMALES } from '../graphql/animales'
import {
  Box, Paper, TextField, Button, Grid, Typography, Alert,
  FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material'
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined'

const MastitisForm = ({ onSuccess }) => {
  const { data: animalesData, loading: loadingAnimales } = useQuery(GET_ANIMALES)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    animalId: '',
    fecha: new Date().toISOString().split('T')[0],
    cuartoAfectado: 'DI',
    tipo: 'CLINICA',
    bacteria: '',
    recuentoCelsSomaticas: '',
    observaciones: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!formData.animalId) {
      setError('Seleccione un animal')
      setLoading(false)
      return
    }

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
          query: `
            mutation CrearRegistroMastitis(
              $fincaId: ID!
              $animalId: ID!
              $fecha: Date!
              $cuartoAfectado: String!
              $tipo: String!
              $bacteria: String
              $recuentoCelsSomaticas: Int
              $observaciones: String
            ) {
              crearRegistroMastitis(
                fincaId: $fincaId
                animalId: $animalId
                fecha: $fecha
                cuartoAfectado: $cuartoAfectado
                tipo: $tipo
                bacteria: $bacteria
                recuentoCelsSomaticas: $recuentoCelsSomaticas
                observaciones: $observaciones
              ) {
                registro {
                  id
                }
                success
                message
              }
            }
          `,
          variables: {
            fincaId,
            animalId: formData.animalId,
            fecha: formData.fecha,
            cuartoAfectado: formData.cuartoAfectado,
            tipo: formData.tipo,
            bacteria: formData.bacteria || null,
            recuentoCelsSomaticas: formData.recuentoCelsSomaticas ? parseInt(formData.recuentoCelsSomaticas) : null,
            observaciones: formData.observaciones || null,
          }
        })
      })

      const result = await response.json()
      
      if (result.data?.crearRegistroMastitis?.success) {
        setSuccess('Registro de mastitis creado exitosamente')
        setFormData({
          animalId: '',
          fecha: new Date().toISOString().split('T')[0],
          cuartoAfectado: 'DI',
          tipo: 'CLINICA',
          bacteria: '',
          recuentoCelsSomaticas: '',
          observaciones: '',
        })
        setTimeout(() => {
          if (onSuccess) onSuccess()
        }, 1500)
      } else {
        setError(result.data?.crearRegistroMastitis?.message || 'Error al registrar mastitis')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error de conexión: ' + err.message)
    }
    setLoading(false)
  }

  const animales = animalesData?.allAnimales || []
  // Filtrar solo hembras para mastitis (opcional)
  const hembras = animales.filter(a => a.sexo === 'HEMBRA' || a.sexo === 'FEMENINO')

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <LocalHospitalOutlinedIcon sx={{ color: '#E65100', mr: 1 }} />
        <Typography variant="h6" fontWeight={600}>Registrar Caso de Mastitis</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Animal *</InputLabel>
              <Select
                value={formData.animalId}
                onChange={(e) => setFormData({ ...formData, animalId: e.target.value })}
                label="Animal *"
                disabled={loadingAnimales}
              >
                {loadingAnimales ? (
                  <MenuItem disabled>Cargando animales...</MenuItem>
                ) : hembras.length === 0 ? (
                  <MenuItem disabled>No hay hembras registradas</MenuItem>
                ) : (
                  hembras.map(a => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.nroArete} - {a.nombre || 'Sin nombre'}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Fecha *"
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Cuarto Afectado *</InputLabel>
              <Select
                value={formData.cuartoAfectado}
                onChange={(e) => setFormData({ ...formData, cuartoAfectado: e.target.value })}
                label="Cuarto Afectado *"
              >
                <MenuItem value="DI">Derecho Izquierdo</MenuItem>
                <MenuItem value="DD">Derecho Derecho</MenuItem>
                <MenuItem value="TI">Trasero Izquierdo</MenuItem>
                <MenuItem value="TD">Trasero Derecho</MenuItem>
                <MenuItem value="MULTIPLE">Múltiples</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Tipo *</InputLabel>
              <Select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                label="Tipo *"
              >
                <MenuItem value="CLINICA">Clínica</MenuItem>
                <MenuItem value="SUBCLINICA">Subclínica</MenuItem>
                <MenuItem value="CRONICA">Crónica</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Bacteria (opcional)"
              value={formData.bacteria}
              onChange={(e) => setFormData({ ...formData, bacteria: e.target.value })}
              fullWidth
              size="small"
              placeholder="Ej: Staphylococcus aureus"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Recuento Células Somáticas"
              type="number"
              value={formData.recuentoCelsSomaticas}
              onChange={(e) => setFormData({ ...formData, recuentoCelsSomaticas: e.target.value })}
              fullWidth
              size="small"
              placeholder="células/mL"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder="Síntomas, tratamiento aplicado, etc..."
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || loadingAnimales}
              sx={{ bgcolor: '#E65100', '&:hover': { bgcolor: '#BF360C' } }}
            >
              {loading ? <CircularProgress size={24} /> : 'Registrar Mastitis'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
}

export default MastitisForm