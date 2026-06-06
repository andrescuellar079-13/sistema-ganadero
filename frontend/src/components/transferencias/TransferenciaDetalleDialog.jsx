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
  BORRADOR:   'default',
  CONFIRMADA: 'primary',
  RECIBIDA:   'success',
  CANCELADA:  'error',
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
  onConfirmar,
  onCancelar,
  onMarcarRecibida,
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
  const [mensaje, setMensaje] = useState(null)
  const printRef = useRef()

  const esBorrador = t?.estado === 'BORRADOR'
  const esConfirmada = t?.estado === 'CONFIRMADA'

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
    if (accion === 'confirmar') result = await onConfirmar(t.id)
    else if (accion === 'cancelar') result = await onCancelar(t.id)
    else if (accion === 'recibir') result = await onMarcarRecibida(t.id)
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

            {esBorrador && t.totalAnimales > 0 && (
              <Button
                variant="contained" color="success"
                startIcon={<CheckCircleOutlinedIcon />}
                onClick={() => setConfirmAccion('confirmar')}
                disabled={loadingAction}
              >
                Confirmar transferencia
              </Button>
            )}

            {esConfirmada && (
              <Button
                variant="contained" color="info"
                onClick={() => setConfirmAccion('recibir')}
                disabled={loadingAction}
              >
                Marcar como recibida
              </Button>
            )}

            {(esBorrador || esConfirmada) && (
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
        open={confirmAccion === 'confirmar'}
        onClose={() => setConfirmAccion(null)}
        onConfirm={() => handleAccion('confirmar')}
        title="¿Confirmar transferencia?"
        message={`Se trasladarán ${t?.totalAnimales} animal(es) de ${t?.fincaOrigen?.nombre} a ${t?.fincaDestino?.nombre}. Esta acción cambia la finca de los animales seleccionados.`}
      />
      <ConfirmDialog
        open={confirmAccion === 'cancelar'}
        onClose={() => setConfirmAccion(null)}
        onConfirm={() => handleAccion('cancelar')}
        title="¿Cancelar transferencia?"
        message="La transferencia será cancelada. Los animales permanecerán en su finca actual."
      />
      <ConfirmDialog
        open={confirmAccion === 'recibir'}
        onClose={() => setConfirmAccion(null)}
        onConfirm={() => handleAccion('recibir')}
        title="¿Marcar como recibida?"
        message="Se confirmará que la finca destino ha recibido los animales."
      />
    </Dialog>
  )
}
