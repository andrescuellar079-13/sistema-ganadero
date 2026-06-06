// frontend/src/pages/SanidadPage.jsx
import { useState, useMemo } from 'react'
import { useSanidad } from '../hooks/useSanidad'
import LoadingSpinner      from '../components/LoadingSpinner'
import TratamientoForm     from '../components/TratamientoForm'
import DesparasitacionForm from '../components/DesparasitacionForm'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Tabs, Tab, Chip, Card, CardContent, Grid,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Stack, IconButton, Tooltip,
} from '@mui/material'
import HealthAndSafetyOutlinedIcon  from '@mui/icons-material/HealthAndSafetyOutlined'
import MedicalServicesOutlinedIcon  from '@mui/icons-material/MedicalServicesOutlined'
import BugReportOutlinedIcon        from '@mui/icons-material/BugReportOutlined'
import AssignmentOutlinedIcon       from '@mui/icons-material/AssignmentOutlined'
import NoteOutlinedIcon             from '@mui/icons-material/NoteOutlined'
import AddCircleOutlinedIcon        from '@mui/icons-material/AddCircleOutlined'
import SearchIcon                   from '@mui/icons-material/Search'
import ClearIcon                    from '@mui/icons-material/Clear'
import FilterListIcon               from '@mui/icons-material/FilterList'

const KPI = ({ label, value, sub, accent }) => (
  <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderLeft: `4px solid ${accent}`, borderRadius: 2 }}>
    <CardContent sx={{ p: '16px !important' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color: accent, lineHeight: 1.2 }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </CardContent>
  </Card>
)

export default function SanidadPage() {
  const { tratamientos, tratamientosActivos, desparasitaciones, diagnosticos, observaciones, loading } = useSanidad()
  const [tabIdx, setTabIdx] = useState(0)
  
  // Estados para filtros generales
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  
  // Filtros específicos para tratamientos
  const [tratamientoEstadoFilter, setTratamientoEstadoFilter] = useState('todos')
  
  // Filtros específicos para desparasitaciones
  const [desparasitacionTipoFilter, setDesparasitacionTipoFilter] = useState('todos')
  
  // Filtros específicos para diagnósticos
  const [diagnosticoVeterinarioFilter, setDiagnosticoVeterinarioFilter] = useState('')
  
  // Filtros específicos para observaciones
  const [observacionSearchTerm, setObservacionSearchTerm] = useState('')

  // ==========================================
  // FILTROS PARA TRATAMIENTOS
  // ==========================================
  const tratamientosFiltrados = useMemo(() => {
    let filtered = [...tratamientos]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t => 
        t.animal?.nroArete?.toLowerCase().includes(term) ||
        t.animal?.nombre?.toLowerCase().includes(term) ||
        t.diagnostico?.toLowerCase().includes(term)
      )
    }
    
    if (tratamientoEstadoFilter !== 'todos') {
      filtered = filtered.filter(t => 
        tratamientoEstadoFilter === 'activo' ? t.enTratamiento === true : t.enTratamiento === false
      )
    }
    
    if (fechaInicio) {
      filtered = filtered.filter(t => new Date(t.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(t => new Date(t.fecha) <= new Date(fechaFin))
    }
    
    return filtered
  }, [tratamientos, searchTerm, tratamientoEstadoFilter, fechaInicio, fechaFin])

  // ==========================================
  // FILTROS PARA DESPARASITACIONES
  // ==========================================
  const desparasitacionesFiltradas = useMemo(() => {
    let filtered = [...desparasitaciones]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(d => 
        d.animal?.nroArete?.toLowerCase().includes(term) ||
        d.animal?.nombre?.toLowerCase().includes(term) ||
        d.producto?.toLowerCase().includes(term)
      )
    }
    
    if (desparasitacionTipoFilter !== 'todos') {
      filtered = filtered.filter(d => d.tipoParasiticida === desparasitacionTipoFilter)
    }
    
    if (fechaInicio) {
      filtered = filtered.filter(d => new Date(d.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(d => new Date(d.fecha) <= new Date(fechaFin))
    }
    
    return filtered
  }, [desparasitaciones, searchTerm, desparasitacionTipoFilter, fechaInicio, fechaFin])

  // ==========================================
  // FILTROS PARA DIAGNÓSTICOS
  // ==========================================
  const diagnosticosFiltrados = useMemo(() => {
    let filtered = [...diagnosticos]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(d => 
        d.animal?.nroArete?.toLowerCase().includes(term) ||
        d.animal?.nombre?.toLowerCase().includes(term) ||
        d.descripcion?.toLowerCase().includes(term)
      )
    }
    
    if (diagnosticoVeterinarioFilter) {
      const vetTerm = diagnosticoVeterinarioFilter.toLowerCase()
      filtered = filtered.filter(d => 
        d.veterinario?.nombre?.toLowerCase().includes(vetTerm) ||
        d.veterinario?.apellidos?.toLowerCase().includes(vetTerm)
      )
    }
    
    if (fechaInicio) {
      filtered = filtered.filter(d => new Date(d.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(d => new Date(d.fecha) <= new Date(fechaFin))
    }
    
    return filtered
  }, [diagnosticos, searchTerm, diagnosticoVeterinarioFilter, fechaInicio, fechaFin])

  // ==========================================
  // FILTROS PARA OBSERVACIONES
  // ==========================================
  const observacionesFiltradas = useMemo(() => {
    let filtered = [...observaciones]
    
    if (observacionSearchTerm) {
      const term = observacionSearchTerm.toLowerCase()
      filtered = filtered.filter(o => 
        o.animal?.nroArete?.toLowerCase().includes(term) ||
        o.animal?.nombre?.toLowerCase().includes(term) ||
        o.descripcion?.toLowerCase().includes(term)
      )
    }
    
    if (fechaInicio) {
      filtered = filtered.filter(o => new Date(o.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(o => new Date(o.fecha) <= new Date(fechaFin))
    }
    
    return filtered
  }, [observaciones, observacionSearchTerm, fechaInicio, fechaFin])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setTratamientoEstadoFilter('todos')
    setDesparasitacionTipoFilter('todos')
    setDiagnosticoVeterinarioFilter('')
    setObservacionSearchTerm('')
    setFechaInicio('')
    setFechaFin('')
  }

  const TABS = [
    { label: 'Dashboard',       Icon: HealthAndSafetyOutlinedIcon },
    { label: 'Tratamientos',    Icon: MedicalServicesOutlinedIcon,  count: tratamientosFiltrados.length },
    { label: 'Desparasitaciones', Icon: BugReportOutlinedIcon,       count: desparasitacionesFiltradas.length },
    { label: 'Diagnósticos',    Icon: AssignmentOutlinedIcon,        count: diagnosticosFiltrados.length },
    { label: 'Observaciones',   Icon: NoteOutlinedIcon,              count: observacionesFiltradas.length },
    { label: '+ Tratamiento',   Icon: AddCircleOutlinedIcon },
    { label: '+ Desparasitación', Icon: AddCircleOutlinedIcon },
  ]

  if (loading) return <LoadingSpinner />

  const hayFiltrosActivos = searchTerm || tratamientoEstadoFilter !== 'todos' || 
                            desparasitacionTipoFilter !== 'todos' || diagnosticoVeterinarioFilter ||
                            observacionSearchTerm || fechaInicio || fechaFin

  // Mostrar filtros solo en pestañas que tienen tablas
  const mostrarFiltros = [1, 2, 3, 4].includes(tabIdx)

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">Módulo de Sanidad</Typography>
        <Typography variant="body2" color="text.secondary">Tratamientos, desparasitaciones, diagnósticos y observaciones</Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPI label="Tratamientos activos" value={tratamientosActivos.length} accent="#E65100" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPI label="Desparasitaciones" value={desparasitacionesFiltradas.length} accent="#2E7D32" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPI label="Diagnósticos" value={diagnosticosFiltrados.length} accent="#6A1B9A" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPI label="Observaciones" value={observacionesFiltradas.length} accent="#00695C" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPI label="Tratamientos totales" value={tratamientosFiltrados.length} accent="#1565C0" />
        </Grid>
      </Grid>

      {/* Barra de búsqueda y filtros */}
      {mostrarFiltros && (
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Buscar por arete, nombre o diagnóstico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Tooltip title="Filtros avanzados">
                <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              {hayFiltrosActivos && (
                <Chip 
                  label="Limpiar filtros" 
                  size="small" 
                  onClick={limpiarFiltros}
                  onDelete={limpiarFiltros}
                />
              )}
            </Box>
          </Stack>

          {/* Filtros avanzados */}
          {showFilters && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
              {/* Filtro específico para Tratamientos */}
              {tabIdx === 1 && (
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Estado Tratamiento</InputLabel>
                  <Select value={tratamientoEstadoFilter} onChange={(e) => setTratamientoEstadoFilter(e.target.value)} label="Estado Tratamiento">
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="activo">Activos</MenuItem>
                    <MenuItem value="completado">Completados</MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* Filtro específico para Desparasitaciones */}
              {tabIdx === 2 && (
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Tipo Parasiticida</InputLabel>
                  <Select value={desparasitacionTipoFilter} onChange={(e) => setDesparasitacionTipoFilter(e.target.value)} label="Tipo Parasiticida">
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="INTERNO">Interno</MenuItem>
                    <MenuItem value="EXTERNO">Externo</MenuItem>
                    <MenuItem value="AMBOS">Ambos</MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* Filtro específico para Diagnósticos */}
              {tabIdx === 3 && (
                <TextField
                  label="Veterinario"
                  value={diagnosticoVeterinarioFilter}
                  onChange={(e) => setDiagnosticoVeterinarioFilter(e.target.value)}
                  size="small"
                  placeholder="Nombre del veterinario"
                  sx={{ minWidth: 180 }}
                />
              )}

              {/* Filtro específico para Observaciones */}
              {tabIdx === 4 && (
                <TextField
                  label="Buscar en observaciones"
                  value={observacionSearchTerm}
                  onChange={(e) => setObservacionSearchTerm(e.target.value)}
                  size="small"
                  placeholder="Palabra clave..."
                  sx={{ minWidth: 180 }}
                  InputProps={{
                    endAdornment: observacionSearchTerm && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setObservacionSearchTerm('')}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <TextField
                label="Fecha desde"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />

              <TextField
                label="Fecha hasta"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
            </Stack>
          )}

          {/* Indicador de resultados filtrados */}
          {hayFiltrosActivos && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
              {tabIdx === 1 && `${tratamientosFiltrados.length} de ${tratamientos.length} tratamientos encontrados`}
              {tabIdx === 2 && `${desparasitacionesFiltradas.length} de ${desparasitaciones.length} desparasitaciones encontradas`}
              {tabIdx === 3 && `${diagnosticosFiltrados.length} de ${diagnosticos.length} diagnósticos encontrados`}
              {tabIdx === 4 && `${observacionesFiltradas.length} de ${observaciones.length} observaciones encontradas`}
            </Typography>
          )}
        </Paper>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIdx} onChange={(_, v) => setTabIdx(v)} variant="scrollable" scrollButtons="auto">
          {TABS.map(({ label, Icon, count }) => (
            <Tab
              key={label}
              icon={<Icon sx={{ fontSize: 17 }} />}
              iconPosition="start"
              label={count !== undefined ? `${label} (${count})` : label}
              sx={{ minHeight: 48, textTransform: 'none', fontWeight: 500, fontSize: 13 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Dashboard */}
      {tabIdx === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: '#E65100', color: '#fff', px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>Tratamientos Activos</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {tratamientosActivos.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>No hay tratamientos activos</Typography>
                ) : (
                  tratamientosActivos.map(t => (
                    <Box key={t.id} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 1.5, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{t.animal?.nroArete}</Typography>
                        <Typography variant="caption" color="text.secondary">{t.diagnostico?.substring(0, 50)}…</Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="caption" color="text.secondary">{new Date(t.fecha).toLocaleDateString('es-PY')}</Typography>
                        <Chip size="small" label="Activo" sx={{ display: 'block', mt: 0.5, bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 500 }} />
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: '#6A1B9A', color: '#fff', px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>Últimos Diagnósticos</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {diagnosticosFiltrados.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>No hay diagnósticos</Typography>
                ) : (
                  diagnosticosFiltrados.slice(0, 5).map(d => (
                    <Box key={d.id} sx={{ borderBottom: '1px solid #F1F5F9', pb: 1, mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight={600}>{d.animal?.nroArete}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(d.fecha).toLocaleDateString('es-PY')}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{d.descripcion?.substring(0, 80)}…</Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tratamientos con filtros */}
      {tabIdx === 1 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Animal</TableCell>
                  <TableCell>Diagnóstico</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tratamientosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {searchTerm ? 'No hay tratamientos que coincidan con la búsqueda' : 'Sin tratamientos registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  tratamientosFiltrados.map(t => (
                    <TableRow key={t.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{t.animal?.nroArete}</Typography></TableCell>
                      <TableCell>{t.diagnostico?.substring(0, 50)}</TableCell>
                      <TableCell>{new Date(t.fecha).toLocaleDateString('es-PY')}</TableCell>
                      <TableCell>
                        <Chip size="small" label={t.enTratamiento ? 'Activo' : 'Completado'}
                          sx={t.enTratamiento
                            ? { bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 500 }
                            : { bgcolor: '#DCFCE7', color: '#166534', fontWeight: 500 }} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Desparasitaciones con filtros */}
      {tabIdx === 2 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Animal</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Próxima</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {desparasitacionesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {searchTerm ? 'No hay desparasitaciones que coincidan con la búsqueda' : 'Sin desparasitaciones registradas'}
                    </TableCell>
                  </TableRow>
                ) : (
                  desparasitacionesFiltradas.map(d => (
                    <TableRow key={d.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{d.animal?.nroArete}</Typography></TableCell>
                      <TableCell>{d.producto}</TableCell>
                      <TableCell>
                        <Chip size="small" label={
                          d.tipoParasiticida === 'INTERNO' ? 'Interno' :
                          d.tipoParasiticida === 'EXTERNO' ? 'Externo' : 'Ambos'
                        } sx={{ fontSize: 11 }} />
                      </TableCell>
                      <TableCell>{new Date(d.fecha).toLocaleDateString('es-PY')}</TableCell>
                      <TableCell>{d.fechaProxima ? new Date(d.fechaProxima).toLocaleDateString('es-PY') : '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Diagnósticos con filtros */}
      {tabIdx === 3 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Animal</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Veterinario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diagnosticosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {searchTerm ? 'No hay diagnósticos que coincidan con la búsqueda' : 'Sin diagnósticos registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  diagnosticosFiltrados.map(d => (
                    <TableRow key={d.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{d.animal?.nroArete}</Typography></TableCell>
                      <TableCell>{d.descripcion?.substring(0, 60)}</TableCell>
                      <TableCell>{new Date(d.fecha).toLocaleDateString('es-PY')}</TableCell>
                      <TableCell>{[d.veterinario?.nombre, d.veterinario?.apellidos].filter(Boolean).join(' ') || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Observaciones con filtros */}
      {tabIdx === 4 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Animal</TableCell>
                  <TableCell>Observación</TableCell>
                  <TableCell>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {observacionesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {observacionSearchTerm ? 'No hay observaciones que coincidan con la búsqueda' : 'Sin observaciones registradas'}
                    </TableCell>
                  </TableRow>
                ) : (
                  observacionesFiltradas.map(o => (
                    <TableRow key={o.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{o.animal?.nroArete}</Typography></TableCell>
                      <TableCell>{o.descripcion?.substring(0, 80)}</TableCell>
                      <TableCell>{new Date(o.fecha).toLocaleDateString('es-PY')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {tabIdx === 5 && <TratamientoForm     onSuccess={() => setTabIdx(1)} />}
      {tabIdx === 6 && <DesparasitacionForm onSuccess={() => setTabIdx(2)} />}
    </Box>
  )
}