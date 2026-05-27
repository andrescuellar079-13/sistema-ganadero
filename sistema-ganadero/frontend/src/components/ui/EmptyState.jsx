import { Box, Typography, Button } from '@mui/material'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'

/**
 * Estado vacío estándar para listados sin datos.
 * Props:
 *   icon        — MUI icon component (default InboxOutlined)
 *   title       — string
 *   description — string (opcional)
 *   onAction    — fn: acción del botón (opcional)
 *   actionLabel — string (default "Crear primero")
 */
export default function EmptyState({
  icon: IconComp = InboxOutlinedIcon,
  title = 'Sin registros',
  description,
  onAction,
  actionLabel = 'Crear primero',
}) {
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', py: 10, gap: 1.5, textAlign: 'center',
    }}>
      <Box sx={{
        width: 56, height: 56, borderRadius: 3,
        bgcolor: 'action.hover',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconComp sx={{ fontSize: 28, color: 'text.disabled' }} />
      </Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 300 }}>
          {description}
        </Typography>
      )}
      {onAction && (
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={onAction}
          sx={{ mt: 0.5 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}
