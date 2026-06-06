import { useNavigate } from 'react-router-dom'
import { Box, Typography, Button, Paper } from '@mui/material'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', bgcolor: 'background.default', p: 3,
    }}>
      <Paper elevation={0} sx={{
        border: '1px solid #E2E8F0', borderRadius: 4,
        p: 5, maxWidth: 400, textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      }}>
        <Box sx={{
          width: 64, height: 64, borderRadius: 3,
          bgcolor: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BlockOutlinedIcon sx={{ fontSize: 32, color: 'error.main' }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main', mb: 0.5 }}>
            Acceso Denegado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No tenés permisos suficientes para acceder a esta página. Contactá al administrador si creés que es un error.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => navigate('/')}
          fullWidth
          disableElevation
        >
          Volver al Dashboard
        </Button>
      </Paper>
    </Box>
  )
}
