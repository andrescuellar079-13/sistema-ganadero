import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box,
} from '@mui/material'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'

/**
 * Diálogo de confirmación para operaciones destructivas.
 * Props:
 *   open         — boolean
 *   onClose      — fn: cancela
 *   onConfirm    — fn: confirma
 *   title        — string (default "¿Eliminar registro?")
 *   message      — string (default "Esta acción no se puede deshacer.")
 *   confirmLabel — string (default "Sí, eliminar")
 *   loading      — boolean (desactiva botones durante la operación)
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = '¿Eliminar registro?',
  message = 'Esta acción no se puede deshacer.',
  confirmLabel = 'Sí, eliminar',
  loading = false,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <WarningAmberOutlinedIcon sx={{ color: 'warning.main', fontSize: 22 }} />
          {title}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} size="small">
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          size="small"
          disabled={loading}
          disableElevation
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
