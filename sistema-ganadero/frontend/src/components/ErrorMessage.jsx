import { Box, Alert, Button, Typography } from '@mui/material'

export default function ErrorMessage({ message, onRetry = null }) {
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 2, py: 8, px: 3,
    }}>
      <Alert
        severity="error"
        sx={{ width: '100%', maxWidth: 480, borderRadius: 2 }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Ocurrió un error
        </Typography>
        <Typography variant="body2">{message}</Typography>
      </Alert>
      {onRetry && (
        <Button variant="contained" color="error" size="small" onClick={onRetry}
          disableElevation>
          Reintentar
        </Button>
      )}
    </Box>
  )
}
