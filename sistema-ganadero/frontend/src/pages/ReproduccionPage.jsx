// frontend/src/pages/ReproduccionPage.jsx
import { useState, useMemo } from 'react'
import { useReproduccion } from '../hooks/useReproduccion'
import LoadingSpinner     from '../components/LoadingSpinner'
import InseminacionForm   from '../components/InseminacionForm'
import PartoForm          from '../components/PartoForm'
import ProximosPartosCard from '../components/ProximosPartosCard'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Tabs, Tab, Chip, Card, CardContent, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Divider,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Stack, Tooltip,
} from '@mui/material'
import ScienceOutlinedIcon       from '@mui/icons-material/ScienceOutlined'
import AssignmentOutlinedIcon    from '@mui/icons-material/AssignmentOutlined'
import ChildCareOutlinedIcon     from '@mui/icons-material/ChildCareOutlined'
import AddCircleOutlinedIcon     from '@mui/icons-material/AddCircleOutlined'
import PetsOutlinedIcon          from '@mui/icons-material/PetsOutlined'
import InfoOutlinedIcon          from '@mui/icons-material/InfoOutlined'
import CloseIcon                 from '@mui/icons-material/Close'
import SearchIcon                from '@mui/icons-material/Search'
import ClearIcon                 from '@mui/icons-material/Clear'
import FilterListIcon            from '@mui/icons-material/FilterList'

const KPI = ({ label, value, accent }) => (
  <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderLeft: `4px solid ${accent}`, borderRadius: 2 }}>
    <CardContent sx={{ p: '16px !important' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color: accent }}>{value}</Typography>
    </CardContent>
  </Card>
)

const TABS = [
  { label: 'Inseminaciones', Icon: ScienceOutlinedIcon },
  { label: 'Diagnósticos',   Icon: AssignmentOutlinedIcon },
  { label: 'Partos',         Icon: ChildCareOutlinedIcon },
  { label: '+ Nueva IA',     Icon: AddCircleOutlinedIcon },
  { label: 'Registrar Parto', Icon: PetsOutlinedIcon },
]

const TIPO_PARTO_LABELS = {
  NORMAL:    { label: 'Normal',    color: '#DCFCE7', text: '#166534' },
  DISTOCICO: { label: 'Distócico', color: '#FEF3C7', text: '#92400E' },
  MULTIPLE:  { label: 'Múltiple', color: '#DBEAFE', text: '#1E40AF' },
  ABORTO:    { label: 'Aborto',    color: '#FEE2E2', text: '#991B1B' },
}

const ESTADO_LABELS = {
  PARIDA:  { label: 'Parida',  color: '#DCFCE7', text: '#166534' },
  ABORTO:  { label: 'Aborto',  color: '#FEE2E2', text: '#991B1B' },
  PRENADA: { label: 'Preñada', color: '#DBEAFE', text: '#1E40AF' },
  SERVIDA: { label: 'Servida', color: '#F3F4F6', text: '#374151' },
  VACIA:   { label: 'Vacía',   color: '#F3F4F6', text: '#374151' },
}

const TipoParto = ({ tipo }) => {
  const cfg = TIPO_PARTO_LABELS[tipo] || { label: tipo, color: '#F3F4F6', text: '#374151' }
  return <Chip size="small" label={cfg.label} sx={{ bgcolor: cfg.color, color: cfg.text, fontWeight: 500 }} />
}

const EstadoParto = ({ estado }) => {
  const cfg = ESTADO_LABELS[estado] || { label: estado, color: '#F3F4F6', text: '#374151' }
  return <Chip size="small" label={cfg.label} sx={{ bgcolor: cfg.color, color: cfg.text, fontWeight: 500 }} />
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-PY') : '—'

// ---------------------------------------------------------------------------
// Diálogo de detalle de un parto
// ---------------------------------------------------------------------------
const PartoDetalle = ({ parto, onClose }) => {
  if (!parto) return null

  const reproductor = parto.inseminacion?.reproductor || parto.monta?.reproductor
  const tipoEvento  = parto.inseminacion ? 'Inseminación Artificial' : parto.monta ? 'Monta Natural' : '—'
  const fechaServicio = parto.inseminacion?.fecha || parto.monta?.fecha || parto.fechaServicio

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>Detalle del Parto</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Row label="Madre"            value={parto.madre ? `${parto.madre.nroArete}${parto.madre.nombre ? ' — ' + parto.madre.nombre : ''}` : '—'} />
          <Row label="Padre (interno)"  value={parto.padre ? `${parto.padre.nroArete}${parto.padre.nombre ? ' — ' + parto.padre.nombre : ''}` : '—'} />
          <Row label="Reproductor"      value={reproductor ? `${reproductor.codigo}${reproductor.nombre ? ' — ' + reproductor.nombre : ''}` : '—'} />
          <Row label="Tipo evento"      value={tipoEvento} />
          <Row label="Fecha servicio"   value={fmt(fechaServicio)} />
          <Divider />
          <Row label="Fecha esperada"   value={fmt(parto.fechaPartoEsperado)} />
          <Row label="Fecha real"       value={fmt(parto.fechaPartoReal)} />
          <Row label="Tipo parto"       value={<TipoParto tipo={parto.tipoParto} />} />
          <Row label="Estado"           value={<EstadoParto estado={parto.estado} />} />
          <Row label="N° crías"         value={parto.numCrias ?? 0} />
          {parto.observaciones && <Row label="Observaciones" value={parto.observaciones} />}

          {parto.crias?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Crías registradas
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {parto.crias.map(cria => (
                  <Box key={cria.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, bgcolor: '#F0FDF4', borderRadius: 1, border: '1px solid #BBF7D0' }}>
                    <Typography sx={{ fontSize: 18 }}>{cria.sexo === 'MACHO' ? '🐂' : '🐄'}</Typography>
                    <Box>
                      <Typography variant="body2" fontWeight={700} fontFamily="monospace">{cria.nroArete}</Typography>
                      {cria.nombre && <Typography variant="caption" color="text.secondary">{cria.nombre}</Typography>}
                      <Typography variant="caption" color="text.secondary" display="block">
                        {cria.sexo} · Nacido: {fmt(cria.fechaNacimiento)} · {cria.origen}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {parto.tipoParto === 'ABORTO' && (
            <Box sx={{ p: 1.5, bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 1 }}>
              <Typography variant="body2" color="error.main">Aborto — sin crías registradas</Typography>
            </Box>
          )}

          {parto.crias?.length === 0 && parto.tipoParto !== 'ABORTO' && (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">Sin cría registrada</Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" size="small">Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

const Row = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 130, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, pt: 0.25 }}>
      {label}
    </Typography>
    {typeof value === 'string' || typeof value === 'number'
      ? <Typography variant="body2">{value}</Typography>
      : value
    }
  </Box>
)

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
export default function ReproduccionPage() {
  const { inseminaciones, diagnosticos, reproducciones, vacasPrenadas, loading } = useReproduccion()
  const [tabIdx, setTabIdx] = useState(0)
  const [detalleParto, setDetalleParto] = useState(null)
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [resultadoFilter, setResultadoFilter] = useState('todos')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [diagnosticoResultadoFilter, setDiagnosticoResultadoFilter] = useState('todos')
  const [tipoPartoFilter, setTipoPartoFilter] = useState('todos')
  const [estadoPartoFilter, setEstadoPartoFilter] = useState('todos')

  // ==========================================
  // FILTROS (useMemo deben estar ANTES del return)
  // ==========================================
  
  const inseminacionesFiltradas = useMemo(() => {
    let filtered = [...inseminaciones]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(ia => 
        ia.hembra?.nroArete?.toLowerCase().includes(term) ||
        ia.hembra?.nombre?.toLowerCase().includes(term) ||
        ia.reproductor?.codigo?.toLowerCase().includes(term) ||
        ia.tecnicoInseminador?.toLowerCase().includes(term) ||
        ia.numeroPajuela?.toLowerCase().includes(term)
      )
    }
    
    if (resultadoFilter !== 'todos') {
      filtered = filtered.filter(ia => ia.resultado === resultadoFilter)
    }
    
    if (fechaInicio) {
      filtered = filtered.filter(ia => new Date(ia.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(ia => new Date(ia.fecha) <= new Date(fechaFin))
    }
    
    return filtered
  }, [inseminaciones, searchTerm, resultadoFilter, fechaInicio, fechaFin])

  const diagnosticosFiltrados = useMemo(() => {
    let filtered = [...diagnosticos]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(d => 
        d.hembra?.nroArete?.toLowerCase().includes(term) ||
        d.hembra?.nombre?.toLowerCase().includes(term) ||
        d.metodo?.toLowerCase().includes(term)
      )
    }
    
    if (diagnosticoResultadoFilter !== 'todos') {
      filtered = filtered.filter(d => d.resultadoPrenez === diagnosticoResultadoFilter)
    }
    
    if (fechaInicio) {
      filtered = filtered.filter(d => new Date(d.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(d => new Date(d.fecha) <= new Date(fechaFin))
    }
    
    return filtered
  }, [diagnosticos, searchTerm, diagnosticoResultadoFilter, fechaInicio, fechaFin])

  const partosFiltrados = useMemo(() => {
    let filtered = [...reproducciones]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.madre?.nroArete?.toLowerCase().includes(term) ||
        p.madre?.nombre?.toLowerCase().includes(term) ||
        p.padre?.nroArete?.toLowerCase().includes(term)
      )
    }
    
    if (tipoPartoFilter !== 'todos') {
      filtered = filtered.filter(p => p.tipoParto === tipoPartoFilter)
    }
    
    if (estadoPartoFilter !== 'todos') {
      filtered = filtered.filter(p => p.estado === estadoPartoFilter)
    }
    
    if (fechaInicio) {
      filtered = filtered.filter(p => new Date(p.fechaPartoReal) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(p => new Date(p.fechaPartoReal) <= new Date(fechaFin))
    }
    
    return filtered
  }, [reproducciones, searchTerm, tipoPartoFilter, estadoPartoFilter, fechaInicio, fechaFin])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setResultadoFilter('todos')
    setDiagnosticoResultadoFilter('todos')
    setTipoPartoFilter('todos')
    setEstadoPartoFilter('todos')
    setFechaInicio('')
    setFechaFin('')
  }

  if (loading) return <LoadingSpinner />

  const tabsWithCount = TABS.map((t, i) => ({
    ...t,
    count: i === 0 ? inseminacionesFiltradas.length
         : i === 1 ? diagnosticosFiltrados.length
         : i === 2 ? partosFiltrados.length
         : undefined,
  }))

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">Módulo de Reproducción</Typography>
        <Typography variant="body2" color="text.secondary">Gestión de inseminaciones, diagnósticos y partos</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}><KPI label="Vacas preñadas"  value={vacasPrenadas.length}  accent="#2E7D32" /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPI label="Inseminaciones"  value={inseminacionesFiltradas.length} accent="#1565C0" /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPI label="Partos este año" value={partosFiltrados.length} accent="#6A1B9A" /></Grid>
        <Grid item xs={12} sm={6} md={3}><ProximosPartosCard /></Grid>
      </Grid>

      {/* Barra de búsqueda y filtros */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Buscar por arete, nombre, reproductor, técnico..."
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
            {(searchTerm || resultadoFilter !== 'todos' || diagnosticoResultadoFilter !== 'todos' || 
              tipoPartoFilter !== 'todos' || estadoPartoFilter !== 'todos' || fechaInicio || fechaFin) && (
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
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Resultado IA</InputLabel>
              <Select value={resultadoFilter} onChange={(e) => setResultadoFilter(e.target.value)} label="Resultado IA">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                <MenuItem value="PREÑEZ">Preñada</MenuItem>
                <MenuItem value="VACIO">Vacía</MenuItem>
                <MenuItem value="ABORTO">Aborto</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Resultado Diagnóstico</InputLabel>
              <Select value={diagnosticoResultadoFilter} onChange={(e) => setDiagnosticoResultadoFilter(e.target.value)} label="Resultado Diagnóstico">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="POSITIVO">Positivo</MenuItem>
                <MenuItem value="NEGATIVO">Negativo</MenuItem>
                <MenuItem value="DUDOSO">Dudoso</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Tipo Parto</InputLabel>
              <Select value={tipoPartoFilter} onChange={(e) => setTipoPartoFilter(e.target.value)} label="Tipo Parto">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="DISTOCICO">Distócico</MenuItem>
                <MenuItem value="MULTIPLE">Múltiple</MenuItem>
                <MenuItem value="ABORTO">Aborto</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Estado Parto</InputLabel>
              <Select value={estadoPartoFilter} onChange={(e) => setEstadoPartoFilter(e.target.value)} label="Estado Parto">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="PARIDA">Parida</MenuItem>
                <MenuItem value="PRENADA">Preñada</MenuItem>
                <MenuItem value="ABORTO">Aborto</MenuItem>
              </Select>
            </FormControl>

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
        {(searchTerm || resultadoFilter !== 'todos' || diagnosticoResultadoFilter !== 'todos' || 
          tipoPartoFilter !== 'todos' || estadoPartoFilter !== 'todos' || fechaInicio || fechaFin) && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            {tabIdx === 0 && `${inseminacionesFiltradas.length} de ${inseminaciones.length} inseminaciones encontradas`}
            {tabIdx === 1 && `${diagnosticosFiltrados.length} de ${diagnosticos.length} diagnósticos encontrados`}
            {tabIdx === 2 && `${partosFiltrados.length} de ${reproducciones.length} partos encontrados`}
          </Typography>
        )}
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIdx} onChange={(_, v) => setTabIdx(v)} variant="scrollable" scrollButtons="auto">
          {tabsWithCount.map(({ label, Icon, count }) => (
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

      {/* Tab 0: Inseminaciones */}
      {tabIdx === 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Hembra</TableCell>
                  <TableCell>Reproductor</TableCell>
                  <TableCell>N° Pajuela</TableCell>
                  <TableCell>Técnico</TableCell>
                  <TableCell>Resultado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inseminacionesFiltradas.map(ia => (
                  <TableRow key={ia.id} hover>
                    <TableCell>{fmt(ia.fecha)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{ia.hembra?.nroArete}</Typography>
                      <Typography variant="caption" color="text.secondary">{ia.hembra?.nombre || ''}</Typography>
                    </TableCell>
                    <TableCell>{ia.reproductor?.codigo || '—'}</TableCell>
                    <TableCell>{ia.numeroPajuela || '—'}</TableCell>
                    <TableCell>{ia.tecnicoInseminador || '—'}</TableCell>
                    <TableCell>
                      {ia.resultado && ia.resultado !== 'PENDIENTE'
                        ? <Chip size="small" label={ia.resultado} sx={{ fontSize: 11 }} />
                        : <Typography variant="caption" color="text.disabled">Pendiente</Typography>
                      }
                    </TableCell>
                  </TableRow>
                ))}
                {inseminacionesFiltradas.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    {searchTerm ? 'No hay inseminaciones que coincidan con la búsqueda' : 'Sin inseminaciones registradas'}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Tab 1: Diagnósticos */}
      {tabIdx === 1 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Hembra</TableCell>
                  <TableCell>Resultado</TableCell>
                  <TableCell>Días gestación</TableCell>
                  <TableCell>Método</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diagnosticosFiltrados.map(d => (
                  <TableRow key={d.id} hover>
                    <TableCell>{fmt(d.fecha)}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{d.hembra?.nroArete}</Typography></TableCell>
                    <TableCell>
                      <Chip size="small" label={d.resultadoPrenez}
                        sx={d.resultadoPrenez === 'POSITIVO'
                          ? { bgcolor: '#DCFCE7', color: '#166534', fontWeight: 500 }
                          : { bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 500 }} />
                    </TableCell>
                    <TableCell>{d.diasGestacion || '—'}</TableCell>
                    <TableCell>{d.metodo || '—'}</TableCell>
                  </TableRow>
                ))}
                {diagnosticosFiltrados.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    {searchTerm ? 'No hay diagnósticos que coincidan con la búsqueda' : 'Sin diagnósticos registrados'}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Tab 2: Partos */}
      {tabIdx === 2 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha parto</TableCell>
                  <TableCell>Madre</TableCell>
                  <TableCell>Padre / Reproductor</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>N° crías</TableCell>
                  <TableCell>Crías</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {partosFiltrados.map(r => {
                  const reproductor = r.inseminacion?.reproductor || r.monta?.reproductor
                  const padreMostrar = r.padre
                    ? `${r.padre.nroArete}${r.padre.nombre ? ' — ' + r.padre.nombre : ''}`
                    : reproductor
                      ? `${reproductor.codigo}${reproductor.nombre ? ' — ' + reproductor.nombre : ''}`
                      : '—'

                  let criasMostrar
                  if (r.tipoParto === 'ABORTO') {
                    criasMostrar = <Typography variant="caption" color="error.main">Aborto — sin cría</Typography>
                  } else if (!r.crias || r.crias.length === 0) {
                    criasMostrar = <Typography variant="caption" color="text.disabled">Sin cría registrada</Typography>
                  } else {
                    criasMostrar = (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        {r.crias.map(c => (
                          <Typography key={c.id} variant="caption" fontFamily="monospace">
                            {c.sexo === 'MACHO' ? '🐂' : '🐄'} {c.nroArete}{c.nombre ? ` — ${c.nombre}` : ''}
                          </Typography>
                        ))}
                      </Box>
                    )
                  }

                  return (
                    <TableRow key={r.id} hover>
                      <TableCell>{fmt(r.fechaPartoReal)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{r.madre?.nroArete || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.madre?.nombre || ''}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{padreMostrar}</Typography>
                      </TableCell>
                      <TableCell><TipoParto tipo={r.tipoParto} /></TableCell>
                      <TableCell align="center">{r.numCrias ?? 0}</TableCell>
                      <TableCell>{criasMostrar}</TableCell>
                      <TableCell><EstadoParto estado={r.estado} /></TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          title="Ver detalle"
                          onClick={() => setDetalleParto(r)}
                          sx={{ color: 'primary.main' }}
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {partosFiltrados.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    {searchTerm ? 'No hay partos que coincidan con la búsqueda' : 'Sin partos registrados'}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Tab 3: Nueva IA */}
      {tabIdx === 3 && <InseminacionForm onSuccess={() => setTabIdx(0)} />}

      {/* Tab 4: Registrar Parto */}
      {tabIdx === 4 && <PartoForm onSuccess={() => setTabIdx(2)} />}

      {/* Diálogo detalle parto */}
      {detalleParto && (
        <PartoDetalle parto={detalleParto} onClose={() => setDetalleParto(null)} />
      )}
    </Box>
  )
}