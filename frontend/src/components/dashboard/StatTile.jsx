// frontend/src/components/dashboard/StatTile.jsx
// Tarjeta de métrica (.tile de la referencia). El COLOR NO se hardcodea aquí:
// llega ya resuelto vía `state` (ver PASO 3 · resolverEstado). Solo warn/crit
// "encienden" la barra lateral izquierda.
import { Box } from '@mui/material'
import { ganado, STATE_STYLES } from '../../theme/ganadoTokens'
import Sym from './Sym'

export default function StatTile({
  label, value, unit, icon, state = 'calm', foot, onClick, index = 0,
}) {
  const s = STATE_STYLES[state] || STATE_STYLES.calm
  const clickable = typeof onClick === 'function'
  const footNode = foot ? (typeof foot === 'string' ? { text: foot } : foot) : null

  return (
    <Box
      component={clickable ? 'button' : 'article'}
      type={clickable ? 'button' : undefined}
      onClick={onClick}
      data-state={state}
      sx={{
        // reset para <button>
        textAlign: 'left', width: '100%', appearance: 'none',
        fontFamily: ganado.font.sans,
        bgcolor: ganado.color.surface,
        border: `1px solid ${s.borderColor}`,
        borderRadius: `${ganado.radius.md}px`,
        p: '17px 17px 15px',
        position: 'relative', overflow: 'hidden',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
        animation: 'ganadoRise .5s cubic-bezier(.2,.7,.2,1) both',
        animationDelay: `${Math.min(index, 6) * 0.04}s`,
        '@keyframes ganadoRise': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        ...(s.accentBar && {
          '&::before': {
            content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
            bgcolor: s.accentBar,
          },
        }),
        ...(clickable && {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: ganado.shadow.hover,
            borderColor: ganado.color.lineStrong,
          },
        }),
        '&:focus-visible': { outline: `2px solid ${ganado.color.primary}`, outlineOffset: 2 },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none', transition: 'none' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', mb: '14px' }}>
        <Box sx={{ fontSize: `${ganado.type.label}px`, fontWeight: 500, color: ganado.color.muted, lineHeight: 1.3, maxWidth: 130 }}>
          {label}
        </Box>
        <Box sx={{
          width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
          display: 'grid', placeItems: 'center', bgcolor: s.icBg, color: s.icFg,
        }}>
          {icon && <Sym name={icon} size={19} />}
        </Box>
      </Box>

      <Box sx={{
        fontFamily: ganado.font.mono, fontSize: `${ganado.type.metricValue}px`, fontWeight: 600,
        letterSpacing: ganado.type.metricTracking, lineHeight: 1, color: s.valueColor,
      }}>
        {value}
        {unit && (
          <Box component="span" sx={{ fontFamily: ganado.font.sans, fontSize: `${ganado.type.metricUnit}px`, color: ganado.color.muted, fontWeight: 500, ml: '3px' }}>
            {unit}
          </Box>
        )}
      </Box>

      {footNode && (
        <Box sx={{ fontSize: `${ganado.type.foot}px`, color: s.footColor, mt: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          {footNode.icon && <Sym name={footNode.icon} size={14} />}
          {footNode.text}
        </Box>
      )}
    </Box>
  )
}
