// frontend/src/components/dashboard/ActionRow.jsx
// Fila de acción pendiente (.action-row): icono + label + contador mono + chevron.
import { Box } from '@mui/material'
import { ganado } from '../../theme/ganadoTokens'
import Sym from './Sym'

export default function ActionRow({ icon, label, count, onClick }) {
  const clickable = typeof onClick === 'function'
  return (
    <Box
      component={clickable ? 'button' : 'div'}
      type={clickable ? 'button' : undefined}
      onClick={onClick}
      tabIndex={clickable ? 0 : undefined}
      sx={{
        width: '100%', textAlign: 'left', appearance: 'none', bgcolor: 'transparent',
        fontFamily: ganado.font.sans,
        display: 'flex', alignItems: 'center', gap: '12px',
        p: '11px 6px', borderRadius: '8px',
        borderTop: `1px solid ${ganado.color.line}`,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'background .15s',
        '&:first-of-type': { borderTop: 'none' },
        '&:hover': clickable ? { bgcolor: ganado.color.surface2 } : {},
        '&:focus-visible': { outline: `2px solid ${ganado.color.primary}`, outlineOffset: 2 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      <Box sx={{
        width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
        bgcolor: ganado.color.surface2, color: ganado.color.muted, display: 'grid', placeItems: 'center',
      }}>
        {icon && <Sym name={icon} size={18} />}
      </Box>
      <Box sx={{ fontSize: '13px', fontWeight: 500, flex: 1, color: ganado.color.ink }}>{label}</Box>
      <Box sx={{
        fontFamily: ganado.font.mono, fontWeight: 600, fontSize: '12.5px',
        bgcolor: ganado.color.surface2, color: ganado.color.ink, p: '2px 9px', borderRadius: '20px',
      }}>
        {count}
      </Box>
      {clickable && <Sym name="chevron_right" size={18} color={ganado.color.muted2} />}
    </Box>
  )
}
