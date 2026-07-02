// frontend/src/components/dashboard/DonutChart.jsx
// Donut por conic-gradient (.donut) + leyenda. Maneja N segmentos.
// segments: [{ name, value, color? }] · total (número) · label (texto del centro).
import { Box } from '@mui/material'
import { ganado } from '../../theme/ganadoTokens'

export default function DonutChart({ segments = [], total, label = 'TOTAL' }) {
  const suma = segments.reduce((acc, s) => acc + (s.value || 0), 0)
  const totalMostrado = total != null ? total : suma
  const base = suma || 1 // evita división por cero

  // Construye los tramos del conic-gradient acumulando porcentajes.
  // Se usa reduce (sin reasignar variables de closure) para los prefijos.
  const tramos = segments.reduce((arr, s, i) => {
    const prev = i === 0 ? 0 : arr[i - 1].accEnd
    const accEnd = prev + (s.value || 0)
    const color = s.color || ganado.categoryRamp[i % ganado.categoryRamp.length]
    arr.push({
      ...s,
      color,
      accEnd,
      start: (prev / base) * 100,
      end: (accEnd / base) * 100,
      pct: ((s.value || 0) / base) * 100,
    })
    return arr
  }, [])

  const gradiente = tramos.length
    ? `conic-gradient(${tramos.map((t) => `${t.color} ${t.start}% ${t.end}%`).join(',')})`
    : ganado.color.surface2

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '26px', flexWrap: 'wrap', fontFamily: ganado.font.sans }}>
      <Box sx={{
        width: 158, height: 158, borderRadius: '50%', flexShrink: 0, position: 'relative',
        background: gradiente,
        '&::after': { content: '""', position: 'absolute', inset: '26px', borderRadius: '50%', bgcolor: ganado.color.surface },
      }}>
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center', zIndex: 2 }}>
          <Box component="b" sx={{ fontFamily: ganado.font.mono, fontSize: `${ganado.type.donutCenter}px`, fontWeight: 600, lineHeight: 1 }}>
            {totalMostrado}
          </Box>
          <Box component="span" sx={{ fontSize: '10.5px', color: ganado.color.muted, letterSpacing: '.4px' }}>
            {label}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '9px', flex: 1, minWidth: 180 }}>
        {tramos.map((t, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', flexShrink: 0, bgcolor: t.color }} />
            <Box sx={{ color: ganado.color.ink, fontWeight: 500 }}>{t.name}</Box>
            <Box sx={{ ml: 'auto', fontFamily: ganado.font.mono, fontWeight: 600, color: ganado.color.muted }}>{t.value}</Box>
            <Box sx={{ fontSize: '11px', color: ganado.color.muted2, width: 40, textAlign: 'right' }}>{t.pct.toFixed(1)}%</Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
