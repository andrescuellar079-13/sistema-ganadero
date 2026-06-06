import { Box, Typography, Button, Divider } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

/**
 * Cabecera estándar de página CRUD.
 * Props:
 *   title      — string: título visible
 *   icon       — MUI icon component (opcional)
 *   onAdd      — función: abre modal de creación (si se omite no se muestra el botón)
 *   addLabel   — string: etiqueta del botón de creación (default "Nuevo")
 *   extra      — ReactNode: acciones adicionales (ej. ReportesButtons)
 */
export default function PageHeader({ title, icon: IconComp, onAdd, addLabel = 'Nuevo', extra }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        {/* Título */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          {IconComp && (
            <Box sx={{
              width: 36, height: 36, borderRadius: 2,
              bgcolor: 'primary.lightest',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconComp sx={{ fontSize: 20, color: 'primary.main' }} />
            </Box>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {title}
          </Typography>
        </Box>

        {/* Acciones */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {extra}
          {onAdd && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AddIcon />}
              onClick={onAdd}
              disableElevation
            >
              {addLabel}
            </Button>
          )}
        </Box>
      </Box>
      <Divider sx={{ mt: 2 }} />
    </Box>
  )
}
