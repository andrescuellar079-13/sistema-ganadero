// frontend/src/pages/ConfiguracionPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useConfiguracion } from '../hooks/useConfiguracion'
import { useTheme } from '../context/ThemeContext'
import { useLogo } from '../context/LogoContext'
import { useConfiguracionGlobal } from '../context/ConfiguracionGlobalContext'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/ui/PageHeader'
import PageAlert from '../components/ui/PageAlert'

import {
  Box, Paper, Tabs, Tab, Grid, TextField, FormControl, 
  InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Button, Typography, Divider, Card, CardContent, Alert,
  LinearProgress
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import SecurityIcon from '@mui/icons-material/Security'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'

const TABS = [
  { label: 'General', icon: <SettingsIcon /> },
  { label: 'Seguridad', icon: <SecurityIcon /> },
]

function ConfiguracionPage() {
  const { configuracion, loading, actualizarConfiguracion } = useConfiguracion()
  const { modoOscuro, setModoOscuro } = useTheme()
  const { logoUrl, actualizarLogo, eliminarLogo } = useLogo()
  const { actualizarConfiguracionGlobal } = useConfiguracionGlobal()
  const [tabIndex, setTabIndex] = useState(0)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({})
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (configuracion && Object.keys(formData).length === 0) {
      setFormData(configuracion)
    }
  }, [configuracion])

  useEffect(() => {
    const savedNombre = localStorage.getItem('nombreSistema')
    if (savedNombre && formData.nombreSistema !== savedNombre) {
      setFormData(prev => ({ ...prev, nombreSistema: savedNombre }))
      document.title = `${savedNombre} - Sistema Ganadero`
    }
  }, [])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'tema') {
      setModoOscuro(value === 'OSCURO')
      localStorage.setItem('theme', value === 'OSCURO' ? 'dark' : 'light')
    }
    
    if (field === 'nombreSistema') {
      const nuevoNombre = value || 'GanadoSoft'
      document.title = `${nuevoNombre} - Sistema Ganadero`
      localStorage.setItem('nombreSistema', nuevoNombre)
    }
    
    // Aplicar cambios globales en tiempo real
    if (field === 'moneda') {
      actualizarConfiguracionGlobal({ moneda: value })
    }
    if (field === 'simboloMoneda') {
      actualizarConfiguracionGlobal({ simboloMoneda: value })
    }
    if (field === 'idioma') {
      actualizarConfiguracionGlobal({ idioma: value })
    }
  }

  // Subir archivo de logo
  const handleLogoUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Formato no soportado. Usa PNG, JPG, SVG o WEBP' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'El logo no puede superar los 2MB' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    
    setUploading(true)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      actualizarLogo(base64String)
      setMessage({ type: 'success', text: 'Logo actualizado correctamente' })
      setTimeout(() => setMessage(null), 3000)
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // Eliminar logo
  const handleRemoveLogo = () => {
    eliminarLogo()
    setMessage({ type: 'success', text: 'Logo eliminado' })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSubmit = async () => {
    setSaving(true)
    const result = await actualizarConfiguracion(formData)
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' })
      
      if (formData.tema) {
        setModoOscuro(formData.tema === 'OSCURO')
        localStorage.setItem('theme', formData.tema === 'OSCURO' ? 'dark' : 'light')
      }
      
      if (formData.nombreSistema) {
        document.title = `${formData.nombreSistema} - Sistema Ganadero`
        localStorage.setItem('nombreSistema', formData.nombreSistema)
      }
      
    } else {
      setMessage({ type: 'error', text: result.message || 'Error al guardar' })
    }
    
    setTimeout(() => setMessage(null), 3000)
    setSaving(false)
  }

  if (loading) return <LoadingSpinner />
  if (!configuracion) return <Alert severity="warning">No se pudo cargar la configuración</Alert>

  const logoToShow = logoUrl

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Configuración del Sistema"
        icon={SettingsIcon}
        onAdd={handleSubmit}
        addLabel="Guardar Cambios"
        disableAdd={saving}
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}
        >
          {TABS.map((tab, idx) => (
            <Tab key={idx} icon={tab.icon} label={tab.label} iconPosition="start" />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* ==================== GENERAL ==================== */}
          {tabIndex === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nombre del Sistema"
                  value={formData.nombreSistema || 'GanadoSoft'}
                  onChange={(e) => handleChange('nombreSistema', e.target.value)}
                  fullWidth
                  size="small"
                  helperText="Este nombre aparecerá en el título de la página"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tema</InputLabel>
                  <Select
                    value={formData.tema || 'CLARO'}
                    onChange={(e) => handleChange('tema', e.target.value)}
                    label="Tema"
                  >
                    <MenuItem value="CLARO">Claro</MenuItem>
                    <MenuItem value="OSCURO">Oscuro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Logo del sistema */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Logo del Sistema
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 3, bgcolor: '#f9f9f9' }}>
                  <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                    <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
                      {logoToShow ? (
                        <Box
                          component="img"
                          src={logoToShow}
                          sx={{
                            width: 100,
                            height: 100,
                            objectFit: 'contain',
                            borderRadius: 2,
                            border: '1px solid #ddd',
                            p: 1,
                            bgcolor: 'white'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 100,
                            height: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: '#e0e0e0',
                            borderRadius: 2,
                            mx: 'auto'
                          }}
                        >
                          <SettingsIcon sx={{ fontSize: 48, color: '#999' }} />
                        </Box>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} md={9}>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          component="label"
                          startIcon={<CloudUploadIcon />}
                          disabled={uploading}
                          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
                        >
                          {uploading ? 'Subiendo...' : 'Subir Logo'}
                          <input
                            type="file"
                            hidden
                            accept="image/jpeg,image/png,image/jpg,image/svg+xml,image/webp"
                            onChange={handleLogoUpload}
                            ref={fileInputRef}
                          />
                        </Button>
                        
                        {logoToShow && (
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleRemoveLogo}
                          >
                            Eliminar Logo
                          </Button>
                        )}
                      </Box>
                      
                      {uploading && <LinearProgress sx={{ mt: 2 }} />}
                      
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                        Formatos soportados: PNG, JPG, SVG, WEBP (máx. 2MB)
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  O usa una URL externa:
                </Typography>
                <TextField
                  label="URL del Logo (opcional)"
                  value={formData.logoUrl || ''}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="https://ejemplo.com/logo.png"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Idioma</InputLabel>
                  <Select
                    value={formData.idioma || 'es'}
                    onChange={(e) => handleChange('idioma', e.target.value)}
                    label="Idioma"
                  >
                    <MenuItem value="es">Español</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="pt">Português</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Moneda"
                  value={formData.moneda || 'Bs.'}
                  onChange={(e) => handleChange('moneda', e.target.value)}
                  fullWidth
                  size="small"
                  helperText="Nombre de la moneda (Ej: Bolivianos, Guaraníes)"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Símbolo Moneda"
                  value={formData.simboloMoneda || 'Bs.'}
                  onChange={(e) => handleChange('simboloMoneda', e.target.value)}
                  fullWidth
                  size="small"
                  helperText="Símbolo (Ej: Bs., ₲, $)"
                />
              </Grid>
            </Grid>
          )}

          {/* ==================== SEGURIDAD ==================== */}
          {tabIndex === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Intentos de Login"
                  type="number"
                  value={formData.intentosLogin || 5}
                  onChange={(e) => handleChange('intentosLogin', parseInt(e.target.value))}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Tiempo Bloqueo (min)"
                  type="number"
                  value={formData.tiempoBloqueoMin || 30}
                  onChange={(e) => handleChange('tiempoBloqueoMin', parseInt(e.target.value))}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Expiración JWT (horas)"
                  type="number"
                  value={formData.jwtExpirationHoras || 8}
                  onChange={(e) => handleChange('jwtExpirationHoras', parseInt(e.target.value))}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Refresh Token (días)"
                  type="number"
                  value={formData.jwtRefreshExpirationDias || 7}
                  onChange={(e) => handleChange('jwtRefreshExpirationDias', parseInt(e.target.value))}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={600}>Políticas de Contraseña</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Complejidad</InputLabel>
                  <Select
                    value={formData.complejidadContrasena || 'MEDIA'}
                    onChange={(e) => handleChange('complejidadContrasena', e.target.value)}
                    label="Complejidad"
                  >
                    <MenuItem value="BAJA">Baja - 6 caracteres</MenuItem>
                    <MenuItem value="MEDIA">Media - 8 caracteres, mayúscula, número</MenuItem>
                    <MenuItem value="ALTA">Alta - 10 caracteres, mayúscula, minúscula, número, símbolo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving}
              sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' } }}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}

export default ConfiguracionPage