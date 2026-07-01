import { Card, CardContent, Box, Typography } from '@mui/material'
import TrendingUpIcon   from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

export default function DashboardCard({ title, value, icon: IconComp, accent = '#047857', trend, subtitle, onClick, highlight = false }) {
  const clickable = typeof onClick === 'function'
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        borderRadius: '16px',
        border: '1px solid #EAECF0',
        bgcolor: '#fff',
        boxShadow: '0 1px 2px rgba(16,24,40,0.05)',
        transition: 'box-shadow .2s ease, transform .2s ease, border-color .2s ease',
        // Barra de acento superior sutil (color por prioridad)
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          bgcolor: accent,
          opacity: highlight ? 1 : 0.85,
        },
        ...(highlight && { bgcolor: accent + '08' }),
        ...(clickable && {
          cursor: 'pointer',
          '&:hover': {
            boxShadow: '0 10px 28px rgba(16,24,40,0.10)',
            transform: 'translateY(-3px)',
            borderColor: accent + '55',
          },
        }),
      }}
    >
      <CardContent sx={{ p: 2.5, pt: 2.75, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.75, fontSize: '0.8rem' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.05, letterSpacing: -0.5, fontSize: '1.75rem' }}>
              {value ?? '—'}
            </Typography>
            {subtitle != null && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, fontWeight: 500 }}>
                {subtitle}
              </Typography>
            )}
            {trend != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {trend > 0
                  ? <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} />
                  : <TrendingDownIcon sx={{ fontSize: 14, color: 'error.main' }} />
                }
                <Typography variant="caption" sx={{ color: trend > 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                  {Math.abs(trend)}% vs mes anterior
                </Typography>
              </Box>
            )}
          </Box>
          {IconComp && (
            <Box sx={{
              width: 46, height: 46, borderRadius: '12px', flexShrink: 0,
              bgcolor: accent + '16',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconComp sx={{ fontSize: 23, color: accent }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
