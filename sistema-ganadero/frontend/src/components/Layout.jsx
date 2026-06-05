import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLayout } from '../context/LayoutContext'
import Sidebar from './Sidebar'
import {
  AppBar, Toolbar, Box, Typography, IconButton,
  Chip, Avatar, Button, Divider,
} from '@mui/material'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import MenuIcon     from '@mui/icons-material/Menu'
import LogoutIcon   from '@mui/icons-material/Logout'

const PAGE_TITLES = {
  '/':             'Dashboard',
  '/dashboard':    'Dashboard',
  '/animales':     'Animales',
  '/vacunas':      'Vacunas',
  '/vacunaciones': 'Vacunaciones',
  '/reproduccion': 'Reproducción',
  '/produccion':   'Producción',
  '/sanidad':      'Sanidad',
  '/bajas':        'Bajas y Muertes',
  '/compras':      'Compras',
  '/ventas':       'Ventas',
  '/clientes':     'Clientes',
  '/proveedores':  'Proveedores',
  '/alertas':      'Alertas',
  '/rrhh':         'Recursos Humanos',
  '/usuarios':     'Gestión de Usuarios',
  '/roles':        'Roles y Permisos',
  '/catalogos':    'Catálogos',
  '/fincas':       'Gestión de Finca',
  '/unauthorized': 'Acceso Denegado',
}

export default function Layout({ children }) {
  const { sidebarOpen, setSidebarOpen } = useLayout()
  const { user, logout, nombreCompleto } = useAuth()
  const location = useLocation()
  const navigate  = useNavigate()

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Sistema Ganadero'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = (nombreCompleto || user?.username || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Sidebar />

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {/* ── AppBar ───────────────────────────────── */}
        <AppBar position="static" sx={{ zIndex: 20 }}>
          <Toolbar variant="dense" sx={{ minHeight: 56, px: { xs: 2, sm: 2.5 } }}>

            {/* Izquierda: toggle + título */}
            <IconButton
              size="small"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
              sx={{ mr: 1.5, color: 'text.secondary' }}
            >
              {sidebarOpen ? <MenuOpenIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
            </IconButton>

            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: 'text.primary', flexGrow: 1, fontSize: '0.9375rem' }}
            >
              {pageTitle}
            </Typography>

            {/* Derecha: rol + usuario + logout */}
            {user?.rol?.nombre && (
              <Chip
                label={user.rol.nombre}
                size="small"
                sx={{
                  mr: 1.5,
                  display: { xs: 'none', sm: 'flex' },
                  bgcolor: '#DCFCE7',
                  color: '#166534',
                  border: '1px solid #BBF7D0',
                  fontWeight: 600,
                  fontSize: '0.6875rem',
                }}
              />
            )}

            <Divider orientation="vertical" flexItem sx={{ mx: 1.5, borderColor: 'divider' }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 32, height: 32,
                  background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {initials}
              </Avatar>
              <Typography
                variant="body2"
                sx={{
                  display: { xs: 'none', md: 'block' },
                  fontWeight: 500,
                  color: 'text.primary',
                  maxWidth: 140,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {nombreCompleto || user?.username}
              </Typography>
            </Box>

            <Button
              size="small"
              startIcon={<LogoutIcon sx={{ fontSize: '1rem !important' }} />}
              onClick={handleLogout}
              sx={{
                ml: 1.5,
                color: 'error.main',
                fontSize: '0.8125rem',
                px: 1.25,
                '&:hover': { bgcolor: '#FEE2E2' },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
                Salir
              </Box>
            </Button>
          </Toolbar>
        </AppBar>

        {/* ── Contenido ────────────────────────────── */}
        <Box component="main" sx={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
