// frontend/src/components/AlertaCard.jsx
import { useState } from 'react'
import {
  Card, CardContent, Box, Typography, Chip, IconButton, Tooltip,
  Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, TextField,
} from '@mui/material'
import MoreVertIcon            from '@mui/icons-material/MoreVert'
import DoneOutlinedIcon        from '@mui/icons-material/DoneOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import BlockOutlinedIcon       from '@mui/icons-material/BlockOutlined'
import DeleteOutlinedIcon      from '@mui/icons-material/DeleteOutlined'

const ICONO_TIPO = {
  VACUNA_PROXIMA: '💉',
  VACUNA_VENCIDA: '⚠️',
  PARTO_PROXIMO: '🤰',
  STOCK_BAJO_MEDICAMENTO: '💊',
  STOCK_BAJO_ALIMENTO: '🌾',
  PESAJE_PENDIENTE: '⚖️',
  TRANSFERENCIA_PENDIENTE: '🔁',
  OTRO: '📢',
}

const COLOR_PRIORIDAD = {
  BAJA:    { bg: '#F1F5F9', color: '#475569', accent: '#94A3B8' },
  MEDIA:   { bg: '#E3F2FD', color: '#1565C0', accent: '#1976D2' },
  ALTA:    { bg: '#FFF3E0', color: '#E65100', accent: '#FB8C00' },
  CRITICA: { bg: '#FFEBEE', color: '#C62828', accent: '#E53935' },
}

const COLOR_ESTADO = {
  PENDIENTE:  'warning',
  LEIDA:      'info',
  EN_PROCESO: 'primary',
  RESUELTA:   'success',
  DESCARTADA: 'default',
}

const LABEL_ESTADO = {
  PENDIENTE: 'Pendiente',
  LEIDA: 'Leída',
  EN_PROCESO: 'En proceso',
  RESUELTA: 'Resuelta',
  DESCARTADA: 'Descartada',
}

const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin fecha'
  return new Date(fecha).toLocaleDateString('es-PY')
}

export default function AlertaCard({ alerta, onMarcarLeida, onEnProceso, onResolver, onDescartar, onEliminar }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const [dialog, setDialog]     = useState(null) // 'resolver' | 'descartar' | null
  const [observacion, setObservacion] = useState('')

  const prioridad = alerta.prioridad || 'MEDIA'
  const estado    = alerta.estado || 'PENDIENTE'
  const pr        = COLOR_PRIORIDAD[prioridad] || COLOR_PRIORIDAD.MEDIA
  const cerrada   = estado === 'RESUELTA' || estado === 'DESCARTADA'

  const openMenu  = (e) => setAnchorEl(e.currentTarget)
  const closeMenu = () => setAnchorEl(null)

  const abrirDialog = (tipo) => { setObservacion(''); setDialog(tipo); closeMenu() }

  const confirmarDialog = () => {
    if (dialog === 'resolver') onResolver(alerta.id, observacion || null)
    if (dialog === 'descartar') onDescartar(alerta.id, observacion || null)
    setDialog(null)
  }

  return (
    <>
      <Card
        elevation={0}
        sx={{
          border: '1px solid #E2E8F0',
          borderLeft: `4px solid ${pr.accent}`,
          borderRadius: 2,
          mb: 1.5,
          opacity: cerrada ? 0.7 : 1,
        }}
      >
        <CardContent sx={{ p: '14px 16px !important', display: 'flex', gap: 1.5 }}>
          <Box sx={{ fontSize: 24, lineHeight: 1 }}>{ICONO_TIPO[alerta.tipo] || '🔔'}</Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center', mb: 0.5 }}>
              <Chip
                size="small"
                label={prioridad}
                sx={{ bgcolor: pr.bg, color: pr.color, fontWeight: 700, height: 20, fontSize: 11 }}
              />
              <Chip
                size="small"
                color={COLOR_ESTADO[estado] || 'default'}
                label={LABEL_ESTADO[estado] || estado}
                variant="outlined"
                sx={{ height: 20, fontSize: 11 }}
              />
              {alerta.vencida && (
                <Chip size="small" color="error" label="Vencida" sx={{ height: 20, fontSize: 11 }} />
              )}
              <Typography variant="body2" fontWeight={700} sx={{ color: '#334155' }}>
                {(alerta.tipo || 'Alerta').replace(/_/g, ' ')}
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: '#475569' }}>{alerta.mensaje}</Typography>

            {alerta.accionRecomendada && (
              <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic', display: 'block', mt: 0.25 }}>
                💡 {alerta.accionRecomendada}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 0.75, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">📅 {formatearFecha(alerta.fechaAlerta)}</Typography>
              {alerta.fechaVencimiento && (
                <Typography variant="caption" color="text.secondary">⏳ Vence: {formatearFecha(alerta.fechaVencimiento)}</Typography>
              )}
              {typeof alerta.diasRestantes === 'number' && alerta.diasRestantes !== 0 && (
                <Typography variant="caption" color="text.secondary">
                  ⏰ {alerta.diasRestantes > 0 ? `${alerta.diasRestantes} días restantes` : `${Math.abs(alerta.diasRestantes)} días de atraso`}
                </Typography>
              )}
              {alerta.animal && (
                <Typography variant="caption" color="text.secondary">🐄 {alerta.animal.nroArete} - {alerta.animal.nombre || 'Sin nombre'}</Typography>
              )}
            </Box>
          </Box>

          <Tooltip title="Acciones">
            <IconButton size="small" onClick={openMenu}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </CardContent>
      </Card>

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={closeMenu}>
        {!alerta.leida && (
          <MenuItem onClick={() => { onMarcarLeida(alerta.id); closeMenu() }}>
            <ListItemIcon><DoneOutlinedIcon fontSize="small" color="info" /></ListItemIcon>
            <ListItemText>Marcar como leída</ListItemText>
          </MenuItem>
        )}
        {!cerrada && (
          <MenuItem onClick={() => { onEnProceso(alerta.id); closeMenu() }}>
            <ListItemIcon><PendingActionsOutlinedIcon fontSize="small" color="primary" /></ListItemIcon>
            <ListItemText>Marcar en proceso</ListItemText>
          </MenuItem>
        )}
        {!cerrada && (
          <MenuItem onClick={() => abrirDialog('resolver')}>
            <ListItemIcon><CheckCircleOutlinedIcon fontSize="small" color="success" /></ListItemIcon>
            <ListItemText>Resolver alerta</ListItemText>
          </MenuItem>
        )}
        {!cerrada && (
          <MenuItem onClick={() => abrirDialog('descartar')}>
            <ListItemIcon><BlockOutlinedIcon fontSize="small" color="action" /></ListItemIcon>
            <ListItemText>Descartar alerta</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => { onEliminar(alerta.id); closeMenu() }}>
          <ListItemIcon><DeleteOutlinedIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialog === 'resolver' ? 'Resolver alerta' : 'Descartar alerta'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{alerta.mensaje}</Typography>
          <TextField
            label="Observación (opcional)"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialog(null)} variant="outlined" color="inherit">Cancelar</Button>
          <Button
            onClick={confirmarDialog}
            variant="contained"
            color={dialog === 'resolver' ? 'success' : 'warning'}
          >
            {dialog === 'resolver' ? 'Resolver' : 'Descartar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
