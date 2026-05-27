import {
  Box, Button, Select, MenuItem, Typography, Skeleton, FormControl, InputLabel,
} from '@mui/material'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon   from '@mui/icons-material/NavigateNext'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export default function AnimalPagination({
  total, paginas, paginaActual, tieneSiguiente, tieneAnterior,
  porPagina, onPagina, onPorPagina, loading,
}) {
  if (loading && !total) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
        <Skeleton width={180} height={28} />
        <Skeleton width={260} height={40} />
      </Box>
    )
  }

  const inicio = total === 0 ? 0 : (paginaActual - 1) * porPagina + 1
  const fin    = Math.min(paginaActual * porPagina, total)

  return (
    <Box
      sx={{
        display: 'flex', flexWrap: 'wrap', gap: 1,
        alignItems: 'center', justifyContent: 'space-between',
        py: 1, borderTop: '1px solid', borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {total === 0
          ? 'Sin resultados'
          : `Mostrando ${inicio}–${fin} de ${total.toLocaleString('es-PY')} animales`}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <InputLabel sx={{ fontSize: 12 }}>Por pág.</InputLabel>
          <Select
            value={porPagina}
            label="Por pág."
            onChange={(e) => onPorPagina(Number(e.target.value))}
            sx={{ fontSize: 13 }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          Pág. {paginaActual} / {paginas}
        </Typography>

        <Button
          size="small" variant="outlined" disabled={!tieneAnterior || loading}
          onClick={() => onPagina(paginaActual - 1)}
          startIcon={<NavigateBeforeIcon />}
          sx={{ minWidth: 0, px: 1.5, textTransform: 'none' }}
        >
          Ant.
        </Button>
        <Button
          size="small" variant="outlined" disabled={!tieneSiguiente || loading}
          onClick={() => onPagina(paginaActual + 1)}
          endIcon={<NavigateNextIcon />}
          sx={{ minWidth: 0, px: 1.5, textTransform: 'none' }}
        >
          Sig.
        </Button>
      </Box>
    </Box>
  )
}
