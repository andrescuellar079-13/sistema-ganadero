import { useState, useEffect } from 'react'
import { useLazyQuery } from '@apollo/client'
import { EXPORTAR_ANIMALES } from '../graphql/animales'
import { generarReporteAnimalesPDF, generarReporteAnimalesExcel } from '../services/reportesService'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox, Grid, Typography, Box,
  Divider, CircularProgress, Alert, ToggleButton,
  ToggleButtonGroup, TextField, FormGroup, Paper,
} from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'
import FilterListIcon from '@mui/icons-material/FilterList'

// ───────── Definición de columnas ─────────

const COLS_BASE = [
  { key: 'nroArete',        label: 'Arete' },
  { key: 'nombre',          label: 'Nombre' },
  { key: 'sexo',            label: 'Sexo' },
  { key: 'razaNombre',      label: 'Raza' },
  { key: 'categoriaNombre', label: 'Categoría' },
  { key: 'peso',            label: 'Peso actual (kg)' },
  { key: 'fechaNacimiento', label: 'Fecha nacimiento' },
  { key: 'edadMeses',       label: 'Edad (meses)' },
  { key: 'tipoProduccion',  label: 'Tipo producción' },
  { key: 'origen',          label: 'Origen' },
  { key: 'estado',          label: 'Estado' },
  { key: 'parcelaActual',   label: 'Parcela actual' },
  { key: 'fechaIngreso',    label: 'Fecha ingreso' },
  { key: 'padreArete',      label: 'Padre (arete)' },
  { key: 'madreArete',      label: 'Madre (arete)' },
  { key: 'observaciones',   label: 'Observaciones' },
]

const COLS_VENDIDOS = [
  { key: 'fechaVenta',     label: 'Fecha venta' },
  { key: 'clienteNombre',  label: 'Cliente' },
  { key: 'pesoVenta',      label: 'Peso venta (kg)' },
  { key: 'precioUnitario', label: 'Precio unitario' },
  { key: 'subTotal',       label: 'Subtotal' },
  { key: 'guiaSalida',     label: 'Guía de salida' },
]

const COLS_BAJAS = [
  { key: 'fechaBaja',        label: 'Fecha baja' },
  { key: 'tipoBaja',         label: 'Tipo baja' },
  { key: 'causaBaja',        label: 'Causa' },
  { key: 'pesoEstimadoBaja', label: 'Peso estimado (kg)' },
  { key: 'descripcionBaja',  label: 'Descripción' },
]

const COLS_BASICAS_DEFAULT = ['nroArete', 'nombre', 'sexo', 'razaNombre', 'categoriaNombre', 'peso', 'estado', 'tipoProduccion']

const TIPOS_REPORTE = [
  { value: 'INVENTARIO',        label: 'Inventario de animales' },
  { value: 'ACTIVOS',           label: 'Animales activos' },
  { value: 'VENDIDOS',          label: 'Animales vendidos' },
  { value: 'MUERTOS',           label: 'Animales muertos' },
  { value: 'BAJAS',             label: 'Animales dados de baja' },
  { value: 'POR_CATEGORIA',     label: 'Animales por categoría' },
  { value: 'POR_PARCELA',       label: 'Animales por parcela' },
  { value: 'POR_RAZA',          label: 'Animales por raza' },
  { value: 'POR_SEXO',          label: 'Animales por sexo' },
  { value: 'POR_TIPO_PRODUCCION', label: 'Animales por tipo de producción' },
]

const LIMITES = [
  { value: 100,   label: 'Primeros 100' },
  { value: 500,   label: 'Primeros 500' },
  { value: 1000,  label: 'Primeros 1000' },
  { value: 5000,  label: 'Todos los resultados filtrados' },
]

function esVendidos(tipo) { return tipo === 'VENDIDOS' }
function esBajas(tipo)    { return tipo === 'MUERTOS' || tipo === 'BAJAS' }

function colsDisponibles(tipoReporte) {
  if (esVendidos(tipoReporte)) return [...COLS_BASE, ...COLS_VENDIDOS]
  if (esBajas(tipoReporte))    return [...COLS_BASE, ...COLS_BAJAS]
  return COLS_BASE
}

function colsDefaultParaTipo(tipoReporte) {
  const base = [...COLS_BASICAS_DEFAULT]
  if (esVendidos(tipoReporte)) return [...base, 'fechaVenta', 'clienteNombre', 'pesoVenta', 'subTotal']
  if (esBajas(tipoReporte))    return [...base, 'fechaBaja', 'tipoBaja', 'causaBaja']
  return base
}

// ───────── Componente principal ─────────

export default function ExportarAnimalesModal({
  open,
  onClose,
  formatoPredefinido = 'PDF',
  fincaId,
  fincaNombre = 'Finca',
  razas = [],
  categorias = [],
  parcelas = [],
  filtrosActuales = {},
}) {
  const [tipoReporte, setTipoReporte]   = useState('INVENTARIO')
  const [formato, setFormato]           = useState(formatoPredefinido)
  const [limite, setLimite]             = useState(500)
  const [columnas, setColumnas]         = useState(COLS_BASICAS_DEFAULT)
  const [usarFiltrosActuales, setUsarFiltrosActuales] = useState(false)
  const [error, setError]               = useState('')
  const [exito, setExito]               = useState('')

  // Filtros del modal
  const [estado, setEstado]                       = useState('')
  const [sexo, setSexo]                           = useState('')
  const [razaId, setRazaId]                       = useState('')
  const [categoriaId, setCategoriaId]             = useState('')
  const [tipoProduccion, setTipoProduccion]       = useState('')
  const [origen, setOrigen]                       = useState('')
  const [parcelaId, setParcelaId]                 = useState('')
  const [fechaNacDesde, setFechaNacDesde]         = useState('')
  const [fechaNacHasta, setFechaNacHasta]         = useState('')
  const [fechaIngDesde, setFechaIngDesde]         = useState('')
  const [fechaIngHasta, setFechaIngHasta]         = useState('')
  const [fechaVentaDesde, setFechaVentaDesde]     = useState('')
  const [fechaVentaHasta, setFechaVentaHasta]     = useState('')
  const [fechaBajaDesde, setFechaBajaDesde]       = useState('')
  const [fechaBajaHasta, setFechaBajaHasta]       = useState('')

  const [ejecutarExportar, { loading }] = useLazyQuery(EXPORTAR_ANIMALES, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const result = data?.exportarAnimales
      if (!result || result.total === 0) {
        setError(result?.mensaje || 'No existen datos para los filtros seleccionados.')
        return
      }
      const cfg = { titulo: TIPOS_REPORTE.find(t => t.value === tipoReporte)?.label || 'Reporte', finca: fincaNombre }
      try {
        if (formato === 'PDF') generarReporteAnimalesPDF(result.items, columnas, cfg)
        else                   generarReporteAnimalesExcel(result.items, columnas, cfg)
        setExito(`Archivo generado con ${result.total} registros.`)
        setTimeout(() => { setExito(''); onClose() }, 1500)
      } catch (e) {
        setError(`Error al generar el archivo: ${e.message}`)
      }
    },
    onError: (err) => setError(`Error al consultar: ${err.message}`),
  })

  // Sincronizar formato cuando cambia la prop externa
  useEffect(() => { setFormato(formatoPredefinido) }, [formatoPredefinido])

  // Resetear columnas cuando cambia tipo de reporte
  useEffect(() => {
    setColumnas(colsDefaultParaTipo(tipoReporte))
    setError('')
    setExito('')
  }, [tipoReporte])

  // Copiar filtros actuales de la tabla cuando el usuario lo pide
  useEffect(() => {
    if (usarFiltrosActuales && filtrosActuales) {
      setEstado(filtrosActuales.estado || '')
      setSexo(filtrosActuales.sexo || '')
      setRazaId(filtrosActuales.razaId || '')
      setCategoriaId(filtrosActuales.categoriaId || '')
      setTipoProduccion(filtrosActuales.tipoProduccion || '')
      setOrigen(filtrosActuales.origen || '')
      setFechaNacDesde(filtrosActuales.fechaNacimientoDesde || '')
      setFechaNacHasta(filtrosActuales.fechaNacimientoHasta || '')
      setFechaIngDesde(filtrosActuales.fechaIngresoDesde || '')
      setFechaIngHasta(filtrosActuales.fechaIngresoHasta || '')
    }
  }, [usarFiltrosActuales])

  const disponibles = colsDisponibles(tipoReporte)
  const todasMarcadas = columnas.length === disponibles.length
  const ningunoMarcado = columnas.length === 0

  function toggleCol(key) {
    setColumnas(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }
  function selTodas()   { setColumnas(disponibles.map(c => c.key)) }
  function limpiarCols(){ setColumnas([]) }
  function colsBasicas(){ setColumnas(COLS_BASICAS_DEFAULT) }

  function validar() {
    if (!tipoReporte) return 'Seleccioná un tipo de reporte.'
    if (columnas.length === 0) return 'Seleccioná al menos una columna.'
    if (fechaNacDesde && fechaNacHasta && fechaNacDesde > fechaNacHasta)
      return 'La fecha de nacimiento "desde" no puede ser mayor que "hasta".'
    if (fechaIngDesde && fechaIngHasta && fechaIngDesde > fechaIngHasta)
      return 'La fecha de ingreso "desde" no puede ser mayor que "hasta".'
    if (fechaVentaDesde && fechaVentaHasta && fechaVentaDesde > fechaVentaHasta)
      return 'La fecha de venta "desde" no puede ser mayor que "hasta".'
    if (fechaBajaDesde && fechaBajaHasta && fechaBajaDesde > fechaBajaHasta)
      return 'La fecha de baja "desde" no puede ser mayor que "hasta".'
    if (columnas.length > 12 && formato === 'PDF')
      setExito('') // solo aviso, no bloquea
    return ''
  }

  function handleGenerar() {
    setError('')
    setExito('')
    const err = validar()
    if (err) { setError(err); return }

    ejecutarExportar({
      variables: {
        fincaId,
        tipoReporte,
        estado: estado || null,
        sexo: sexo || null,
        razaId: razaId || null,
        categoriaId: categoriaId || null,
        tipoProduccion: tipoProduccion || null,
        origen: origen || null,
        parcelaId: parcelaId || null,
        fechaNacimientoDesde: fechaNacDesde || null,
        fechaNacimientoHasta: fechaNacHasta || null,
        fechaIngresoDesde: fechaIngDesde || null,
        fechaIngresoHasta: fechaIngHasta || null,
        fechaVentaDesde: esVendidos(tipoReporte) ? (fechaVentaDesde || null) : null,
        fechaVentaHasta: esVendidos(tipoReporte) ? (fechaVentaHasta || null) : null,
        fechaBajaDesde: esBajas(tipoReporte) ? (fechaBajaDesde || null) : null,
        fechaBajaHasta: esBajas(tipoReporte) ? (fechaBajaHasta || null) : null,
        limite,
        orden: 'arete_az',
      },
    })
  }

  function handleClose() {
    if (!loading) onClose()
  }

  const tieneFiltrosActivos = Object.values(filtrosActuales).some(v => v != null && v !== '')

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper"
      PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FilterListIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>Exportar reporte de animales</Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2 }}>
        {error  && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {exito  && <Alert severity="success" sx={{ mb: 2 }}>{exito}</Alert>}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CircularProgress size={22} />
            <Typography variant="body2" color="text.secondary">Generando reporte...</Typography>
          </Box>
        )}

        <Grid container spacing={2}>
          {/* ── Tipo de reporte ── */}
          <Grid item xs={12} sm={7}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de reporte *</InputLabel>
              <Select value={tipoReporte} onChange={e => setTipoReporte(e.target.value)} label="Tipo de reporte *">
                {TIPOS_REPORTE.map(t => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* ── Formato ── */}
          <Grid item xs={12} sm={5}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Formato *
              </Typography>
              <ToggleButtonGroup
                value={formato}
                exclusive
                onChange={(_, v) => v && setFormato(v)}
                size="small"
                sx={{ height: 40 }}
              >
                <ToggleButton value="PDF" sx={{ px: 2, gap: 0.5 }}>
                  <PictureAsPdfIcon fontSize="small" sx={{ color: '#D32F2F' }} />
                  PDF
                </ToggleButton>
                <ToggleButton value="EXCEL" sx={{ px: 2, gap: 0.5 }}>
                  <TableChartIcon fontSize="small" sx={{ color: '#2E7D32' }} />
                  Excel
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>

          {/* ── Cantidad ── */}
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Cantidad de registros</InputLabel>
              <Select value={limite} onChange={e => setLimite(e.target.value)} label="Cantidad de registros">
                {LIMITES.map(l => (
                  <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* ── Usar filtros actuales ── */}
          {tieneFiltrosActivos && (
            <Grid item xs={12} sm={7}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={usarFiltrosActuales}
                    onChange={e => setUsarFiltrosActuales(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    Usar filtros actuales de la tabla
                  </Typography>
                }
              />
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* ── Filtros ── */}
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Filtros
        </Typography>
        <Grid container spacing={1.5}>
          {/* Estado (no visible para VENDIDOS/MUERTOS/BAJAS, estos tienen su propio tipo) */}
          {!esVendidos(tipoReporte) && !esBajas(tipoReporte) && (
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select value={estado} onChange={e => setEstado(e.target.value)} label="Estado">
                  <MenuItem value="">Todos</MenuItem>
                  {['ACTIVO','VENDIDO','MUERTO','DESCARTE','MATADERO','BAJA'].map(s => (
                    <MenuItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Sexo</InputLabel>
              <Select value={sexo} onChange={e => setSexo(e.target.value)} label="Sexo">
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="MACHO">Macho</MenuItem>
                <MenuItem value="HEMBRA">Hembra</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {razas.length > 0 && (
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Raza</InputLabel>
                <Select value={razaId} onChange={e => setRazaId(e.target.value)} label="Raza">
                  <MenuItem value="">Todas</MenuItem>
                  {razas.map(r => <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}

          {categorias.length > 0 && (
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoría</InputLabel>
                <Select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} label="Categoría">
                  <MenuItem value="">Todas</MenuItem>
                  {categorias.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de producción</InputLabel>
              <Select value={tipoProduccion} onChange={e => setTipoProduccion(e.target.value)} label="Tipo de producción">
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="CARNE">Carne</MenuItem>
                <MenuItem value="LECHE">Leche</MenuItem>
                <MenuItem value="DOBLE_PROPOSITO">Doble propósito</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Origen</InputLabel>
              <Select value={origen} onChange={e => setOrigen(e.target.value)} label="Origen">
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="NACIDO_FINCA">Nacido en finca</MenuItem>
                <MenuItem value="COMPRADO">Comprado</MenuItem>
                <MenuItem value="DONADO">Donado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Parcela solo para reportes base */}
          {!esVendidos(tipoReporte) && !esBajas(tipoReporte) && parcelas.length > 0 && (
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Parcela actual</InputLabel>
                <Select value={parcelaId} onChange={e => setParcelaId(e.target.value)} label="Parcela actual">
                  <MenuItem value="">Todas</MenuItem>
                  {parcelas.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Fechas de nacimiento */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" type="date" label="Nac. desde"
              value={fechaNacDesde} onChange={e => setFechaNacDesde(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" type="date" label="Nac. hasta"
              value={fechaNacHasta} onChange={e => setFechaNacHasta(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>

          {/* Fechas de ingreso */}
          {!esVendidos(tipoReporte) && !esBajas(tipoReporte) && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" type="date" label="Ingreso desde"
                  value={fechaIngDesde} onChange={e => setFechaIngDesde(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" type="date" label="Ingreso hasta"
                  value={fechaIngHasta} onChange={e => setFechaIngHasta(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
            </>
          )}

          {/* Fechas de venta */}
          {esVendidos(tipoReporte) && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" type="date" label="Venta desde"
                  value={fechaVentaDesde} onChange={e => setFechaVentaDesde(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" type="date" label="Venta hasta"
                  value={fechaVentaHasta} onChange={e => setFechaVentaHasta(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
            </>
          )}

          {/* Fechas de baja */}
          {esBajas(tipoReporte) && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" type="date" label="Baja desde"
                  value={fechaBajaDesde} onChange={e => setFechaBajaDesde(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" type="date" label="Baja hasta"
                  value={fechaBajaHasta} onChange={e => setFechaBajaHasta(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
            </>
          )}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* ── Columnas ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Columnas a exportar
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={selTodas} sx={{ textTransform: 'none', fontSize: 12 }}>
              Seleccionar todo
            </Button>
            <Button size="small" variant="outlined" onClick={colsBasicas} sx={{ textTransform: 'none', fontSize: 12 }}>
              Columnas básicas
            </Button>
            <Button size="small" variant="outlined" color="inherit" onClick={limpiarCols} sx={{ textTransform: 'none', fontSize: 12 }}>
              Limpiar
            </Button>
          </Box>
        </Box>

        {columnas.length === 0 && (
          <Alert severity="warning" sx={{ mb: 1 }}>Seleccioná al menos una columna.</Alert>
        )}
        {columnas.length > 12 && formato === 'PDF' && (
          <Alert severity="info" sx={{ mb: 1 }}>
            Más de 12 columnas en PDF puede quedar muy comprimido. Se recomienda usar Excel o reducir columnas.
          </Alert>
        )}

        {/* Columnas base */}
        <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
            CAMPOS DEL ANIMAL
          </Typography>
          <FormGroup row>
            {COLS_BASE.map(col => (
              <FormControlLabel
                key={col.key}
                control={
                  <Checkbox
                    size="small"
                    checked={columnas.includes(col.key)}
                    onChange={() => toggleCol(col.key)}
                    sx={{ p: 0.5 }}
                  />
                }
                label={<Typography variant="caption">{col.label}</Typography>}
                sx={{ minWidth: 160, m: 0 }}
              />
            ))}
          </FormGroup>
        </Paper>

        {/* Columnas específicas para tipo de reporte */}
        {esVendidos(tipoReporte) && (
          <Paper variant="outlined" sx={{ p: 1.5, mb: 1, borderColor: '#E65100' }}>
            <Typography variant="caption" color="#E65100" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
              CAMPOS DE VENTA
            </Typography>
            <FormGroup row>
              {COLS_VENDIDOS.map(col => (
                <FormControlLabel
                  key={col.key}
                  control={
                    <Checkbox
                      size="small"
                      checked={columnas.includes(col.key)}
                      onChange={() => toggleCol(col.key)}
                      sx={{ p: 0.5 }}
                    />
                  }
                  label={<Typography variant="caption">{col.label}</Typography>}
                  sx={{ minWidth: 160, m: 0 }}
                />
              ))}
            </FormGroup>
          </Paper>
        )}

        {esBajas(tipoReporte) && (
          <Paper variant="outlined" sx={{ p: 1.5, mb: 1, borderColor: '#C62828' }}>
            <Typography variant="caption" color="#C62828" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
              CAMPOS DE BAJA
            </Typography>
            <FormGroup row>
              {COLS_BAJAS.map(col => (
                <FormControlLabel
                  key={col.key}
                  control={
                    <Checkbox
                      size="small"
                      checked={columnas.includes(col.key)}
                      onChange={() => toggleCol(col.key)}
                      sx={{ p: 0.5 }}
                    />
                  }
                  label={<Typography variant="caption">{col.label}</Typography>}
                  sx={{ minWidth: 160, m: 0 }}
                />
              ))}
            </FormGroup>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="outlined" onClick={handleClose} disabled={loading} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerar}
          disabled={loading || columnas.length === 0}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : (
            formato === 'PDF' ? <PictureAsPdfIcon /> : <TableChartIcon />
          )}
          sx={{
            textTransform: 'none',
            bgcolor: formato === 'PDF' ? '#D32F2F' : '#2E7D32',
            '&:hover': { bgcolor: formato === 'PDF' ? '#B71C1C' : '#1B5E20' },
          }}
        >
          {loading ? 'Generando...' : `Generar ${formato}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
