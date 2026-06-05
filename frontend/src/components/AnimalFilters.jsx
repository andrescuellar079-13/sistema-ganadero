import { useState } from 'react'
import {
  Box, Chip, Typography, TextField, Button, Collapse, Divider,
} from '@mui/material'
import FilterListIcon          from '@mui/icons-material/FilterList'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import TuneOutlinedIcon        from '@mui/icons-material/TuneOutlined'
import KeyboardArrowDownIcon   from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon     from '@mui/icons-material/KeyboardArrowUp'
import ScaleOutlinedIcon       from '@mui/icons-material/ScaleOutlined'

const ESTADO_OPCIONES = [
  { value: '',         label: 'Todos'    },
  { value: 'ACTIVO',   label: 'Activos'  },
  { value: 'VENDIDO',  label: 'Vendidos' },
  { value: 'BAJA',     label: 'Baja'     },
  { value: 'MUERTO',   label: 'Muertos'  },
  { value: 'DESCARTE', label: 'Descarte' },
  { value: 'MATADERO', label: 'Matadero' },
]

const SEXO_OPCIONES = [
  { value: '',       label: 'Todos'   },
  { value: 'MACHO',  label: 'Machos'  },
  { value: 'HEMBRA', label: 'Hembras' },
]

const TIPO_PROD_OPCIONES = [
  { value: '',               label: 'Todos' },
  { value: 'CARNE',          label: 'Carne' },
  { value: 'LECHE',          label: 'Leche' },
  { value: 'DOBLE_PROPOSITO', label: 'Doble propósito' },
]

const ORIGEN_OPCIONES = [
  { value: '',             label: 'Todos'       },
  { value: 'NACIDO_FINCA', label: 'Nac. finca'  },
  { value: 'COMPRADO',     label: 'Comprado'    },
  { value: 'DONADO',       label: 'Donado'      },
]

function ChipGroup({ label, icon, opciones, value, onChange }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mr: 0.25 }}>
        {icon}
        <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
          {label}
        </Typography>
      </Box>
      {opciones.map((op) => (
        <Chip
          key={op.value}
          label={op.label}
          size="small"
          onClick={() => onChange(op.value)}
          color={value === op.value ? 'primary' : 'default'}
          variant={value === op.value ? 'filled' : 'outlined'}
          sx={{ borderRadius: 1.5, fontWeight: value === op.value ? 700 : 400, cursor: 'pointer' }}
        />
      ))}
    </Box>
  )
}

function DateRangeGroup({ label, desde, hasta, onDesde, onHasta }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
        <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
          {label}
        </Typography>
      </Box>
      <TextField
        size="small" label="Desde" type="date"
        value={desde || ''}
        onChange={(e) => onDesde(e.target.value || null)}
        InputLabelProps={{ shrink: true }}
        sx={{ width: 155 }}
      />
      <TextField
        size="small" label="Hasta" type="date"
        value={hasta || ''}
        onChange={(e) => onHasta(e.target.value || null)}
        InputLabelProps={{ shrink: true }}
        sx={{ width: 155 }}
      />
    </Box>
  )
}

export default function AnimalFilters({
  // Estado
  estado, onEstado,
  // Sexo
  sexo, onSexo,
  // Fechas nacimiento (fila principal)
  fechaNacimientoDesde, onFechaNacimientoDesde,
  fechaNacimientoHasta, onFechaNacimientoHasta,
  // Filtros avanzados (colapsables)
  fechaIngresoDesde, onFechaIngresoDesde,
  fechaIngresoHasta, onFechaIngresoHasta,
  tipoProduccion, onTipoProduccion,
  origen, onOrigen,
  pesoMin, onPesoMin,
  pesoMax, onPesoMax,
}) {
  const [expanded, setExpanded] = useState(false)

  const hayFiltrosAvanzados =
    fechaIngresoDesde || fechaIngresoHasta ||
    tipoProduccion || origen ||
    pesoMin != null || pesoMax != null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* ── Fila principal: Estado | Sexo | Fecha Nacimiento | Más filtros ── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start' }}>

        <ChipGroup
          label="Estado"
          icon={<FilterListIcon sx={{ fontSize: 16 }} />}
          opciones={ESTADO_OPCIONES}
          value={estado || ''}
          onChange={onEstado}
        />

        <Divider orientation="vertical" flexItem />

        <ChipGroup
          label="Sexo"
          icon={<FilterListIcon sx={{ fontSize: 16 }} />}
          opciones={SEXO_OPCIONES}
          value={sexo || ''}
          onChange={onSexo}
        />

        <Divider orientation="vertical" flexItem />

        <DateRangeGroup
          label="Fecha Nac."
          desde={fechaNacimientoDesde}
          hasta={fechaNacimientoHasta}
          onDesde={onFechaNacimientoDesde}
          onHasta={onFechaNacimientoHasta}
        />

        <Button
          size="small"
          variant={hayFiltrosAvanzados ? 'contained' : 'outlined'}
          color={hayFiltrosAvanzados ? 'secondary' : 'inherit'}
          startIcon={<TuneOutlinedIcon />}
          endIcon={expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          onClick={() => setExpanded((v) => !v)}
          sx={{ textTransform: 'none', alignSelf: 'center', whiteSpace: 'nowrap', ml: 'auto' }}
        >
          Más filtros{hayFiltrosAvanzados ? ' ●' : ''}
        </Button>
      </Box>

      {/* ── Filtros avanzados (colapsable) ── */}
      <Collapse in={expanded}>
        <Box sx={{
          display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start',
          p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0',
        }}>

          <DateRangeGroup
            label="Fecha Ingreso"
            desde={fechaIngresoDesde}
            hasta={fechaIngresoHasta}
            onDesde={onFechaIngresoDesde}
            onHasta={onFechaIngresoHasta}
          />

          <Divider orientation="vertical" flexItem />

          <ChipGroup
            label="Producción"
            icon={<FilterListIcon sx={{ fontSize: 16 }} />}
            opciones={TIPO_PROD_OPCIONES}
            value={tipoProduccion || ''}
            onChange={onTipoProduccion}
          />

          <Divider orientation="vertical" flexItem />

          <ChipGroup
            label="Origen"
            icon={<FilterListIcon sx={{ fontSize: 16 }} />}
            opciones={ORIGEN_OPCIONES}
            value={origen || ''}
            onChange={onOrigen}
          />

          <Divider orientation="vertical" flexItem />

          {/* Rango de peso */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <ScaleOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                Peso (kg)
              </Typography>
            </Box>
            <TextField
              size="small" label="Mín" type="number"
              value={pesoMin ?? ''}
              onChange={(e) => onPesoMin(e.target.value !== '' ? Number(e.target.value) : null)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 0, step: 1 }}
              sx={{ width: 95 }}
            />
            <TextField
              size="small" label="Máx" type="number"
              value={pesoMax ?? ''}
              onChange={(e) => onPesoMax(e.target.value !== '' ? Number(e.target.value) : null)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 0, step: 1 }}
              sx={{ width: 95 }}
            />
          </Box>

        </Box>
      </Collapse>
    </Box>
  )
}
