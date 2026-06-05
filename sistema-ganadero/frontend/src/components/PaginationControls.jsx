import { Box, Button, Typography, Skeleton } from '@mui/material'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

export default function PaginationControls({
  count, totalPages, page, hasNext, hasPrevious, onPage, loading, label = 'resultados',
}) {
  if (loading && !count) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
        <Skeleton width={200} height={28} />
        <Skeleton width={220} height={40} />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex', flexWrap: 'wrap', gap: 1,
        alignItems: 'center', justifyContent: 'space-between',
        py: 1, borderTop: '1px solid', borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {count === 0
          ? `Sin ${label}`
          : `${count.toLocaleString('es-PY')} ${label} encontradas`}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          Pág. {page} / {totalPages}
        </Typography>
        <Button
          size="small" variant="outlined" disabled={!hasPrevious || loading}
          onClick={() => onPage(page - 1)}
          startIcon={<NavigateBeforeIcon />}
          sx={{ minWidth: 0, px: 1.5, textTransform: 'none' }}
        >
          Anterior
        </Button>
        <Button
          size="small" variant="outlined" disabled={!hasNext || loading}
          onClick={() => onPage(page + 1)}
          endIcon={<NavigateNextIcon />}
          sx={{ minWidth: 0, px: 1.5, textTransform: 'none' }}
        >
          Siguiente
        </Button>
      </Box>
    </Box>
  )
}
