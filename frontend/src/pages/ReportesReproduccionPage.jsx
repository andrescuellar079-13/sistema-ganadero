// frontend/src/pages/ReportesReproduccionPage.jsx
import { useReproduccion } from '../hooks/useReproduccion'
import ReportesReproduccion from '../components/ReportesReproduccion'
import LoadingSpinner from '../components/LoadingSpinner'
import { Box, Typography } from '@mui/material'

export default function ReportesReproduccionPage() {
  const { 
    reproducciones, 
    inseminaciones, 
    vacasPrenadas,
    diagnosticos,
    celos,
    palpaciones,
    destetes,
    loading 
  } = useReproduccion()

  if (loading) return <LoadingSpinner />

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        📊 Reportes de Reproducción
      </Typography>
      <ReportesReproduccion 
        partos={reproducciones}
        inseminaciones={inseminaciones}
        vacasPrenadas={vacasPrenadas}
        diagnosticos={diagnosticos}
        celos={celos}
        palpaciones={palpaciones}
        destetes={destetes}
      />
    </Box>
  )
}