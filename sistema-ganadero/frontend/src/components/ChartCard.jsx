import { Paper, Typography, Box } from '@mui/material'

export default function ChartCard({ title, children }) {
  return (
    <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, p: 2.5 }}>
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, color: 'text.primary', mb: 2, fontSize: '0.9rem' }}
      >
        {title}
      </Typography>
      <Box sx={{ height: 256 }}>
        {children}
      </Box>
    </Paper>
  )
}
