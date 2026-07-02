// Pestaña de Transferencias dentro del módulo Fincas
import { useState } from 'react'
import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Chip, Stack, IconButton, Tooltip, TextField,
  InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Button, Alert, Tabs, Tab, Badge,
} from '@mui/material'
import SearchIcon          from '@mui/icons-material/Search'
import ClearIcon           from '@mui/icons-material/Clear'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon    from '@mui/icons-material/EditOutlined'
import AddIcon             from '@mui/icons-material/Add'
import SwapHorizIcon       from '@mui/icons-material/SwapHoriz'

import EmptyState  from '../ui/EmptyState'
import PageAlert   from '../ui/PageAlert'
import { useTransferencias } from '../../hooks/useTransferencias'
import TransferenciaFormDialog  from './TransferenciaFormDialog'
import TransferenciaDetalleDialog from './TransferenciaDetalleDialog'

const ESTADO_COLORS = {
  BORRADOR:            'default',
  PENDIENTE_RECEPCION: 'warning',
  RECIBIDA:            'success',
  RECHAZADA:           'error',
  CANCELADA:           'error',
}

const ESTADO_OPTS = [
  { value: '',                    label: 'Todos los estados' },
  { value: 'BORRADOR',            label: 'Borrador' },
  { value: 'PENDIENTE_RECEPCION', label: 'Pendientes de recepción' },
  { value: 'RECIBIDA',            label: 'Recibidas' },
  { value: 'RECHAZADA',           label: 'Rechazadas' },
  { value: 'CANCELADA',           label: 'Canceladas' },
]

// Pestañas de alto nivel: clasifican según relación con la finca activa.
const VISTAS = [
  { key: 'TODAS',      label: 'Todas' },
  { key: 'PENDIENTES', label: 'Pendientes' },
  { key: 'ENVIADAS',   label: 'Enviadas' },
  { key: 'RECIBIDAS',  label: 'Recibidas' },
  { key: 'HISTORIAL',  label: 'Historial' },
]

function filtrarPorVista(transferencias, vista) {
  switch (vista) {
    case 'PENDIENTES':
      // Pendientes de que YO (finca destino) acepte/rechace
      return transferencias.filter(t => t.estado === 'PENDIENTE_RECEPCION' && t.esDestino)
    case 'ENVIADAS':
      // Salieron de mi finca origen
      return transferencias.filter(t => t.esOrigen && t.estado !== 'BORRADOR')
    case 'RECIBIDAS':
      return transferencias.filter(t => t.esDestino && t.estado === 'RECIBIDA')
    case 'HISTORIAL':
      return transferencias.filter(t => ['RECIBIDA', 'RECHAZADA', 'CANCELADA'].includes(t.estado))
    default:
      return transferencias
  }
}

export default function TransferenciasTab({ fincas = [], fincaId = null }) {
  const [filtros, setFiltros] = useState({ fincaId, estado: '', buscar: '' })
  const [vista, setVista] = useState('TODAS')
  const [detalleId, setDetalleId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [loadingAction, setLoadingAction] = useState(false)

  const {
    transferencias, paginacion, loading, error,
    crearTransferencia, actualizarTransferencia,
    enviarTransferencia, aceptarTransferencia, rechazarTransferencia,
    confirmarTransferencia, cancelarTransferencia,
    marcarRecibida, agregarAnimal, quitarAnimal, refetch,
  } = useTransferencias(filtros)

  const visibles = filtrarPorVista(transferencias, vista)

  const notify = (r) => {
    setMensaje({ type: r.success ? 'success' : 'error', text: r.message })
    setTimeout(() => setMensaje(null), 4000)
  }

  const handleCrear = async (form) => {
    setLoadingAction(true)
    const result = await crearTransferencia(form)
    setLoadingAction(false)
    if (result.success) {
      notify(result)
      setFormOpen(false)
      setDetalleId(result.data?.transferencia?.id)
    }
    return result
  }

  const handleActualizar = async (form) => {
    setLoadingAction(true)
    const result = await actualizarTransferencia(editando.id, form)
    setLoadingAction(false)
    if (result.success) {
      notify(result)
      setFormOpen(false)
      setEditando(null)
    }
    return result
  }

  const openEdit = (t) => { setEditando(t); setFormOpen(true) }

  const setFiltro = (key) => (e) =>
    setFiltros(prev => ({ ...prev, [key]: e.target.value }))

  const limpiar = () => setFiltros({ fincaId, estado: '', buscar: '' })
  const hayFiltros = filtros.estado || filtros.buscar

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHorizIcon color="primary" /> Transferencias entre Fincas
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditando(null); setFormOpen(true) }}>
          Nueva Transferencia
        </Button>
      </Box>

      <PageAlert message={mensaje} onClose={() => setMensaje(null)} />

      {/* Pestañas de vista (Enviadas / Recibidas / Pendientes / Historial) */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Tabs
          value={vista}
          onChange={(_, v) => setVista(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {VISTAS.map(v => {
            const n = filtrarPorVista(transferencias, v.key).length
            return (
              <Tab
                key={v.key}
                value={v.key}
                label={
                  v.key === 'PENDIENTES' && n > 0
                    ? <Badge color="warning" badgeContent={n} sx={{ pr: 1.5 }}>{v.label}</Badge>
                    : `${v.label}${n ? ` (${n})` : ''}`
                }
              />
            )
          })}
        </Tabs>
      </Paper>

      {/* Filtros */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <TextField
            size="small" fullWidth
            placeholder="Buscar por finca, responsable..."
            value={filtros.buscar}
            onChange={setFiltro('buscar')}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                endAdornment: filtros.buscar && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setFiltros(p => ({ ...p, buscar: '' }))}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={filtros.estado} label="Estado" onChange={setFiltro('estado')}>
              {ESTADO_OPTS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
          {hayFiltros && (
            <Chip label="Limpiar" size="small" onClick={limpiar} onDelete={limpiar} />
          )}
        </Stack>
        {hayFiltros && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {paginacion.total} transferencia(s) encontrada(s)
          </Typography>
        )}
      </Paper>

      {error && <Alert severity="error">{error.message}</Alert>}

      {!loading && visibles.length === 0 ? (
        <EmptyState
          icon={SwapHorizIcon}
          title={hayFiltros ? 'No hay transferencias con esos filtros' : 'No hay transferencias registradas'}
          description={hayFiltros ? 'Intente con otros filtros.' : 'Cree una transferencia para mover animales entre fincas.'}
          onAction={() => { setEditando(null); setFormOpen(true) }}
          actionLabel="Nueva Transferencia"
          onSecondaryAction={hayFiltros ? limpiar : undefined}
        />
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Finca origen</TableCell>
                  <TableCell>Finca destino</TableCell>
                  <TableCell align="center">Animales</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Responsable</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibles.map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell>{t.fechaTransferencia}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{t.fincaOrigen?.nombre}</Typography>
                    </TableCell>
                    <TableCell>{t.fincaDestino?.nombre}</TableCell>
                    <TableCell align="center">
                      <Chip label={t.totalAnimales} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{t.motivoDisplay}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t.estadoDisplay}
                        size="small"
                        color={ESTADO_COLORS[t.estado] || 'default'}
                      />
                    </TableCell>
                    <TableCell>{t.responsable || '—'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" color="primary" onClick={() => setDetalleId(t.id)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {t.estado === 'BORRADOR' && (
                        <Tooltip title="Editar">
                          <IconButton size="small" color="warning" onClick={() => openEdit(t)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Diálogo crear/editar */}
      <TransferenciaFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditando(null) }}
        onSubmit={editando ? handleActualizar : handleCrear}
        fincas={fincas}
        transferencia={editando}
        loading={loadingAction}
      />

      {/* Diálogo detalle */}
      <TransferenciaDetalleDialog
        open={!!detalleId}
        onClose={() => { setDetalleId(null); refetch() }}
        transferenciaId={detalleId}
        fincas={fincas}
        onAgregarAnimal={agregarAnimal}
        onQuitarAnimal={quitarAnimal}
        onEnviar={enviarTransferencia}
        onAceptar={aceptarTransferencia}
        onRechazar={rechazarTransferencia}
        onCancelar={cancelarTransferencia}
        loadingAction={loadingAction}
      />
    </Box>
  )
}
