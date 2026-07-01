import { Card, CardContent, Box, Typography } from '@mui/material'
import TrendingUpIcon   from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

export default function DashboardCard({ title, value, icon: IconComp, accent = '#2E7D32', trend, subtitle, onClick, highlight = false }) {
  const clickable = typeof onClick === 'function'
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        borderLeft: `4px solid ${accent}`,
        height: '100%',
        transition: 'box-shadow .15s, transform .15s',
        ...(highlight && { bgcolor: accent + '0A' }),
        ...(clickable && {
          cursor: 'pointer',
          '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
        }),
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.75 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.1 }}>
              {value ?? '—'}
            </Typography>
            {subtitle != null && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
            {trend != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {trend > 0
                  ? <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} />
                  : <TrendingDownIcon sx={{ fontSize: 14, color: 'error.main' }} />
                }
                <Typography variant="caption" sx={{ color: trend > 0 ? 'success.main' : 'error.main', fontWeight: 500 }}>
                  {Math.abs(trend)}% vs mes anterior
                </Typography>
              </Box>
            )}
          </Box>
          {IconComp && (
            <Box sx={{
              width: 44, height: 44, borderRadius: 2, flexShrink: 0,
              bgcolor: accent + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconComp sx={{ fontSize: 22, color: accent }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
