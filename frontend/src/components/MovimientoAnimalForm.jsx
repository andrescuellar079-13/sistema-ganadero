import { useState } from 'react'
import { useQuery } from '@apollo/client'
import {
  Box, Typography, TextField, Button, MenuItem,
  FormControl, InputLabel, Select, CircularProgress,
  Divider,
} from '@mui/material'
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined'
import { GET_PARCELAS_FINCA } from '../graphql/animales'

const MOTIVO_OPCIONES = [
  { value: 'ROTACION',      label: 'Rotación de potrero'          },
  { value: 'SANIDAD',       label: 'Razones sanitarias'           },
  { value: 'ALIMENTACION',  label: 'Manejo de alimentación'       },
  { value: 'SEPARACION',    label: 'Separación por gestación/cría'},
  { value: 'VENTA',         label: 'Preparación para venta'       },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento de parcela'     },
  { value: 'OTRO',          label: 'Otro'                         },
]

export default function MovimientoAnimalForm({
  animal,
  fincaId,
  movimiento = null,   // si viene, es edición
  onSubmit,
  onCancel,
}) {
  const today = new Date().toISOString().split('T')[0]

  const [fechaMovimiento,  setFechaMovimiento]  = useState(movimiento?.fechaMovimiento  || today)
  const [parcelaOrigenId,  setParcelaOrigenId]  = useState(movimiento?.parcelaOrigen?.id  || '')
  const [parcelaDestinoId, setParcelaDestinoId] = useState(movimiento?.parcelaDestino?.id || '')
  const [motivo,           setMotivo]           = useState(movimiento?.motivo           || '')
  const [observaciones,    setObservaciones]    = useState(movimiento?.observaciones    || '')
  const [saving, setSaving] = useState(false)

  const { data: parcelasData, loading: loadingParcelas } = useQuery(GET_PARCELAS_FINCA, {
    variables: { fincaId },
    skip: !fincaId,
    fetchPolicy: 'cache-first',
  })
  const parcelas = parcelasData?.parcelas || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const input = {
      fincaId,
      animalId: animal.id,
      fechaMovimiento,
      parcelaOrigenId:  parcelaOrigenId  || undefined,
      parcelaDestinoId: parcelaDestinoId || undefined,
      motivo:       motivo       || undefined,
      observaciones: observaciones || undefined,
    }
    if (movimiento) {
      delete input.fincaId
      delete input.animalId
      input.id = movimiento.id
    }
    await onSubmit(input)
    setSaving(false)
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}
    >
      {/* Cabecera */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SwapHorizOutlinedIcon color="primary" />
        <Typography variant="subtitle1" fontWeight={700}>
          {movimiento ? 'Editar movimiento' : 'Registrar movimiento'}
        </Typography>
      </Box>

      {/* Chip de animal */}
      <Box sx={{
        p: 1.5, bgcolor: '#F0F4FF', borderRadius: 1.5,
        border: '1px solid #C7D7FD', display: 'flex', gap: 2,
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            ANIMAL
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            #{animal.nroArete}{animal.nombre ? ` · ${animal.nombre}` : ''}
          </Typography>
        </Box>
        {animal.sexo && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>SEXO</Typography>
            <Typography variant="body2">{animal.sexo === 'MACHO' ? 'Macho' : 'Hembra'}</Typography>
          </Box>
        )}
      </Box>

      {/* Fecha */}
      <TextField
        label="Fecha del movimiento"
        type="date"
        value={fechaMovimiento}
        onChange={(e) => setFechaMovimiento(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        size="small"
        required
        fullWidth
      />

      {/* Parcela origen → destino */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 1, alignItems: 'center' }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Parcela origen</InputLabel>
          <Select
            value={parcelaOrigenId}
            onChange={(e) => setParcelaOrigenId(e.target.value)}
            label="Parcela origen"
            disabled={loadingParcelas}
          >
            <MenuItem value=""><em>— Sin origen —</em></MenuItem>
            {parcelas.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <SwapHorizOutlinedIcon sx={{ color: 'text.disabled' }} />

        <FormControl size="small" fullWidth>
          <InputLabel>Parcela destino</InputLabel>
          <Select
            value={parcelaDestinoId}
            onChange={(e) => setParcelaDestinoId(e.target.value)}
            label="Parcela destino"
            disabled={loadingParcelas}
          >
            <MenuItem value=""><em>— Sin destino —</em></MenuItem>
            {parcelas.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Motivo */}
      <FormControl size="small" fullWidth>
        <InputLabel>Motivo</InputLabel>
        <Select
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          label="Motivo"
        >
          <MenuItem value=""><em>— Sin especificar —</em></MenuItem>
          {MOTIVO_OPCIONES.map(op => (
            <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Observaciones */}
      <TextField
        label="Observaciones"
        multiline
        rows={3}
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        size="small"
        fullWidth
        placeholder="Notas adicionales sobre el movimiento..."
      />

      <Divider />

      {/* Botones */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button variant="outlined" color="inherit" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving || !fechaMovimiento}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {movimiento ? 'Actualizar' : 'Registrar'}
        </Button>
      </Box>
    </Box>
  )
}
