import { useState, useMemo } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox, Grid, Typography, Box,
  Divider, Alert, ToggleButton, ToggleButtonGroup,
  TextField, FormGroup, Paper, IconButton, Table, TableHead,
  TableBody, TableRow, TableCell,
} from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import CloseIcon from '@mui/icons-material/Close'
import {
  generarReporteGenericoPDF,
  generarReporteGenericoExcel,
} from '../services/reportesService'

/**
 * ReportModalReusable
 * ───────────────────
 * Modal de reportes reutilizable, dirigido por configuración (data-driven).
 * Diseño híbrido entre "Exportar reporte de animales" (selección de columnas,
 * filtros y formato) y "Reportes de Bajas" (cabecera con color, tarjetas
 * resumen y vista previa).
 *
 * Todo el filtrado es del lado del cliente sobre la prop `data` que ya viene
 * cargada por el módulo; no realiza consultas propias. Cada módulo arma su
 * configuración (ver components/reportes/*) y se la pasa con spread.
 *
 * Props:
 *  - open, onClose
 *  - titulo            : string en la cabecera
 *  - colorHeader       : color de la cabecera (default verde del tema)
 *  - subtitulo         : texto auxiliar (ej. finca / período)
 *  - data              : array de registros crudos del módulo
 *  - tiposReporte      : [{ value, label, filtro?: (item)=>bool }]
 *  - tipoReporteDefault: value inicial (default: primer tipo)
 *  - columnas          : [{ key, label, grupo?, render?: (item)=>any }]
 *  - columnasDefault   : [key] columnas marcadas por defecto
 *  - filtrosExtra      : [{ key, label, tipo?: 'select'|'text',
 *                           opciones?: [{value,label}], aplicar:(item,value)=>bool }]
 *  - campoFecha        : (item)=>string|Date|null  → habilita filtro fecha inicio/fin
 *  - labelFecha        : etiqueta del campo de fecha (default 'Fecha')
 *  - getResumen        : (itemsFiltrados)=>[{ label, value, color? }]
 *  - nombreArchivo     : base del nombre de archivo exportado
 *  - previewLimite     : filas máximas en la vista previa (default 50)
 */
export default function ReportModalReusable({
  open,
  onClose,
  titulo = 'Reporte',
  colorHeader = '#2E7D32',
  subtitulo = '',
  data = [],
  tiposReporte = [],
  tipoReporteDefault,
  columnas = [],
  columnasDefault = [],
  filtrosExtra = [],
  campoFecha,
  labelFecha = 'Fecha',
  getResumen,
  nombreArchivo = 'reporte',
  previewLimite = 50,
}) {
  const primerTipo = tipoReporteDefault || tiposReporte[0]?.value || ''
  const columnasIniciales = columnasDefault.length ? columnasDefault : columnas.map(c => c.key)

  const [tipoReporte, setTipoReporte] = useState(primerTipo)
  const [formato, setFormato] = useState('PDF')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [valoresExtra, setValoresExtra] = useState({})
  const [seleccionadas, setSeleccionadas] = useState(columnasIniciales)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  // Reiniciar el estado cada vez que el modal se abre (patrón de ajuste de
  // estado en render: https://react.dev/learn/you-might-not-need-an-effect).
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setTipoReporte(primerTipo)
      setFormato('PDF')
      setFechaInicio('')
      setFechaFin('')
      setValoresExtra({})
      setSeleccionadas(columnasIniciales)
      setError('')
      setExito('')
    }
  }

  const tipoActual = useMemo(
    () => tiposReporte.find(t => t.value === tipoReporte) || null,
    [tiposReporte, tipoReporte]
  )

  // ── Pipeline de filtrado (cliente) ──
  const datosFiltrados = useMemo(() => {
    let items = Array.isArray(data) ? [...data] : []

    if (tipoActual?.filtro) {
      items = items.filter(tipoActual.filtro)
    }

    if (campoFecha && (fechaInicio || fechaFin)) {
      items = items.filter(item => {
        const f = campoFecha(item)
        if (!f) return false
        const fecha = new Date(String(f).split('T')[0])
        if (fechaInicio && fecha < new Date(fechaInicio)) return false
        if (fechaFin && fecha > new Date(fechaFin)) return false
        return true
      })
    }

    filtrosExtra.forEach(fe => {
      const val = valoresExtra[fe.key]
      if (val !== undefined && val !== '' && val !== null) {
        items = items.filter(item => fe.aplicar(item, val))
      }
    })

    return items
  }, [data, tipoActual, campoFecha, fechaInicio, fechaFin, filtrosExtra, valoresExtra])

  const resumen = useMemo(
    () => (getResumen ? getResumen(datosFiltrados) : []),
    [getResumen, datosFiltrados]
  )

  // ── Columnas agrupadas para la selección ──
  const grupos = useMemo(() => {
    const map = new Map()
    columnas.forEach(col => {
      const g = col.grupo || 'CAMPOS'
      if (!map.has(g)) map.set(g, [])
      map.get(g).push(col)
    })
    return [...map.entries()].map(([nombre, cols]) => ({ nombre, cols }))
  }, [columnas])

  const columnasOrdenadas = useMemo(
    () => columnas.filter(c => seleccionadas.includes(c.key)),
    [columnas, seleccionadas]
  )

  const valorTexto = (col, item) => {
    const raw = col.render ? col.render(item) : item?.[col.key]
    if (raw == null || raw === '') return '-'
    return String(raw)
  }

  function toggleCol(key) {
    setSeleccionadas(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }
  const selTodas = () => setSeleccionadas(columnas.map(c => c.key))
  const limpiarCols = () => setSeleccionadas([])
  const colsDefecto = () =>
    setSeleccionadas(columnasDefault.length ? columnasDefault : columnas.map(c => c.key))

  function exportar(fmt = formato) {
    setError('')
    setExito('')
    if (columnasOrdenadas.length === 0) {
      setError('Seleccioná al menos una columna para exportar.')
      return
    }
    if (datosFiltrados.length === 0) {
      setError('No hay registros para los filtros seleccionados.')
      return
    }
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      setError('La fecha de inicio no puede ser mayor que la fecha de fin.')
      return
    }

    const encabezados = columnasOrdenadas.map(c => c.label)
    const filas = datosFiltrados.map(item => columnasOrdenadas.map(c => valorTexto(c, item)))
    const columnasAnchas = columnasOrdenadas
      .filter(c => c.ancha)
      .map(c => c.label)

    const cfg = {
      titulo: `${titulo} — ${tipoActual?.label || ''}`.trim(),
      subtitulo,
      nombreArchivo: `${nombreArchivo}_${String(tipoReporte).toLowerCase()}`,
      sheetName: tipoActual?.label || 'Reporte',
      columnasAnchas,
    }

    try {
      if (fmt === 'PDF') generarReporteGenericoPDF(filas, encabezados, cfg)
      else generarReporteGenericoExcel(filas, encabezados, cfg)
      setExito(`Archivo ${fmt} generado con ${filas.length} registro(s).`)
      setTimeout(() => setExito(''), 2500)
    } catch (e) {
      setError(`Error al generar el archivo: ${e.message}`)
    }
  }

  const preview = datosFiltrados.slice(0, previewLimite)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper"
      PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{
        bgcolor: colorHeader, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentOutlinedIcon />
          <Typography variant="h6" fontWeight={700}>{titulo}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {exito && <Alert severity="success" sx={{ mb: 2 }}>{exito}</Alert>}

        {/* ── Filtros ── */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Filtros del reporte
          </Typography>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de reporte</InputLabel>
                <Select value={tipoReporte} label="Tipo de reporte"
                  onChange={e => setTipoReporte(e.target.value)}>
                  {tiposReporte.map(t => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {campoFecha && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth size="small" type="date" label={`${labelFecha} desde`}
                    value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth size="small" type="date" label={`${labelFecha} hasta`}
                    value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Formato
                </Typography>
                <ToggleButtonGroup value={formato} exclusive size="small" sx={{ height: 40 }}
                  onChange={(_, v) => v && setFormato(v)}>
                  <ToggleButton value="PDF" sx={{ px: 2, gap: 0.5 }}>
                    <PictureAsPdfIcon fontSize="small" sx={{ color: '#D32F2F' }} /> PDF
                  </ToggleButton>
                  <ToggleButton value="EXCEL" sx={{ px: 2, gap: 0.5 }}>
                    <TableChartIcon fontSize="small" sx={{ color: '#2E7D32' }} /> Excel
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>

            {/* ── Filtros extra del módulo ── */}
            {filtrosExtra.map(fe => (
              <Grid item xs={12} sm={6} md={3} key={fe.key}>
                {fe.tipo === 'text' ? (
                  <TextField fullWidth size="small" label={fe.label}
                    value={valoresExtra[fe.key] || ''}
                    onChange={e => setValoresExtra(prev => ({ ...prev, [fe.key]: e.target.value }))} />
                ) : (
                  <FormControl fullWidth size="small">
                    <InputLabel>{fe.label}</InputLabel>
                    <Select value={valoresExtra[fe.key] || ''} label={fe.label}
                      onChange={e => setValoresExtra(prev => ({ ...prev, [fe.key]: e.target.value }))}>
                      <MenuItem value="">Todos</MenuItem>
                      {(fe.opciones || []).map(op => (
                        <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* ── Tarjetas resumen ── */}
        {resumen.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            {resumen.map((card, i) => (
              <Grid item xs={6} sm={4} md={12 / Math.min(resumen.length, 6)} key={i}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} sx={{ color: card.color || colorHeader }}>
                    {card.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        <Divider sx={{ my: 2 }} />

        {/* ── Selección de columnas ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>Columnas a exportar</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={selTodas} sx={{ textTransform: 'none', fontSize: 12 }}>
              Seleccionar todo
            </Button>
            <Button size="small" variant="outlined" onClick={colsDefecto} sx={{ textTransform: 'none', fontSize: 12 }}>
              Por defecto
            </Button>
            <Button size="small" variant="outlined" color="inherit" onClick={limpiarCols} sx={{ textTransform: 'none', fontSize: 12 }}>
              Limpiar
            </Button>
          </Box>
        </Box>

        {seleccionadas.length === 0 && (
          <Alert severity="warning" sx={{ mb: 1 }}>Seleccioná al menos una columna.</Alert>
        )}
        {columnasOrdenadas.length > 12 && formato === 'PDF' && (
          <Alert severity="info" sx={{ mb: 1 }}>
            Más de 12 columnas en PDF puede quedar muy comprimido. Se recomienda usar Excel.
          </Alert>
        )}

        {grupos.map(grupo => (
          <Paper key={grupo.nombre} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
              {grupo.nombre}
            </Typography>
            <FormGroup row>
              {grupo.cols.map(col => (
                <FormControlLabel
                  key={col.key}
                  control={
                    <Checkbox size="small" sx={{ p: 0.5 }}
                      checked={seleccionadas.includes(col.key)}
                      onChange={() => toggleCol(col.key)} />
                  }
                  label={<Typography variant="caption">{col.label}</Typography>}
                  sx={{ minWidth: 180, m: 0 }}
                />
              ))}
            </FormGroup>
          </Paper>
        ))}

        <Divider sx={{ my: 2 }} />

        {/* ── Vista previa ── */}
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Vista previa
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {datosFiltrados.length} registro(s)
            {datosFiltrados.length > previewLimite ? ` — mostrando ${previewLimite}` : ''}
          </Typography>
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto', maxHeight: 320 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {columnasOrdenadas.map(col => (
                    <TableCell key={col.key} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {columnasOrdenadas.length === 0 ? (
                  <TableRow>
                    <TableCell align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Seleccioná columnas para ver la vista previa.
                    </TableCell>
                  </TableRow>
                ) : preview.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnasOrdenadas.length} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No hay registros para los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  preview.map((item, idx) => (
                    <TableRow key={item.id ?? idx} hover>
                      {columnasOrdenadas.map(col => (
                        <TableCell key={col.key} sx={{ whiteSpace: 'nowrap' }}>
                          {valorTexto(col, item)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ textTransform: 'none' }}>
          Cerrar
        </Button>
        <Button variant="contained"
          startIcon={<TableChartIcon />}
          disabled={seleccionadas.length === 0}
          onClick={() => exportar('EXCEL')}
          sx={{ textTransform: 'none', bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          Exportar Excel
        </Button>
        <Button variant="contained"
          startIcon={<PictureAsPdfIcon />}
          disabled={seleccionadas.length === 0}
          onClick={() => exportar('PDF')}
          sx={{ textTransform: 'none', bgcolor: '#D32F2F', '&:hover': { bgcolor: '#B71C1C' } }}
        >
          Exportar PDF
        </Button>
      </DialogActions>
    </Dialog>
  )
}
