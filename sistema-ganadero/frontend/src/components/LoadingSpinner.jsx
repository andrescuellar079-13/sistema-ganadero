import { CircularProgress, Box, Typography } from '@mui/material'

export default function LoadingSpinner({ fullScreen = false, message = '' }) {
  const inner = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
      <CircularProgress size={40} thickness={4} sx={{ color: 'primary.main' }} />
      {message && (
        <Typography variant="body2" color="text.secondary">{message}</Typography>
      )}
    </Box>
  )

  if (fullScreen) {
    return (
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(4px)',
      }}>
        {inner}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
      {inner}
    </Box>
  )
}
