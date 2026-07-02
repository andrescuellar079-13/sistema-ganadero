// frontend/src/components/dashboard/SectionHeader.jsx
// Encabezado de sección (.section-head): barra de acento + eyebrow + conteo opcional.
import { Box } from '@mui/material'
import { ganado } from '../../theme/ganadoTokens'

export default function SectionHeader({ title, count }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '13px', fontFamily: ganado.font.sans }}>
      <Box sx={{ width: 4, height: 16, borderRadius: '3px', bgcolor: ganado.color.primary }} />
      <Box component="h2" sx={{
        fontSize: `${ganado.type.eyebrow}px`, fontWeight: 600, letterSpacing: ganado.type.eyebrowTracking,
        textTransform: 'uppercase', color: ganado.color.muted, m: 0,
      }}>
        {title}
      </Box>
      {count != null && (
        <Box sx={{ fontFamily: ganado.font.mono, fontSize: '11px', color: ganado.color.muted2, ml: 'auto' }}>
          {count}
        </Box>
      )}
    </Box>
  )
}
