import { Box, Chip, Divider, Tooltip, Typography } from '@mui/material'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import FilterListIcon from '@mui/icons-material/FilterList'

const ESTADO_OPCIONES = [
  { value: '',         label: 'Todos'    },
  { value: 'LIBRE',    label: 'Libre'    },
  { value: 'OCUPADO',  label: 'Ocupado'  },
  { value: 'DESCANSO', label: 'Descanso' },
]

const TEMPORAL_OPCIONES = [
  {
    value: '',
    label: 'Todos',
    tooltip: 'Muestra todas las parcelas',
  },
  {
    value: 'ULTIMOS_MOVIMIENTOS',
    label: 'Últimos movimientos',
    tooltip: 'Parcelas con actividad reciente (últimos 30 días)',
  },
  {
    value: 'ANIMALES_RECIENTES',
    label: 'Animales recientes',
    tooltip: 'Parcelas donde ingresaron animales recientemente (últimos 30 días)',
  },
  {
    value: 'MOVIMIENTOS_RECIENTES',
    label: 'Movimientos recientes',
    tooltip: 'Parcelas con ingresos o salidas recientes (últimos 30 días)',
  },
]

export default function ParcelaFilters({ estado, temporal, onEstado, onTemporal }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
        <FilterListIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Estado
        </Typography>
      </Box>

      {ESTADO_OPCIONES.map((op) => (
        <Chip
          key={op.value}
          label={op.label}
          size="small"
          onClick={() => onEstado(op.value)}
          color={estado === op.value ? 'success' : 'default'}
          variant={estado === op.value ? 'filled' : 'outlined'}
          sx={{ borderRadius: 1.5, fontWeight: estado === op.value ? 700 : 400, cursor: 'pointer' }}
        />
      ))}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
        <AccessTimeOutlinedIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Período
        </Typography>
      </Box>

      {TEMPORAL_OPCIONES.map((op) => (
        <Tooltip key={op.value} title={op.tooltip} arrow placement="top">
          <Chip
            label={op.label}
            size="small"
            onClick={() => onTemporal(op.value)}
            color={temporal === op.value ? 'secondary' : 'default'}
            variant={temporal === op.value ? 'filled' : 'outlined'}
            sx={{ borderRadius: 1.5, fontWeight: temporal === op.value ? 700 : 400, cursor: 'pointer' }}
          />
        </Tooltip>
      ))}
    </Box>
  )
}
