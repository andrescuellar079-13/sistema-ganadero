import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import SortIcon from '@mui/icons-material/Sort'

const ORDENAMIENTO_OPCIONES = [
  { value: '',                label: 'Más recientes'    },
  { value: 'mas_antiguas',    label: 'Más antiguas'     },
  { value: 'mayor_ocupacion', label: 'Mayor ocupación'  },
  { value: 'menor_ocupacion', label: 'Menor ocupación'  },
  { value: 'mayor_capacidad', label: 'Mayor capacidad'  },
  { value: 'menor_capacidad', label: 'Menor capacidad'  },
]

export default function ParcelaSortSelect({ value, onChange }) {
  return (
    <FormControl size="small" sx={{ minWidth: 185 }}>
      <InputLabel sx={{ fontSize: 13 }}>Ordenar por</InputLabel>
      <Select
        value={value}
        label="Ordenar por"
        onChange={(e) => onChange(e.target.value)}
        sx={{ fontSize: 13 }}
        startAdornment={
          <Box component="span" sx={{ display: 'flex', mr: 0.5 }}>
            <SortIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          </Box>
        }
      >
        {ORDENAMIENTO_OPCIONES.map((op) => (
          <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
