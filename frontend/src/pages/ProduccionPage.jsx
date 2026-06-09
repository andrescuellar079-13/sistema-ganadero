// frontend/src/pages/ProduccionPage.jsx
import { useState, useMemo } from 'react'
import { useProduccion } from '../hooks/useProduccion'
import LoadingSpinner      from '../components/LoadingSpinner'
import LactanciaForm       from '../components/LactanciaForm'
import ProduccionLecheForm from '../components/ProduccionLecheForm'
import RegistroPesoForm    from '../components/RegistroPesoForm'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Tabs, Tab, Chip, Card, CardContent, Grid,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Stack, IconButton, Tooltip, Button,
} from '@mui/material'
import LocalDrinkOutlinedIcon    from '@mui/icons-material/LocalDrinkOutlined'
import PetsOutlinedIcon          from '@mui/icons-material/PetsOutlined'
import BarChartOutlinedIcon      from '@mui/icons-material/BarChartOutlined'
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined'
import RestaurantOutlinedIcon    from '@mui/icons-material/RestaurantOutlined'
import AddCircleOutlinedIcon     from '@mui/icons-material/AddCircleOutlined'
import EmojiEventsOutlinedIcon   from '@mui/icons-material/EmojiEventsOutlined'
import SearchIcon                from '@mui/icons-material/Search'
import ClearIcon                 from '@mui/icons-material/Clear'
import FilterListIcon            from '@mui/icons-material/FilterList'

// Convierte cualquier valor a número seguro (evita NaN en los indicadores)
const safeNum = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const KPI = ({ label, value, sub, accent }) => (
  <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderLeft: `4px solid ${accent}`, borderRadius: 2, height: '100%' }}>
    <CardContent sx={{ p: '16px !important' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color: accent, lineHeight: 1.2 }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </CardContent>
  </Card>
)

// Pestañas del módulo de Producción Ganadera
const TAB_DASHBOARD = 0
const TAB_LECHE     = 1
const TAB_CARNE     = 2
const TAB_PESO      = 3
const TAB_LACTANCIAS = 4

const TABS = [
  { label: 'Dashboard',        Icon: BarChartOutlinedIcon },
  { label: 'Leche',            Icon: LocalDrinkOutlinedIcon },
  { label: 'Carne / Engorde',  Icon: RestaurantOutlinedIcon },
  { label: 'Registro Peso',    Icon: FitnessCenterOutlinedIcon },
  { label: 'Lactancias',       Icon: PetsOutlinedIcon },
]

const esCarne = (a) => a.tipoProduccion === 'CARNE' || a.tipoProduccion === 'DOBLE_PROPOSITO'
const esLeche = (a) => a.tipoProduccion === 'LECHE' || a.tipoProduccion === 'DOBLE_PROPOSITO'

const ultimaFechaPesaje = (a) => {
  if (!a.registrosPeso || a.registrosPeso.length === 0) return null
  // El backend ya entrega los registros ordenados por fecha descendente
  return a.registrosPeso[0]?.fechaPesaje || null
}

const TIPO_LABEL = {
  CARNE: 'Carne',
  LECHE: 'Leche',
  DOBLE_PROPOSITO: 'Doble propósito',
}

// Tabla reutilizable de animales para las secciones Leche y Carne / Engorde
const AnimalesTable = ({ animales, emptyMsg }) => (
  <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Arete</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Sexo</TableCell>
            <TableCell>Raza</TableCell>
            <TableCell>Categoría</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Peso actual</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Último pesaje</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {animales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                {emptyMsg}
              </TableCell>
            </TableRow>
          ) : (
            animales.map(a => {
              const fecha = ultimaFechaPesaje(a)
              return (
                <TableRow key={a.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{a.nroArete}</Typography></TableCell>
                  <TableCell>{a.nombre || '—'}</TableCell>
                  <TableCell>{a.sexo === 'MACHO' ? 'Macho' : 'Hembra'}</TableCell>
                  <TableCell>{a.raza?.nombre || '—'}</TableCell>
                  <TableCell>{a.categoria?.nombre || '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={TIPO_LABEL[a.tipoProduccion] || a.tipoProduccion}
                      sx={{ bgcolor: '#EEF2FF', color: '#3730A3', fontWeight: 500 }} />
                  </TableCell>
                  <TableCell>{safeNum(a.peso).toFixed(1)} kg</TableCell>
                  <TableCell>
                    <Chip size="small" label={a.estado}
                      sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 500 }} />
                  </TableCell>
                  <TableCell>
                    {fecha ? new Date(fecha).toLocaleDateString('es-PY') : 'Sin pesaje'}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </Box>
  </Paper>
)

export default function ProduccionPage() {
  const {
    lactancias, produccionesHoy, produccionTotalHoy, top5Vacas,
    animalesProduccion, loading,
  } = useProduccion()
  const [tabIdx, setTabIdx] = useState(TAB_DASHBOARD)
  const [mostrarNuevaLactancia, setMostrarNuevaLactancia] = useState(false)

  // Estados para filtros (sección Lactancias)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [rangoDiasMin, setRangoDiasMin] = useState('')
  const [rangoDiasMax, setRangoDiasMax] = useState('')
  const [produccionMin, setProduccionMin] = useState('')
  const [produccionMax, setProduccionMax] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // ==========================================
  // FILTROS PARA LACTANCIAS (useMemo debe estar ANTES del return)
  // ==========================================
  const lactanciasFiltradas = useMemo(() => {
    let filtered = [...lactancias]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(l =>
        l.vaca?.nroArete?.toLowerCase().includes(term) ||
        l.vaca?.nombre?.toLowerCase().includes(term)
      )
    }

    if (estadoFilter !== 'todos') {
      filtered = filtered.filter(l => l.estado === estadoFilter)
    }

    if (rangoDiasMin) {
      filtered = filtered.filter(l => (l.diasProduccion || 0) >= parseInt(rangoDiasMin))
    }
    if (rangoDiasMax) {
      filtered = filtered.filter(l => (l.diasProduccion || 0) <= parseInt(rangoDiasMax))
    }

    if (produccionMin) {
      filtered = filtered.filter(l => (l.promedioDiario || 0) >= parseFloat(produccionMin))
    }
    if (produccionMax) {
      filtered = filtered.filter(l => (l.promedioDiario || 0) <= parseFloat(produccionMax))
    }

    if (fechaInicio) {
      filtered = filtered.filter(l => new Date(l.fechaInicio) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(l => new Date(l.fechaInicio) <= new Date(fechaFin))
    }

    return filtered
  }, [lactancias, searchTerm, estadoFilter, rangoDiasMin, rangoDiasMax, produccionMin, produccionMax, fechaInicio, fechaFin])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setEstadoFilter('todos')
    setRangoDiasMin('')
    setRangoDiasMax('')
    setProduccionMin('')
    setProduccionMax('')
    setFechaInicio('')
    setFechaFin('')
  }

  if (loading) return <LoadingSpinner />

  // ==========================================
  // MÉTRICAS DEL DASHBOARD (con valores seguros, sin NaN)
  // ==========================================
  const lactanciasActivas = lactancias.filter(l => l.estado === 'ACTIVA')
  const totalLactancias = lactancias.length

  // Promedio por vaca: media de la producción diaria de las lactancias activas.
  // Si no hay lactancias activas (divisor 0) → 0, nunca NaN.
  const promedio = (
    lactanciasActivas.length > 0
      ? lactanciasActivas.reduce((s, l) => s + safeNum(l.promedioDiario), 0) / lactanciasActivas.length
      : 0
  )
  const promedioTexto = safeNum(promedio).toFixed(1)

  // Animales (ya vienen sólo activos desde el backend)
  const animalesCarne = animalesProduccion.filter(esCarne)
  const animalesLeche = animalesProduccion.filter(esLeche)
  const animalesEnEngorde = animalesCarne.length
  const animalesSinPesaje = animalesProduccion.filter(
    a => !a.registrosPeso || a.registrosPeso.length === 0
  ).length

  const tabsWithCount = TABS.map((t, i) => ({
    ...t,
    count: i === TAB_LACTANCIAS ? lactanciasFiltradas.length : undefined,
  }))

  const hayFiltrosActivos = searchTerm || estadoFilter !== 'todos' || rangoDiasMin || rangoDiasMax ||
                            produccionMin || produccionMax || fechaInicio || fechaFin

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>Módulo de Producción Ganadera</Typography>
        <Typography variant="body2" color="text.secondary">
          Gestión de leche, carne, pesajes, lactancias y rendimiento animal
        </Typography>
      </Box>

      {/* Indicadores del Dashboard */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPI label="Producción leche hoy" value={`${safeNum(produccionTotalHoy)} L`} sub={`${produccionesHoy.length} registros`} accent="#1565C0" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPI label="Lactancias activas" value={lactanciasActivas.length} accent="#2E7D32" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPI label="Total lactancias" value={totalLactancias} accent="#6A1B9A" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPI label="Promedio por vaca" value={`${promedioTexto} L/día`} accent="#E65100" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPI label="Animales en engorde" value={animalesEnEngorde} accent="#B45309" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPI label="Animales sin pesaje" value={animalesSinPesaje} accent="#64748B" />
        </Grid>
      </Grid>

      {/* Barra de búsqueda y filtros - solo visible en la pestaña de Lactancias */}
      {tabIdx === TAB_LACTANCIAS && (
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Buscar por arete o nombre de la vaca..."
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

          {showFilters && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Estado</InputLabel>
                <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} label="Estado">
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="ACTIVA">Activa</MenuItem>
                  <MenuItem value="SECADA">Secada</MenuItem>
                  <MenuItem value="FINALIZADA">Finalizada</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Días mínimos"
                type="number"
                value={rangoDiasMin}
                onChange={(e) => setRangoDiasMin(e.target.value)}
                size="small"
                placeholder="Mínimo días"
                sx={{ width: 120 }}
                InputProps={{ inputProps: { min: 0 } }}
              />

              <TextField
                label="Días máximos"
                type="number"
                value={rangoDiasMax}
                onChange={(e) => setRangoDiasMax(e.target.value)}
                size="small"
                placeholder="Máximo días"
                sx={{ width: 120 }}
                InputProps={{ inputProps: { min: 0 } }}
              />

              <TextField
                label="Producción mín. (L/día)"
                type="number"
                step="0.1"
                value={produccionMin}
                onChange={(e) => setProduccionMin(e.target.value)}
                size="small"
                sx={{ width: 150 }}
              />

              <TextField
                label="Producción máx. (L/día)"
                type="number"
                step="0.1"
                value={produccionMax}
                onChange={(e) => setProduccionMax(e.target.value)}
                size="small"
                sx={{ width: 150 }}
              />

              <TextField
                label="Fecha inicio desde"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />

              <TextField
                label="Fecha inicio hasta"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
            </Stack>
          )}

          {hayFiltrosActivos && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
              {lactanciasFiltradas.length} de {lactancias.length} lactancias encontradas
            </Typography>
          )}
        </Paper>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIdx} onChange={(_, v) => setTabIdx(v)} variant="scrollable" scrollButtons="auto">
          {tabsWithCount.map(({ label, Icon, count }) => (
            <Tab key={label} icon={<Icon sx={{ fontSize: 17 }} />} iconPosition="start"
              label={count !== undefined ? `${label} (${count})` : label}
              sx={{ minHeight: 48, textTransform: 'none', fontWeight: 500, fontSize: 13 }} />
          ))}
        </Tabs>
      </Box>

      {/* ===================== Dashboard ===================== */}
      {tabIdx === TAB_DASHBOARD && (
        <Grid container spacing={2}>
          {top5Vacas && top5Vacas.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <EmojiEventsOutlinedIcon sx={{ color: '#E65100', fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={700}>Top 5 Vacas — Producción Hoy</Typography>
                </Box>
                {top5Vacas.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', py: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#E65100', width: 24 }}>#{idx + 1}</Typography>
                      <Typography variant="body2">{item.vaca?.nroArete} — {item.vaca?.nombre || 'Sin nombre'}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color="primary">{item.litros} L</Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          )}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: '#1565C0', color: '#fff', px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>Lactancias Activas</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {lactanciasActivas.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>No hay lactancias activas</Typography>
                ) : lactanciasActivas.map(l => (
                  <Box key={l.id} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 1.5, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{l.vaca?.nroArete}</Typography>
                      <Typography variant="caption" color="text.secondary">Lactancia #{l.numeroLactancia}</Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary">Inicio: {new Date(l.fechaInicio).toLocaleDateString('es-PY')}</Typography>
                      <Typography variant="body2" fontWeight={700} color="primary" display="block">
                        {safeNum(l.promedioDiario).toFixed(1)} L/día
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: '#1565C0', color: '#fff', px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>Producción de Hoy</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {produccionesHoy.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>No hay registros hoy</Typography>
                ) : produccionesHoy.map(p => (
                  <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', py: 0.75 }}>
                    <Typography variant="body2" fontWeight={600}>{p.vaca?.nroArete}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.turno}</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary">{p.litros} L</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ===================== Leche ===================== */}
      {tabIdx === TAB_LECHE && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <ProduccionLecheForm onSuccess={() => setTabIdx(TAB_DASHBOARD)} />
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
              Animales de leche
            </Typography>
            <AnimalesTable
              animales={animalesLeche}
              emptyMsg="No hay animales de leche registrados."
            />
          </Box>
        </Box>
      )}

      {/* ===================== Carne / Engorde ===================== */}
      {tabIdx === TAB_CARNE && (
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Animales de carne y engorde
          </Typography>
          <AnimalesTable
            animales={animalesCarne}
            emptyMsg="No hay animales de carne o engorde registrados."
          />
        </Box>
      )}

      {/* ===================== Registro Peso ===================== */}
      {tabIdx === TAB_PESO && <RegistroPesoForm onSuccess={() => setTabIdx(TAB_DASHBOARD)} />}

      {/* ===================== Lactancias ===================== */}
      {tabIdx === TAB_LACTANCIAS && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant={mostrarNuevaLactancia ? 'outlined' : 'contained'}
              startIcon={<AddCircleOutlinedIcon />}
              onClick={() => setMostrarNuevaLactancia(v => !v)}
              sx={{ textTransform: 'none' }}
            >
              {mostrarNuevaLactancia ? 'Cerrar' : 'Nueva Lactancia'}
            </Button>
          </Box>

          {mostrarNuevaLactancia && (
            <LactanciaForm onSuccess={() => setMostrarNuevaLactancia(false)} />
          )}

          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vaca</TableCell>
                    <TableCell>N° Lactancia</TableCell>
                    <TableCell>Fecha inicio</TableCell>
                    <TableCell>Días</TableCell>
                    <TableCell>Total litros</TableCell>
                    <TableCell>Promedio</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lactanciasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        {searchTerm || hayFiltrosActivos
                          ? 'No hay lactancias que coincidan con la búsqueda'
                          : 'Sin lactancias registradas'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    lactanciasFiltradas.map(l => (
                      <TableRow key={l.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{l.vaca?.nroArete}</Typography>
                          <Typography variant="caption" color="text.secondary">{l.vaca?.nombre || ''}</Typography>
                        </TableCell>
                        <TableCell>{l.numeroLactancia}</TableCell>
                        <TableCell>{new Date(l.fechaInicio).toLocaleDateString('es-PY')}</TableCell>
                        <TableCell>{l.diasProduccion || 0}</TableCell>
                        <TableCell>{safeNum(l.totalLitros).toFixed(1)} L</TableCell>
                        <TableCell>{safeNum(l.promedioDiario).toFixed(1)} L/día</TableCell>
                        <TableCell>
                          <Chip size="small" label={l.estado}
                            sx={l.estado === 'ACTIVA'
                              ? { bgcolor: '#DCFCE7', color: '#166534', fontWeight: 500 }
                              : l.estado === 'SECADA'
                              ? { bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 500 }
                              : { bgcolor: '#F1F5F9', color: '#475569', fontWeight: 500 }} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  )
}
