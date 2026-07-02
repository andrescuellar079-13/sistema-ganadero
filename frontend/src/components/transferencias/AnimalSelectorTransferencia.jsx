// Selector de animales disponibles para transferencia
import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { GET_ANIMALES_DISPONIBLES_TRANSFERENCIA } from '../../graphql/fincas'
import {
  Box, TextField, InputAdornment, IconButton, Chip, Stack,
  Table, TableHead, TableBody, TableRow, TableCell,
  Checkbox, Typography, CircularProgress, MenuItem, Select,
  FormControl, InputLabel, Button,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon  from '@mui/icons-material/Clear'

const SEXO_OPTS = [
  { value: '', label: 'Todos los sexos' },
  { value: 'MACHO', label: 'Machos' },
  { value: 'HEMBRA', label: 'Hembras' },
]

function getParcela(animal) {
  if (!animal.movimientosParcela) return '—'
  const activo = animal.movimientosParcela.find(mp => !mp.fechaSalida)
  return activo?.parcela?.nombre || '—'
}

export default function AnimalSelectorTransferencia({
  fincaOrigenId,
  seleccionados,
  onToggle,
  onSelectAll,
}) {
  const [buscar, setBuscar] = useState('')
  const [sexo, setSexo] = useState('')
  const [buscarInput, setBuscarInput] = useState('')

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => setBuscar(buscarInput), 350)
    return () => clearTimeout(t)
  }, [buscarInput])

  const { data, loading } = useQuery(GET_ANIMALES_DISPONIBLES_TRANSFERENCIA, {
    variables: { fincaId: fincaOrigenId, buscar: buscar || undefined, sexo: sexo || undefined },
    skip: !fincaOrigenId,
    fetchPolicy: 'network-only',
  })

  const animales = data?.animalesDisponiblesTransferencia || []
  const todosSeleccionados = animales.length > 0 && animales.every(a => seleccionados.has(a.id))

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar por arete, nombre, raza..."
          value={buscarInput}
          onChange={e => setBuscarInput(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              endAdornment: buscarInput && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setBuscarInput(''); setBuscar('') }}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sexo</InputLabel>
          <Select value={sexo} label="Sexo" onChange={e => setSexo(e.target.value)}>
            {SEXO_OPTS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : animales.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          No hay animales disponibles con los filtros actuales.
        </Typography>
      ) : (
        <>
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {animales.length} animal(es) disponibles · {seleccionados.size} seleccionado(s)
            </Typography>
            <Button size="small" onClick={() => onSelectAll(animales, !todosSeleccionados)}>
              {todosSeleccionados ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </Button>
          </Box>
          <Box sx={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={todosSeleccionados}
                      indeterminate={seleccionados.size > 0 && !todosSeleccionados}
                      onChange={e => onSelectAll(animales, e.target.checked)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Arete</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Sexo</TableCell>
                  <TableCell>Raza</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell align="right">Peso (kg)</TableCell>
                  <TableCell>Parcela actual</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {animales.map(a => (
                  <TableRow
                    key={a.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => onToggle(a)}
                    selected={seleccionados.has(a.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={seleccionados.has(a.id)} size="small" onClick={e => e.stopPropagation()} onChange={() => onToggle(a)} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.nroArete}</Typography>
                    </TableCell>
                    <TableCell>{a.nombre || '—'}</TableCell>
                    <TableCell>
                      <Chip label={a.sexo} size="small" color={a.sexo === 'MACHO' ? 'info' : 'secondary'} variant="outlined" />
                    </TableCell>
                    <TableCell>{a.raza?.nombre || '—'}</TableCell>
                    <TableCell>{a.categoria?.nombre || '—'}</TableCell>
                    <TableCell align="right">{a.peso ?? '—'}</TableCell>
                    <TableCell>{getParcela(a)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </Box>
  )
}
