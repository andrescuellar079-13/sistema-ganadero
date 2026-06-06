import { Chip } from '@mui/material'

// Mapa de valores conocidos → color MUI + label
const PRESET = {
  // booleanos / string "activo"
  true:         { color: 'success', label: 'Activo'      },
  false:        { color: 'default', label: 'Inactivo'    },
  ACTIVO:       { color: 'success', label: 'Activo'      },
  INACTIVO:     { color: 'default', label: 'Inactivo'    },
  LICENCIA:     { color: 'warning', label: 'Licencia'    },
  VACACIONES:   { color: 'info',    label: 'Vacaciones'  },
  // estados operativos de parcela
  LIBRE:    { color: 'success', label: 'Libre'    },
  OCUPADO:  { color: 'primary', label: 'Ocupado'  },
  DESCANSO: { color: 'warning', label: 'Descanso' },
  // estados de animal
  VENDIDO:      { color: 'default', label: 'Vendido'     },
  MUERTO:       { color: 'error',   label: 'Muerto'      },
  BAJA:         { color: 'error',   label: 'Baja'        },
}

/**
 * Chip de estado semántico.
 * Props:
 *   value  — boolean | string: valor del estado
 *   label  — string (opcional): sobreescribe el label del preset
 *   color  — string (opcional): sobreescribe el color del preset
 */
export default function StatusChip({ value, label, color }) {
  const key   = value === true ? 'true' : value === false ? 'false' : String(value)
  const preset = PRESET[key] ?? { color: 'default', label: String(value) }

  return (
    <Chip
      label={label ?? preset.label}
      color={color ?? preset.color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  )
}
