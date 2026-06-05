import { Card, CardContent, Box, Typography } from '@mui/material'
import TrendingUpIcon   from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

export default function DashboardCard({ title, value, icon: IconComp, accent = '#2E7D32', trend }) {
  return (
    <Card elevation={0} sx={{ borderLeft: `4px solid ${accent}` }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.75 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.1 }}>
              {value ?? '—'}
            </Typography>
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
