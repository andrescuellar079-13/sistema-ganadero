// frontend/src/components/AlertasList.jsx
import { Box, Paper, Typography } from '@mui/material'
import NotificationsOffOutlinedIcon from '@mui/icons-material/NotificationsOffOutlined'
import AlertaCard from './AlertaCard'

export default function AlertasList({
  alertas, titulo,
  onMarcarLeida, onEnProceso, onResolver, onDescartar, onEliminar,
}) {
  if (!alertas || alertas.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 6, textAlign: 'center' }}>
        <NotificationsOffOutlinedIcon sx={{ fontSize: 40, color: '#CBD5E1' }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No hay alertas para mostrar
        </Typography>
      </Paper>
    )
  }

  return (
    <Box>
      {titulo && (
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          {titulo} ({alertas.length})
        </Typography>
      )}
      {alertas.map((alerta) => (
        <AlertaCard
          key={alerta.id}
          alerta={alerta}
          onMarcarLeida={onMarcarLeida}
          onEnProceso={onEnProceso}
          onResolver={onResolver}
          onDescartar={onDescartar}
          onEliminar={onEliminar}
        />
      ))}
    </Box>
  )
}
