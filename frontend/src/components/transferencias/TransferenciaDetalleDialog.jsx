// Diálogo de detalle: ver animales, agregar/quitar, confirmar, imprimir
import { useState, useRef } from 'react'
import { useQuery } from '@apollo/client'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Divider, Chip, Stack,
  Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Tooltip, Alert, CircularProgress,
  MenuItem, TextField, Grid, Tabs, Tab,
} from '@mui/material'
import SwapHorizIcon          from '@mui/icons-material/SwapHoriz'
import DeleteOutlinedIcon     from '@mui/icons-material/DeleteOutlined'
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlinedIcon     from '@mui/icons-material/CancelOutlined'
import PrintIcon              from '@mui/icons-material/Print'
import PersonAddAltIcon       from '@mui/icons-material/PersonAddAlt'
import ConfirmDialog          from '../ui/ConfirmDialog'
import AnimalSelectorTransferencia from './AnimalSelectorTransferencia'
import { GET_TRANSFERENCIA_DETALLE } from '../../graphql/fincas'
import { GET_PARCELAS }              from '../../graphql/parcelas'

const ESTADO_COLORS = {
  BORRADOR:            'default',
  PENDIENTE_RECEPCION: 'warning',
  RECIBIDA:            'success',
  RECHAZADA:           'error',
  CANCELADA:           'error',
}

function ParcelalSelector({ fincaDestinoId, value, onChange }) {
  const { data } = useQuery(GET_PARCELAS, {
    variables: { fincaId: fincaDestinoId },
    skip: !fincaDestinoId,
  })
  const parcelas = data?.parcelas || []
  return (
    <TextField select size="small" fullWidth label="Parcela destino (opcional)"
      value={value || ''} onChange={e => onChange(e.target.value || null)}>
      <MenuItem value="">Sin parcela</MenuItem>
      {parcelas.map(p => (
        <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
      ))}
    </TextField>
  )
}

export default function TransferenciaDetalleDialog({
  open,
  onClose,
  transferenciaId,
  fincas = [],
  onAgregarAnimal,
  onQuitarAnimal,
  onEnviar,
  onAceptar,
  onRechazar,
  onCancelar,
  loadingAction = false,
}) {
  const { data, loading, refetch } = useQuery(GET_TRANSFERENCIA_DETALLE, {
    variables: { id: transferenciaId },
    skip: !transferenciaId,
    fetchPolicy: 'cache-and-network',
  })

  const t = data?.transferenciaFinca
  const [tab, setTab] = useState(0)
  const [seleccionados, setSeleccionados] = useState(new Map())
  const [parcelasDestino, setParcelasDestino] = useState({})
  const [confirmAccion, setConfirmAccion] = useState(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const printRef = useRef()

  const esBorrador = t?.estado === 'BORRADOR'
  const esPendiente = t?.estado === 'PENDIENTE_RECEPCION'
  // Transferencia interna: el usuario administra origen y destino.
  const esInterna = !!(t?.esOrigen && t?.esDestino)

  const handleToggle = (animal) => {
    setSeleccionados(prev => {
      const next = new Map(prev)
      if (next.has(animal.id)) next.delete(animal.id)
      else next.set(animal.id, animal)
      return next
    })
  }

  const handleSelectAll = (animales, check) => {
    setSeleccionados(prev => {
      const next = new Map(prev)
      animales.forEach(a => check ? next.set(a.id, a) : next.delete(a.id))
      return next
    })
  }

  const handleAgregarSeleccionados = async () => {
    if (seleccionados.size === 0) return
    let errores = []
    for (const [id, animal] of seleccionados) {
      const parcela = parcelasDestino[id] || null
      const result = await onAgregarAnimal({
        transferenciaId: t.id,
        animalId: id,
        parcelaDestinoId: parcela,
      })
      if (!result?.success) errores.push(`${animal.nroArete}: ${result?.message}`)
    }
    if (errores.length) {
      setMensaje({ type: 'error', text: errores.join(' | ') })
    } else {
      setMensaje({ type: 'success', text: `${seleccionados.size} animal(es) agregado(s).` })
      setSeleccionados(new Map())
    }
    await refetch()
    setTimeout(() => setMensaje(null), 4000)
  }

  const handleQuitar = async (detalleId) => {
    const result = await onQuitarAnimal(detalleId)
    if (!result?.success) setMensaje({ type: 'error', text: result?.message })
    else setMensaje({ type: 'success', text: 'Animal removido.' })
    await refetch()
    setTimeout(() => setMensaje(null), 3000)
  }

  const handleAccion = async (accion) => {
    setConfirmAccion(null)
    let result
    if (accion === 'enviar') result = await onEnviar(t.id, false)
    else if (accion === 'enviar_interna') result = await onEnviar(t.id, true)
    else if (accion === 'aceptar') result = await onAceptar(t.id)
    else if (accion === 'rechazar') {
      result = await onRechazar(t.id, motivoRechazo || null)
      setMotivoRechazo('')
    }
    else if (accion === 'cancelar') result = await onCancelar(t.id)
    setMensaje({ type: result?.success ? 'success' : 'error', text: result?.message })
    await refetch()
    setTimeout(() => setMensaje(null), 4000)
  }

  const handlePrint = () => {
    const contenido = printRef.current?.innerHTML
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Acta de Transferencia</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px;color:#222}
        h2{text-align:center;margin-bottom:4px}
        .sub{text-align:center;color:#555;font-size:13px;margin-bottom:18px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
        th{background:#f0f0f0}
        .meta{display:flex;gap:30px;margin-bottom:18px;font-size:13px}
        .meta span{font-weight:600}
        .firmas{margin-top:50px;display:flex;gap:60px}
        .firma{border-top:1px solid #333;width:200px;padding-top:4px;font-size:11px}
        @media print{button{display:none}}
      </style></head><body>
      ${contenido}
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  if (!open) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHorizIcon color="primary" />
            <Typography variant="h6">
              Detalle de Transferencia
            </Typography>
          </Box>
          {t && (
            <Chip
              label={t.estadoDisplay}
              color={ESTADO_COLORS[t.estado] || 'default'}
              size="small"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : !t ? (
          <Box sx={{ p: 3 }}><Alert severity="error">No se pudo cargar la transferencia.</Alert></Box>
        ) : (
          <>
            {mensaje && (
              <Box sx={{ px: 3, pt: 2 }}>
                <Alert severity={mensaje.type} onClose={() => setMensaje(null)}>{mensaje.text}</Alert>
              </Box>
            )}

            {/* Resumen cabecera */}
            <Box sx={{ px: 3, py: 2, bgcolor: '#F8FAFC' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Finca origen</Typography>
                  <Typography variant="body2" fontWeight={600}>{t.fincaOrigen?.nombre}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Finca destino</Typography>
                  <Typography variant="body2" fontWeight={600}>{t.fincaDestino?.nombre}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Fecha</Typography>
                  <Typography variant="body2">{t.fechaTransferencia}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Motivo</Typography>
                  <Typography variant="body2">{t.motivoDisplay}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Animales</Typography>
                  <Typography variant="body2">{t.totalAnimales}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Responsable</Typography>
                  <Typography variant="body2">{t.responsable || '—'}</Typography>
                </Grid>
                {t.observaciones && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                    <Typography variant="body2">{t.observaciones}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Divider />

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, bgcolor: 'white' }}>
              <Tab label={`Animales (${t.totalAnimales})`} />
              {esBorrador && <Tab label="Agregar animales" />}
            </Tabs>

            <Box sx={{ p: 2.5 }}>
              {/* Tab: lista de animales en la transferencia */}
              {tab === 0 && (
                t.detalles?.length === 0 ? (
                  <Alert severity="info">
                    No hay animales agregados. {esBorrador && 'Use la pestaña "Agregar animales" para seleccionarlos.'}
                  </Alert>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Arete</TableCell>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Sexo</TableCell>
                          <TableCell>Raza</TableCell>
                          <TableCell>Categoría</TableCell>
                          <TableCell align="right">Peso (kg)</TableCell>
                          <TableCell>Parcela origen</TableCell>
                          <TableCell>Parcela destino</TableCell>
                          {esBorrador && <TableCell />}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {t.detalles.map(d => (
                          <TableRow key={d.id} hover>
                            <TableCell><Typography variant="body2" fontWeight={600}>{d.animal?.nroArete}</Typography></TableCell>
                            <TableCell>{d.animal?.nombre || '—'}</TableCell>
                            <TableCell>
                              <Chip label={d.animal?.sexo} size="small"
                                color={d.animal?.sexo === 'MACHO' ? 'info' : 'secondary'} variant="outlined" />
                            </TableCell>
                            <TableCell>{d.animal?.raza?.nombre || '—'}</TableCell>
                            <TableCell>{d.animal?.categoria?.nombre || '—'}</TableCell>
                            <TableCell align="right">{d.pesoActualTransferencia ?? d.animal?.peso ?? '—'}</TableCell>
                            <TableCell>{d.parcelaOrigen?.nombre || '—'}</TableCell>
                            <TableCell>{d.parcelaDestino?.nombre || '—'}</TableCell>
                            {esBorrador && (
                              <TableCell>
                                <Tooltip title="Quitar animal">
                                  <IconButton size="small" color="error" onClick={() => handleQuitar(d.id)}>
                                    <DeleteOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )
              )}

              {/* Tab: agregar animales (solo borrador) */}
              {tab === 1 && esBorrador && (
                <Box>
                  <AnimalSelectorTransferencia
                    fincaOrigenId={t.fincaOrigen?.id}
                    seleccionados={seleccionados}
                    onToggle={handleToggle}
                    onSelectAll={handleSelectAll}
                  />
                  {seleccionados.size > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        startIcon={<PersonAddAltIcon />}
                        onClick={handleAgregarSeleccionados}
                        disabled={loadingAction}
                      >
                        Agregar {seleccionados.size} animal(es)
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* Contenido oculto para impresión */}
            <Box sx={{ display: 'none' }}>
              <div ref={printRef}>
                <h2>Acta de Transferencia de Animales</h2>
                <p className="sub">Sistema Ganadero</p>
                <div className="meta">
                  <div><span>Finca origen:</span> {t.fincaOrigen?.nombre}</div>
                  <div><span>Finca destino:</span> {t.fincaDestino?.nombre}</div>
                  <div><span>Fecha:</span> {t.fechaTransferencia}</div>
                  <div><span>Motivo:</span> {t.motivoDisplay}</div>
                  {t.responsable && <div><span>Responsable:</span> {t.responsable}</div>}
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Arete</th><th>Nombre</th><th>Sexo</th><th>Raza</th>
                      <th>Categoría</th><th>Peso (kg)</th><th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.detalles?.map(d => (
                      <tr key={d.id}>
                        <td>{d.animal?.nroArete}</td>
                        <td>{d.animal?.nombre || ''}</td>
                        <td>{d.animal?.sexo}</td>
                        <td>{d.animal?.raza?.nombre || ''}</td>
                        <td>{d.animal?.categoria?.nombre || ''}</td>
                        <td>{d.pesoActualTransferencia ?? d.animal?.peso ?? ''}</td>
                        <td>{d.observaciones || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {t.observaciones && <p><strong>Observaciones generales:</strong> {t.observaciones}</p>}
                <div className="firmas">
                  <div className="firma">Entrega: ___________________</div>
                  <div className="firma">Recibe: ___________________</div>
                </div>
              </div>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onClose}>Cerrar</Button>

        {t && (
          <>
            {t.totalAnimales > 0 && (
              <Button startIcon={<PrintIcon />} onClick={handlePrint} variant="outlined">
                Imprimir acta
              </Button>
            )}

            {/* Enviar (origen, borrador). Interna -> recepción inmediata. */}
            {esBorrador && t.totalAnimales > 0 && t.esOrigen && (
              <Button
                variant="contained" color="primary"
                startIcon={<CheckCircleOutlinedIcon />}
                onClick={() => setConfirmAccion(esInterna ? 'enviar_interna' : 'enviar')}
                disabled={loadingAction}
              >
                {esInterna ? 'Transferir (interna)' : 'Enviar transferencia'}
              </Button>
            )}

            {/* Pendiente de recepción y el usuario es la finca destino */}
            {esPendiente && t.puedeRecibir && (
              <>
                <Button
                  variant="contained" color="success"
                  startIcon={<CheckCircleOutlinedIcon />}
                  onClick={() => setConfirmAccion('aceptar')}
                  disabled={loadingAction}
                >
                  Aceptar
                </Button>
                <Button
                  variant="outlined" color="error"
                  startIcon={<CancelOutlinedIcon />}
                  onClick={() => setConfirmAccion('rechazar')}
                  disabled={loadingAction}
                >
                  Rechazar
                </Button>
              </>
            )}

            {/* Pendiente y el usuario es solo origen: estado informativo */}
            {esPendiente && !t.puedeRecibir && t.esOrigen && (
              <Chip color="warning" label="Pendiente de recepción" variant="outlined" />
            )}

            {/* Cancelar: solo origen mientras esté en borrador o pendiente */}
            {t.puedeCancelar && (
              <Button
                color="error" variant="outlined"
                startIcon={<CancelOutlinedIcon />}
                onClick={() => setConfirmAccion('cancelar')}
                disabled={loadingAction}
              >
                Cancelar
              </Button>
            )}
          </>
        )}
      </DialogActions>

      {/* Confirmaciones */}
      <ConfirmDialog
        open={confirmAccion === 'enviar'}
        onClose={() => setConfirmAccion(null)}
        onConfirm={() => handleAccion('enviar')}
        title="¿Enviar transferencia?"
        message={`Se enviarán ${t?.totalAnimales} animal(es) a ${t?.fincaDestino?.nombre}. Quedará pendiente de recepción hasta que la finca destino la acepte. Los animales NO se mueven todavía.`}
      />
      <ConfirmDialog
        open={confirmAccion === 'enviar_interna'}
        onClose={() => setConfirmAccion(null)}
        onConfirm={() => handleAccion('enviar_interna')}
        title="¿Transferir animales?"
        message={`Transferencia interna: se trasladarán ${t?.totalAnimales} animal(es) de ${t?.fincaOrigen?.nombre} a ${t?.fincaDestino?.nombre} de inmediato.`}
      />
      <ConfirmDialog
        open={confirmAccion === 'aceptar'}
        onClose={() => setConfirmAccion(null)}
        onConfirm={() => handleAccion('aceptar')}
        title="¿Aceptar transferencia?"
        message={`Se recibirán ${t?.totalAnimales} animal(es) en ${t?.fincaDestino?.nombre}. Esta acción cambia la finca de los animales.`}
      />
      <ConfirmDialog
        open={confirmAccion === 'cancelar'}
        onClose={() => setConfirmAccion(null)}
        onConfirm={() => handleAccion('cancelar')}
        title="¿Cancelar transferencia?"
        message="La transferencia será cancelada. Los animales permanecerán en su finca actual."
      />

      {/* Rechazo con motivo */}
      <Dialog open={confirmAccion === 'rechazar'} onClose={() => setConfirmAccion(null)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Rechazar transferencia?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Los animales permanecerán en {t?.fincaOrigen?.nombre}. Indique el motivo (opcional):
          </Typography>
          <TextField
            autoFocus fullWidth multiline minRows={2}
            label="Motivo del rechazo"
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAccion(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={() => handleAccion('rechazar')}>
            Rechazar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}
