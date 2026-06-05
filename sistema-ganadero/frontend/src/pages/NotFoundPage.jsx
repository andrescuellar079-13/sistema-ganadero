import { useNavigate } from 'react-router-dom'
import { Box, Typography, Button } from '@mui/material'
import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '70vh', gap: 2, textAlign: 'center', px: 3,
    }}>
      <SearchOffOutlinedIcon sx={{ fontSize: 72, color: 'action.disabled' }} />
      <Typography variant="h1" sx={{ fontSize: '5rem', fontWeight: 900, color: '#E2E8F0', lineHeight: 1 }}>
        404
      </Typography>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
          Página no encontrada
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
          La ruta que buscás no existe o fue movida. Verificá la URL e intentá de nuevo.
        </Typography>
      </Box>
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => navigate('/')}
        disableElevation
        sx={{ mt: 0.5 }}
      >
        Ir al Dashboard
      </Button>
    </Box>
  )
}
