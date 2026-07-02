// frontend/src/components/dashboard/AttentionStrip.jsx
// Barra "Requiere tu atención hoy" (.attention) — la firma del diseño.
// items: [{ value, label }]. Se muestra solo lo vencido/pendiente de acción.
import { Box } from '@mui/material'
import { ganado } from '../../theme/ganadoTokens'
import Sym from './Sym'

export default function AttentionStrip({
  title = 'Requiere tu atención hoy',
  subtitle = 'Concentré aquí todo lo que está vencido o pendiente de acción.',
  items = [],
}) {
  return (
    <Box sx={{
      fontFamily: ganado.font.sans,
      background: `linear-gradient(100deg,${ganado.attention.gradFrom},${ganado.attention.gradTo})`,
      border: `1px solid ${ganado.attention.border}`,
      borderLeft: `4px solid ${ganado.semantic.warn.fg}`,
      borderRadius: `${ganado.radius.md}px`,
      p: '15px 18px', mb: '26px',
      display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
    }}>
      <Box sx={{
        width: 38, height: 38, borderRadius: '10px', bgcolor: ganado.attention.iconBg, color: ganado.semantic.warn.fg,
        display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>
        <Sym name="priority_high" size={22} fill={1} />
      </Box>
      <Box>
        <Box component="b" sx={{ fontSize: '13.5px', color: ganado.attention.title }}>{title}</Box>
        <Box sx={{ fontSize: '12.5px', color: ganado.attention.subtitle, mt: '1px' }}>{subtitle}</Box>
      </Box>
      <Box sx={{ display: 'flex', gap: '20px', flexWrap: 'wrap', ml: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>
        {items.map((it, i) => (
          <Box key={i} sx={{ textAlign: 'center' }}>
            <Box component="strong" sx={{ display: 'block', fontFamily: ganado.font.mono, fontSize: '19px', color: ganado.attention.value, fontWeight: 600 }}>
              {it.value}
            </Box>
            <Box component="span" sx={{ fontSize: '10.5px', color: ganado.attention.label, letterSpacing: '.2px' }}>
              {it.label}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
