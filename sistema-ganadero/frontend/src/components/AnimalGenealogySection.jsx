import { Box, Typography, Divider } from '@mui/material'
import StatusChip from './ui/StatusChip'

function ProgenitorCard({ animal, label }) {
  if (!animal) {
    return (
      <Box sx={{
        p: 2, bgcolor: '#F8FAFC', borderRadius: 1.5,
        border: '1px dashed #CBD5E0',
      }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" gutterBottom>
          {label}
        </Typography>
        <Typography variant="body2" color="text.disabled" fontStyle="italic">
          {label === 'Padre' ? 'Padre no registrado' : 'Madre no registrada'}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{
      p: 2, bgcolor: '#F8FAFC', borderRadius: 1.5,
      border: '1px solid #E2E8F0',
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700}>
          {label}
        </Typography>
        <StatusChip value={animal.estado} />
      </Box>
      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
        #{animal.nroArete}
      </Typography>
      {animal.nombre && (
        <Typography variant="body2" color="text.primary">
          {animal.nombre}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        {animal.sexo === 'MACHO' ? 'Macho' : 'Hembra'}
        {animal.raza?.nombre ? ` · ${animal.raza.nombre}` : ''}
        {animal.categoria?.nombre ? ` · ${animal.categoria.nombre}` : ''}
      </Typography>
    </Box>
  )
}

export default function AnimalGenealogySection({ animal }) {
  const descendencia = animal?.descendencia || []

  return (
    <Box>
      {/* Progenitores */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
        Progenitores
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 3 }}>
        <ProgenitorCard animal={animal.padre} label="Padre" />
        <ProgenitorCard animal={animal.madre} label="Madre" />
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Descendencia */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
        Descendencia
      </Typography>

      {descendencia.length === 0 ? (
        <Box sx={{
          textAlign: 'center', py: 3, bgcolor: '#F8FAFC',
          borderRadius: 1.5, border: '1px dashed #CBD5E0',
        }}>
          <Typography variant="body2" color="text.disabled" fontStyle="italic">
            Sin descendencia registrada
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {descendencia.map(hijo => (
            <Box key={hijo.id} sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5,
              border: '1px solid #E2E8F0',
            }}>
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                  #{hijo.nroArete}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {hijo.nombre ? `${hijo.nombre} · ` : ''}
                  {hijo.sexo === 'MACHO' ? 'Macho' : 'Hembra'}
                  {hijo.fechaNacimiento
                    ? ` · Nac: ${new Date(hijo.fechaNacimiento).toLocaleDateString('es-PY')}`
                    : ''}
                </Typography>
              </Box>
              <StatusChip value={hijo.estado} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
