// frontend/src/components/AdvertenciaRetiro.jsx
// Banner reutilizable de advertencia de "tiempo de retiro" (inocuidad alimentaria).
// Se usa en Sanidad, Producción, Ventas/Bajas y AnimalDetailModal.
//
//  - Sin props: muestra todos los animales de la finca activa en período de retiro.
//  - Con `animalId`: muestra la advertencia solo para ese animal (o no muestra nada).
import { useQuery } from '@apollo/client'
import { Alert, AlertTitle, Box, Chip, Stack, Typography } from '@mui/material'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { GET_ANIMALES_EN_RETIRO } from '../graphql/sanidad'

const tipoLabel = (tipo) =>
  tipo === 'CARNE' ? 'Retiro de carne'
    : tipo === 'LECHE' ? 'Retiro de leche'
      : 'Retiro de carne y leche'

const fmt = (d) => (d ? new Date(d).toLocaleDateString('es-PY') : '—')

export default function AdvertenciaRetiro({ animalId = null, fincaId: fincaIdProp, sx }) {
  const fincaId = fincaIdProp || localStorage.getItem('fincaId') || '1'

  const { data } = useQuery(GET_ANIMALES_EN_RETIRO, {
    variables: { fincaId },
    fetchPolicy: 'cache-and-network',
  })

  let retiros = data?.animalesEnRetiro || []
  if (animalId != null) {
    retiros = retiros.filter((r) => String(r.animal?.id) === String(animalId))
  }

  if (retiros.length === 0) return null

  const perAnimal = animalId != null

  return (
    <Alert
      severity="warning"
      icon={<WarningAmberOutlinedIcon />}
      sx={{ borderRadius: 2, alignItems: 'flex-start', ...sx }}
    >
      <AlertTitle sx={{ fontWeight: 700 }}>
        {perAnimal
          ? 'Animal en tiempo de retiro'
          : `${retiros.length} animal(es) en tiempo de retiro`}
      </AlertTitle>

      <Typography variant="body2" sx={{ mb: retiros.length ? 1 : 0 }}>
        No destinar a venta ni su carne/leche al consumo hasta finalizar el período de retiro.
      </Typography>

      <Stack spacing={0.75}>
        {retiros.map((r) => (
          <Box
            key={r.id}
            sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}
          >
            <Typography variant="body2" fontWeight={600}>
              {r.animal?.nroArete}
              {r.animal?.nombre ? ` · ${r.animal.nombre}` : ''}
            </Typography>
            <Chip size="small" label={tipoLabel(r.tipoRetiro)} sx={{ fontSize: 11 }} />
            <Typography variant="caption" color="text.secondary">
              hasta {fmt(r.fechaFin)}
            </Typography>
            <Chip
              size="small"
              label={`${r.diasRestantes} día(s) restantes`}
              sx={
                r.diasRestantes <= 3
                  ? { bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 600 }
                  : { bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600 }
              }
            />
          </Box>
        ))}
      </Stack>
    </Alert>
  )
}
