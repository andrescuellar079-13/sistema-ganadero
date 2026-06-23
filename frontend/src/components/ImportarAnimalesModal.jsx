import { useState, useMemo } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stepper, Step, StepLabel, Box, Typography, Alert,
  FormControl, InputLabel, Select, MenuItem, RadioGroup, Radio,
  FormControlLabel, Switch, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, Paper,
} from '@mui/material'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'

import { useFincas } from '../hooks/useFincas'
import {
  descargarPlantilla, previsualizar, confirmar,
  descargarReporteErrores, MODOS,
} from '../services/importacionService'

const PASOS = [
  'Finca', 'Plantilla', 'Archivo', 'Modo', 'Previsualizar', 'Importar',
]

const ESTADO_INICIAL = {
  activeStep: 0,
  archivo: null,
  modo: 'SOLO_CREAR',
  modoEstricto: true,
  preview: null,
  resultado: null,
  error: '',
  cargando: false,
}

export default function ImportarAnimalesModal({
  open, onClose, fincaIdInicial, onImported,
}) {
  const { misFincas, fincaActual } = useFincas()
  const fincas = useMemo(
    () => (misFincas?.length ? misFincas : (fincaActual ? [fincaActual] : [])),
    [misFincas, fincaActual],
  )

  // El modal se remonta en cada apertura (key en el padre), así que el estado
  // inicial ya queda fresco sin necesidad de un efecto de reset.
  const [st, setSt] = useState(ESTADO_INICIAL)
  const [fincaId, setFincaId] = useState(fincaIdInicial || '')

  const set = (patch) => setSt((prev) => ({ ...prev, ...patch }))

  const fincaNombre = useMemo(
    () => fincas.find((f) => String(f.id) === String(fincaId))?.nombre || '',
    [fincas, fincaId],
  )

  const puedeAvanzar = () => {
    switch (st.activeStep) {
      case 0: return !!fincaId
      case 2: return !!st.archivo
      case 4: return !!st.preview
      default: return true
    }
  }

  const avanzar = () => set({ activeStep: Math.min(st.activeStep + 1, 5), error: '' })
  const retroceder = () => set({ activeStep: Math.max(st.activeStep - 1, 0), error: '' })

  // --- Acciones ---
  const handlePlantilla = async () => {
    try {
      set({ error: '' })
      await descargarPlantilla()
    } catch (e) {
      set({ error: e.message })
    }
  }

  const handlePreview = async () => {
    set({ cargando: true, error: '', preview: null })
    try {
      const r = await previsualizar({
        fincaId, archivo: st.archivo, modo: st.modo, modoEstricto: st.modoEstricto,
      })
      if (!r?.ok) {
        set({ cargando: false, error: r?.mensaje || 'No se pudo validar el archivo.' })
        return
      }
      set({ cargando: false, preview: r })
    } catch (e) {
      set({ cargando: false, error: e.message })
    }
  }

  const handleConfirmar = async () => {
    set({ cargando: true, error: '', resultado: null })
    try {
      const r = await confirmar(st.preview.importacion_id)
      set({ cargando: false, resultado: r })
      if (r?.ok) onImported?.()
    } catch (e) {
      set({ cargando: false, error: e.message })
    }
  }

  const handleReporte = async () => {
    try {
      await descargarReporteErrores(st.preview.importacion_id)
    } catch (e) {
      set({ error: e.message })
    }
  }

  // --- Render por paso ---
  const renderPaso = () => {
    switch (st.activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Elegí la finca donde se importarán los datos. Los registros se
              asignan SIEMPRE a esta finca (nunca se toma del archivo).
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Finca</InputLabel>
              <Select
                label="Finca" value={fincaId}
                onChange={(e) => setFincaId(e.target.value)}
              >
                {fincas.map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )
      case 1:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Descargá la plantilla Excel. Tiene una hoja por módulo (PARCELAS,
              ANIMALES, PESOS) con los encabezados y una fila de ejemplo.
              <strong> nro_arete</strong> es la referencia obligatoria.
            </Typography>
            <Button
              variant="outlined" startIcon={<DownloadOutlinedIcon />}
              onClick={handlePlantilla}
            >
              Descargar plantilla
            </Button>
          </Box>
        )
      case 2:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Cargá el archivo completado (.xlsx o .csv).
            </Typography>
            <Button variant="outlined" component="label" startIcon={<FileUploadOutlinedIcon />}>
              Seleccionar archivo
              <input
                hidden type="file" accept=".xlsx,.xlsm,.csv"
                onChange={(e) => set({ archivo: e.target.files?.[0] || null, preview: null })}
              />
            </Button>
            {st.archivo && (
              <Chip
                icon={<DescriptionOutlinedIcon />} label={st.archivo.name}
                sx={{ ml: 2 }} onDelete={() => set({ archivo: null, preview: null })}
              />
            )}
          </Box>
        )
      case 3:
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Modo de importación</Typography>
            <RadioGroup
              value={st.modo}
              onChange={(e) => set({ modo: e.target.value, preview: null })}
            >
              {MODOS.map((m) => (
                <FormControlLabel
                  key={m.value} value={m.value} control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{m.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{m.descripcion}</Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
            <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={st.modoEstricto}
                    onChange={(e) => set({ modoEstricto: e.target.checked, preview: null })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Modo estricto {st.modoEstricto ? '(activado)' : '(desactivado)'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {st.modoEstricto
                        ? 'Si hay algún error, NO se importa nada (todo o nada).'
                        : 'Importa las filas válidas e ignora las inválidas (parcial).'}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>
        )
      case 4:
        return (
          <Box>
            {!st.preview && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Validá el archivo antes de importar. Finca destino: <strong>{fincaNombre}</strong>.
                </Typography>
                <Button variant="contained" onClick={handlePreview} disabled={st.cargando}>
                  Validar y previsualizar
                </Button>
              </>
            )}
            {st.cargando && <LinearProgress sx={{ mt: 2 }} />}
            {st.preview && <ResumenPreview preview={st.preview} onReporte={handleReporte} />}
          </Box>
        )
      case 5:
        return (
          <Box>
            {!st.resultado && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Se importarán <strong>{st.preview?.filas_validas}</strong> filas válidas
                  en la finca <strong>{fincaNombre}</strong>
                  {st.modoEstricto && st.preview?.total_errores > 0 && (
                    <> — pero el modo estricto cancelará todo por los {st.preview.total_errores} errores.</>
                  )}.
                </Typography>
                <Button
                  variant="contained" color="primary"
                  startIcon={<FileUploadOutlinedIcon />}
                  onClick={handleConfirmar} disabled={st.cargando}
                >
                  Confirmar e importar
                </Button>
              </>
            )}
            {st.cargando && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">Importando…</Typography>
                <LinearProgress sx={{ mt: 1 }} />
              </Box>
            )}
            {st.resultado && (
              <ResumenFinal resultado={st.resultado} onReporte={handleReporte} />
            )}
          </Box>
        )
      default:
        return null
    }
  }

  const finalizado = st.activeStep === 5 && st.resultado?.ok

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{
        bgcolor: '#2E7D32', color: 'white', display: 'flex',
        alignItems: 'center', gap: 1,
      }}>
        <FileUploadOutlinedIcon /> Importar datos ganaderos
      </DialogTitle>
      <DialogContent dividers sx={{ py: 3 }}>
        <Stepper activeStep={st.activeStep} alternativeLabel sx={{ mb: 3 }}>
          {PASOS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
        {st.error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => set({ error: '' })}>
            {st.error}
          </Alert>
        )}
        {renderPaso()}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>{finalizado ? 'Cerrar' : 'Cancelar'}</Button>
        <Box sx={{ flex: 1 }} />
        {st.activeStep > 0 && !finalizado && (
          <Button onClick={retroceder} disabled={st.cargando}>Atrás</Button>
        )}
        {st.activeStep < 5 && (
          <Button
            variant="contained" onClick={avanzar}
            disabled={!puedeAvanzar() || st.cargando}
          >
            Siguiente
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

function ResumenPreview({ preview, onReporte }) {
  const hojas = preview.por_hoja || {}
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Chip color="default" label={`Filas: ${preview.total_filas}`} />
        <Chip color="success" label={`Válidas: ${preview.filas_validas}`} />
        <Chip color={preview.total_errores ? 'error' : 'default'}
          label={`Errores: ${preview.total_errores}`} />
      </Box>
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>Hoja</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Válidas</TableCell>
              <TableCell align="right">Nuevas</TableCell>
              <TableCell align="right">Actualizar</TableCell>
              <TableCell align="right">Errores</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(hojas).map(([nombre, r]) => (
              <TableRow key={nombre}>
                <TableCell>{nombre}</TableCell>
                <TableCell align="right">{r.total}</TableCell>
                <TableCell align="right">{r.validas}</TableCell>
                <TableCell align="right">{r.nuevas ?? '—'}</TableCell>
                <TableCell align="right">{r.actualizadas ?? '—'}</TableCell>
                <TableCell align="right">{r.errores}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      {preview.total_errores > 0 && (
        <>
          <Alert severity="warning" sx={{ mb: 1 }}
            action={
              <Button color="inherit" size="small" startIcon={<DownloadOutlinedIcon />}
                onClick={onReporte}>
                Reporte
              </Button>
            }>
            Se encontraron {preview.total_errores} errores. Descargá el reporte XLSX
            para corregirlos.
          </Alert>
          <MuestraErrores errores={preview.muestra_errores} />
        </>
      )}
    </Box>
  )
}

function MuestraErrores({ errores = [] }) {
  if (!errores.length) return null
  return (
    <Paper variant="outlined" sx={{ maxHeight: 220, overflow: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Hoja</TableCell>
            <TableCell>Fila</TableCell>
            <TableCell>Campo</TableCell>
            <TableCell>Mensaje</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {errores.map((e, i) => (
            <TableRow key={i}>
              <TableCell>{e.hoja}</TableCell>
              <TableCell>{e.numero_fila}</TableCell>
              <TableCell>{e.campo || '—'}</TableCell>
              <TableCell>{e.mensaje}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}

function ResumenFinal({ resultado, onReporte }) {
  if (!resultado.ok) {
    return (
      <Alert severity="error" icon={<ErrorOutlineIcon />}
        action={
          <Button color="inherit" size="small" onClick={onReporte}>Reporte</Button>
        }>
        {resultado.mensaje || 'La importación no se completó.'}
        {resultado.rollback && ' (No se guardó ningún registro).'}
      </Alert>
    )
  }
  const c = resultado.contadores || {}
  return (
    <Box>
      <Alert severity={resultado.total_errores ? 'warning' : 'success'}
        icon={<CheckCircleOutlineIcon />} sx={{ mb: 2 }}>
        Importación finalizada.
      </Alert>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip color="success" label={`Creados: ${resultado.creados}`} />
        <Chip color="info" label={`Actualizados: ${resultado.actualizados}`} />
        <Chip label={`Omitidos: ${resultado.omitidos}`} />
        {c.parcelas_creadas > 0 && <Chip label={`Parcelas: ${c.parcelas_creadas}`} />}
        {c.pesos_creados > 0 && <Chip label={`Pesos: ${c.pesos_creados}`} />}
        {resultado.total_errores > 0 && (
          <Chip color="error" label={`Errores: ${resultado.total_errores}`} />
        )}
      </Box>
      {resultado.total_errores > 0 && (
        <Button sx={{ mt: 2 }} size="small" startIcon={<DownloadOutlinedIcon />}
          onClick={onReporte}>
          Descargar reporte de errores
        </Button>
      )}
    </Box>
  )
}
