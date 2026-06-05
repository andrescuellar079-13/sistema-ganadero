import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import SortIcon from '@mui/icons-material/Sort'

const ORDENAMIENTO_OPCIONES = [
  { value: 'recientes',       label: 'Más recientes'           },
  { value: 'antiguos',        label: 'Más antiguos'            },
  { value: 'arete_az',        label: 'Arete A-Z'               },
  { value: 'arete_za',        label: 'Arete Z-A'               },
  { value: 'nombre_az',       label: 'Nombre A-Z'              },
  { value: 'nombre_za',       label: 'Nombre Z-A'              },
  { value: 'mayor_peso',      label: 'Mayor peso'              },
  { value: 'menor_peso',      label: 'Menor peso'              },
  { value: 'mayor_edad',      label: 'Mayor edad'              },
  { value: 'menor_edad',      label: 'Menor edad'              },
  { value: 'activos_primero', label: 'Activos primero'         },
  { value: 'bajas_final',     label: 'Vendidos/Bajas al final' },
]

const VALID_VALUES = ORDENAMIENTO_OPCIONES.map(o => o.value)

export default function AnimalSortSelect({ value, onChange }) {
  const selectValue = VALID_VALUES.includes(value) ? value : 'recientes'

  return (
    <FormControl size="small" sx={{ minWidth: 220 }}>
      <InputLabel sx={{ fontSize: 13 }}>Ordenar por</InputLabel>
      <Select
        value={selectValue}
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
