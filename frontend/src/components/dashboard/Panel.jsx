// frontend/src/components/dashboard/Panel.jsx
// Contenedor con encabezado (.panel + .panel-head): icono en tint + título + pill opcional.
import { Box } from '@mui/material'
import { ganado } from '../../theme/ganadoTokens'
import Sym from './Sym'

export default function Panel({ title, icon, pill, children, sx }) {
  return (
    <Box sx={{
      fontFamily: ganado.font.sans,
      bgcolor: ganado.color.surface,
      border: `1px solid ${ganado.color.line}`,
      borderRadius: `${ganado.radius.md}px`,
      p: '18px 20px',
      ...sx,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '9px', mb: '14px' }}>
        <Box sx={{
          width: 30, height: 30, borderRadius: '8px', display: 'grid', placeItems: 'center',
          bgcolor: ganado.color.primaryTint, color: ganado.color.primary,
        }}>
          {icon && <Sym name={icon} size={18} />}
        </Box>
        <Box component="h3" sx={{ fontSize: '14px', fontWeight: 600, m: 0, color: ganado.color.ink }}>{title}</Box>
        {pill != null && (
          <Box sx={{
            ml: 'auto', bgcolor: ganado.semantic.warn.bg, color: ganado.semantic.warn.fg,
            fontSize: '11px', fontWeight: 600, p: '3px 9px', borderRadius: '20px',
          }}>
            {pill}
          </Box>
        )}
      </Box>
      {children}
    </Box>
  )
}
