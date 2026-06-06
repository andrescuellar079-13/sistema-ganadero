import { Box, Chip, Typography } from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'

const ESTADO_OPCIONES = [
  { value: '',         label: 'Todos'     },
  { value: 'ACTIVO',   label: 'Activos'   },
  { value: 'VENDIDO',  label: 'Vendidos'  },
  { value: 'BAJA',     label: 'Baja'      },
  { value: 'MUERTO',   label: 'Muertos'   },
  { value: 'DESCARTE', label: 'Descarte'  },
  { value: 'MATADERO', label: 'Matadero'  },
]

export default function AnimalFilters({ estado, onEstado }) {
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
          color={estado === op.value ? 'primary' : 'default'}
          variant={estado === op.value ? 'filled' : 'outlined'}
          sx={{ borderRadius: 1.5, fontWeight: estado === op.value ? 700 : 400, cursor: 'pointer' }}
        />
      ))}
    </Box>
  )
}
