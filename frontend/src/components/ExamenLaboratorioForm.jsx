// frontend/src/components/ExamenLaboratorioForm.jsx
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_ANIMALES } from '../graphql/animales'
import {
  Box, Paper, TextField, Button, Grid, Typography, Alert,
  FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'

const ExamenLaboratorioForm = ({ onSuccess }) => {
  const { data: animalesData, loading: loadingAnimales } = useQuery(GET_ANIMALES)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    animalId: '',
    tipoExamen: 'SANGRE',
    laboratorio: '',
    fechaToma: new Date().toISOString().split('T')[0],
    resultado: '',
    esNormal: true,
    observaciones: '',
    fechaResultado: '',
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
    if (!formData.laboratorio) {
      setError('Ingrese el laboratorio')
      setLoading(false)
      return
    }
    if (!formData.resultado) {
      setError('Ingrese el resultado del examen')
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
            mutation CrearExamenLaboratorio(
              $fincaId: ID!
              $animalId: ID!
              $tipoExamen: String!
              $laboratorio: String!
              $fechaToma: Date!
              $resultado: String!
              $esNormal: Boolean
              $observaciones: String
              $fechaResultado: Date
            ) {
              crearExamenLaboratorio(
                fincaId: $fincaId
                animalId: $animalId
                tipoExamen: $tipoExamen
                laboratorio: $laboratorio
                fechaToma: $fechaToma
                resultado: $resultado
                esNormal: $esNormal
                observaciones: $observaciones
                fechaResultado: $fechaResultado
              ) {
                examen {
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
            tipoExamen: formData.tipoExamen,
            laboratorio: formData.laboratorio,
            fechaToma: formData.fechaToma,
            resultado: formData.resultado,
            esNormal: formData.esNormal,
            observaciones: formData.observaciones || null,
            fechaResultado: formData.fechaResultado || null,
          }
        })
      })

      const result = await response.json()
      
      if (result.data?.crearExamenLaboratorio?.success) {
        setSuccess('Examen de laboratorio registrado exitosamente')
        setFormData({
          animalId: '',
          tipoExamen: 'SANGRE',
          laboratorio: '',
          fechaToma: new Date().toISOString().split('T')[0],
          resultado: '',
          esNormal: true,
          observaciones: '',
          fechaResultado: '',
        })
        setTimeout(() => {
          if (onSuccess) onSuccess()
        }, 1500)
      } else {
        setError(result.data?.crearExamenLaboratorio?.message || 'Error al registrar el examen')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error de conexión: ' + err.message)
    }
    setLoading(false)
  }

  const animales = animalesData?.allAnimales || []

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <ScienceOutlinedIcon sx={{ color: '#1565C0', mr: 1 }} />
        <Typography variant="h6" fontWeight={600}>Registrar Examen de Laboratorio</Typography>
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

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Tipo Examen *</InputLabel>
              <Select
                value={formData.tipoExamen}
                onChange={(e) => setFormData({ ...formData, tipoExamen: e.target.value })}
                label="Tipo Examen *"
              >
                <MenuItem value="SANGRE">Análisis de Sangre</MenuItem>
                <MenuItem value="HECES">Examen de Heces</MenuItem>
                <MenuItem value="LECHE">Análisis de Leche</MenuItem>
                <MenuItem value="ORINA">Análisis de Orina</MenuItem>
                <MenuItem value="CULTIVO">Cultivo Bacteriano</MenuItem>
                <MenuItem value="PCR">PCR</MenuItem>
                <MenuItem value="OTRO">Otro</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Laboratorio *"
              value={formData.laboratorio}
              onChange={(e) => setFormData({ ...formData, laboratorio: e.target.value })}
              fullWidth
              size="small"
              required
              placeholder="Ej: Laboratorio Central"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Fecha Toma *"
              type="date"
              value={formData.fechaToma}
              onChange={(e) => setFormData({ ...formData, fechaToma: e.target.value })}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Fecha Resultado"
              type="date"
              value={formData.fechaResultado}
              onChange={(e) => setFormData({ ...formData, fechaResultado: e.target.value })}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Resultado Normal</InputLabel>
              <Select
                value={formData.esNormal}
                onChange={(e) => setFormData({ ...formData, esNormal: e.target.value })}
                label="Resultado Normal"
              >
                <MenuItem value={true}>Normal</MenuItem>
                <MenuItem value={false}>Anormal</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Resultado *"
              value={formData.resultado}
              onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
              fullWidth
              size="small"
              multiline
              rows={3}
              required
              placeholder="Describa los resultados del examen..."
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
              rows={2}
              placeholder="Observaciones adicionales..."
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || loadingAnimales}
              sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' } }}
            >
              {loading ? <CircularProgress size={24} /> : 'Registrar Examen'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
}

export default ExamenLaboratorioForm