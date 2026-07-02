// frontend/src/components/dashboard/FinanceCard.jsx
// Tarjeta financiera (.fin-card). variant: 'hero' | 'default' | 'sky'.
// hero  → gradiente verde oscuro, número en BLANCO (regla del PASO 5).
// sky   → ícono en azul cielo (ingresos = azul).
// default → superficie neutra.
import { Box } from '@mui/material'
import { ganado } from '../../theme/ganadoTokens'
import Sym from './Sym'

export default function FinanceCard({ label, value, currency, icon, variant = 'default', sub }) {
  const isHero = variant === 'hero'
  const isSky = variant === 'sky'

  return (
    <Box sx={{
      fontFamily: ganado.font.sans,
      borderRadius: `${ganado.radius.md}px`,
      p: '19px 20px',
      position: 'relative', overflow: 'hidden',
      ...(isHero
        ? { background: `linear-gradient(135deg,${ganado.financeHero.gradFrom} 0%,${ganado.financeHero.gradTo} 100%)`, border: 'none', color: ganado.financeHero.text }
        : { bgcolor: ganado.color.surface, border: `1px solid ${ganado.color.line}` }),
    }}>
      {/* etiqueta + icono */}
      <Box sx={{
        fontSize: `${ganado.type.eyebrow}px`, fontWeight: 500, mb: '12px',
        display: 'flex', alignItems: 'center', gap: '8px',
        color: isHero ? ganado.financeHero.label : ganado.color.muted,
      }}>
        <Box sx={{
          width: 30, height: 30, borderRadius: '8px', display: 'grid', placeItems: 'center',
          ...(isHero
            ? { bgcolor: 'rgba(255,255,255,.13)' }
            : isSky
              ? { bgcolor: ganado.color.skyBg }
              : { bgcolor: ganado.color.surface2 }),
        }}>
          {icon && (
            <Sym
              name={icon}
              size={18}
              color={isHero ? ganado.financeHero.icon : isSky ? ganado.color.sky600 : ganado.color.muted}
            />
          )}
        </Box>
        {label}
      </Box>

      {/* valor (mono, instrumento) */}
      <Box sx={{
        fontFamily: ganado.font.mono, fontWeight: 600, letterSpacing: '-.5px', lineHeight: 1,
        fontSize: `${isHero ? ganado.type.financeHero : ganado.type.financeValue}px`,
        color: isHero ? ganado.financeHero.text : ganado.color.ink,
      }}>
        {currency && (
          <Box component="span" sx={{ fontSize: '.55em', opacity: .7, mr: '4px', fontWeight: 500 }}>
            {currency}
          </Box>
        )}
        {value}
      </Box>

      {/* subtítulo */}
      {sub && (
        <Box sx={{
          fontSize: '11.5px', mt: '9px', display: 'flex', alignItems: 'center', gap: '6px',
          color: isHero ? ganado.financeHero.sub : ganado.color.muted,
        }}>
          {sub}
        </Box>
      )}
    </Box>
  )
}
