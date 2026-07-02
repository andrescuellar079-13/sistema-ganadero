// frontend/src/components/dashboard/Sym.jsx
// Icono Material Symbols Rounded — parte del design system del dashboard.
// Renderiza el glifo por nombre (ej. "water_drop"), igual que la referencia HTML.
import { Box } from '@mui/material'
import { ganado } from '../../theme/ganadoTokens'

export default function Sym({ name, size = 20, fill = 0, color = 'inherit', sx }) {
  return (
    <Box
      component="span"
      className="material-symbols-rounded"
      aria-hidden="true"
      sx={{
        fontFamily: ganado.font.icons,
        fontSize: size,
        lineHeight: 1,
        color,
        flexShrink: 0,
        userSelect: 'none',
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        ...sx,
      }}
    >
      {name}
    </Box>
  )
}
