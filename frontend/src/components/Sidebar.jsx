import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLayout } from '../context/LayoutContext'
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Tooltip, Divider, Typography, Box,
} from '@mui/material'

import DashboardOutlinedIcon       from '@mui/icons-material/DashboardOutlined'
import PetsOutlinedIcon            from '@mui/icons-material/PetsOutlined'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import VaccinesOutlinedIcon        from '@mui/icons-material/VaccinesOutlined'
import FavoriteOutlinedIcon        from '@mui/icons-material/FavoriteOutlined'
import LocalDrinkOutlinedIcon      from '@mui/icons-material/LocalDrinkOutlined'
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined'
import RemoveCircleOutlinedIcon    from '@mui/icons-material/RemoveCircleOutlined'
import ShoppingCartOutlinedIcon    from '@mui/icons-material/ShoppingCartOutlined'
import PointOfSaleOutlinedIcon     from '@mui/icons-material/PointOfSaleOutlined'
import PeopleOutlinedIcon          from '@mui/icons-material/PeopleOutlined'
import LocalShippingOutlinedIcon   from '@mui/icons-material/LocalShippingOutlined'
import NotificationsOutlinedIcon   from '@mui/icons-material/NotificationsOutlined'
import GroupsOutlinedIcon          from '@mui/icons-material/GroupsOutlined'
import ManageAccountsOutlinedIcon  from '@mui/icons-material/ManageAccountsOutlined'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import ListAltOutlinedIcon         from '@mui/icons-material/ListAltOutlined'
import HomeWorkOutlinedIcon        from '@mui/icons-material/HomeWorkOutlined'
import ChevronLeftIcon             from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon            from '@mui/icons-material/ChevronRight'
import AgricultureIcon             from '@mui/icons-material/Agriculture'
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined'

const ICON_MAP = {
  dashboard:    DashboardOutlinedIcon,
  animales:     PetsOutlinedIcon,
  vacunas:      MedicalServicesOutlinedIcon,
  vacunaciones: VaccinesOutlinedIcon,
  reproduccion: FavoriteOutlinedIcon,
  produccion:   LocalDrinkOutlinedIcon,
  sanidad:      HealthAndSafetyOutlinedIcon,
  bajas:        RemoveCircleOutlinedIcon,
  compras:      ShoppingCartOutlinedIcon,
  inventario:   InventoryOutlinedIcon,
  ventas:       PointOfSaleOutlinedIcon,
  clientes:     PeopleOutlinedIcon,
  proveedores:  LocalShippingOutlinedIcon,
  alertas:      NotificationsOutlinedIcon,
  rrhh:         GroupsOutlinedIcon,
  usuarios:     ManageAccountsOutlinedIcon,
  roles:        AdminPanelSettingsOutlinedIcon,
  catalogos:    ListAltOutlinedIcon,
  fincas:       HomeWorkOutlinedIcon,
}

const MENU_GROUPS = [
  {
    label: 'Principal',
    items: [
      { path: '/',          name: 'Dashboard',   icon: 'dashboard',    permiso: null },
    ],
  },
  {
    label: 'Ganadería',
    items: [
      { path: '/animales',     name: 'Animales',    icon: 'animales',     permiso: 'animales_ver' },
      { path: '/vacunas',      name: 'Vacunas',     icon: 'vacunas',      permiso: 'vacunas_ver' },
      { path: '/vacunaciones', name: 'Vacunaciones',icon: 'vacunaciones', permiso: 'vacunaciones_ver' },
      { path: '/reproduccion', name: 'Reproducción',icon: 'reproduccion', permiso: 'reproduccion_ver' },
      { path: '/produccion',   name: 'Producción',  icon: 'produccion',   permiso: 'produccion_ver' },
      { path: '/sanidad',      name: 'Sanidad',     icon: 'sanidad',      permiso: 'sanidad_ver' },
      { path: '/bajas',        name: 'Bajas',       icon: 'bajas',        permiso: 'animales_ver' },
    ],
  },
  {
    label: 'Comercio',
    items: [
      { path: '/compras',     name: 'Compras',    icon: 'compras',     permiso: 'compras_ver' },
      { path: '/inventario', name: 'Inventario', icon: 'inventario', permiso: 'compras_ver' },
      { path: '/ventas',      name: 'Ventas',     icon: 'ventas',      permiso: 'ventas_ver' },
      { path: '/clientes',    name: 'Clientes',   icon: 'clientes',    permiso: 'ventas_ver' },
      { path: '/proveedores', name: 'Proveedores',icon: 'proveedores', permiso: 'compras_ver' },
    ],
  },
  {
    label: 'Administración',
    items: [
      { path: '/alertas',   name: 'Alertas',   icon: 'alertas',   permiso: 'alertas_ver' },
      { path: '/rrhh',      name: 'RRHH',      icon: 'rrhh',      permiso: 'rrhh_ver' },
      { path: '/usuarios',  name: 'Usuarios',  icon: 'usuarios',  permiso: 'usuarios_ver' },
      { path: '/roles',     name: 'Roles',     icon: 'roles',     permiso: 'roles_ver' },
      { path: '/catalogos', name: 'Catálogos', icon: 'catalogos', permiso: 'configuracion_ver' },
      { path: '/fincas',    name: 'Fincas',    icon: 'fincas',    permiso: 'configuracion_ver' },
    ],
  },
]

const SIDEBAR_OPEN  = 240
const SIDEBAR_CLOSE = 68

const DARK_BG   = 'linear-gradient(180deg, #052e16 0%, #065f46 60%, #052e16 100%)'
const ITEM_TEXT = '#a7f3d0'
const GROUP_LBL = '#4ade80'

export default function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen } = useLayout()
  const { tienePermiso, esAdministrador, user } = useAuth()

  const canSee = (item) => {
    if (!item.permiso) return true
    if (esAdministrador) return true
    return tienePermiso(item.permiso)
  }

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const W = sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_CLOSE

  const initials = ((user?.username || 'U')[0]).toUpperCase()

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: W,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        '& .MuiDrawer-paper': {
          width: W,
          overflowX: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          background: DARK_BG,
          boxShadow: '4px 0 24px rgba(0,0,0,.28)',
          border: 'none',
        },
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'flex-start' : 'center',
          px: sidebarOpen ? 2 : 0,
          gap: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 32, height: 32,
            borderRadius: 2,
            bgcolor: '#2E7D32',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,.30)',
          }}
        >
          <AgricultureIcon sx={{ fontSize: 18, color: '#fff' }} />
        </Box>
        {sidebarOpen && (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>
              GanadoSoft
            </Typography>
            <Typography sx={{ color: '#4ade80', fontSize: '0.625rem', fontWeight: 500 }}>
              Sistema Ganadero
            </Typography>
          </Box>
        )}
      </Box>

      {/* Usuario */}
      {user && (
        <Box
          sx={{
            mx: 1, mt: 1.5, mb: 0.5,
            p: sidebarOpen ? '10px 12px' : '10px 0',
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            gap: sidebarOpen ? 1.25 : 0,
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: 28, height: 28,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #4ade80, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '0.6875rem', fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </Box>
          {sidebarOpen && (
            <Box sx={{ overflow: 'hidden', minWidth: 0 }}>
              <Typography sx={{ color: '#a7f3d0', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.3 }} noWrap>
                {user.username}
              </Typography>
              <Typography sx={{ color: '#4ade80', fontSize: '0.625rem', lineHeight: 1.3 }} noWrap>
                {user.rol?.nombre || 'Sin rol'}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Navegación */}
      <Box component="nav" sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1, px: 1 }}>
        {MENU_GROUPS.map((group) => {
          const visible = group.items.filter(canSee)
          if (visible.length === 0) return null

          return (
            <Box key={group.label} sx={{ mb: 0.5 }}>
              {sidebarOpen ? (
                <Typography
                  sx={{
                    color: '#16a34a',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    px: 1.5, pt: 1.5, pb: 0.75,
                    userSelect: 'none',
                  }}
                >
                  {group.label}
                </Typography>
              ) : (
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1, mx: 0.5 }} />
              )}

              <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {visible.map((item) => {
                  const active   = isActive(item.path)
                  const IconComp = ICON_MAP[item.icon]

                  const btn = (
                    <ListItemButton
                      component={Link}
                      to={item.path}
                      selected={active}
                      sx={{
                        justifyContent: sidebarOpen ? 'flex-start' : 'center',
                        px: sidebarOpen ? 1.5 : 0,
                        minHeight: 38,
                        color: active ? '#86efac' : ITEM_TEXT,
                        fontWeight: active ? 600 : 400,
                        borderLeft: active && sidebarOpen
                          ? '2px solid #4ade80'
                          : '2px solid transparent',
                        position: 'relative',
                        '&::before': !sidebarOpen && active ? {
                          content: '""',
                          position: 'absolute',
                          left: 0, top: '50%',
                          transform: 'translateY(-50%)',
                          width: 2, height: 24,
                          bgcolor: '#4ade80',
                          borderRadius: '0 2px 2px 0',
                        } : {},
                      }}
                    >
                      <ListItemIcon sx={{ color: 'inherit', minWidth: sidebarOpen ? 36 : 'auto' }}>
                        {IconComp && <IconComp sx={{ fontSize: 18 }} />}
                      </ListItemIcon>
                      {sidebarOpen && (
                        <ListItemText
                          primary={item.name}
                          sx={{
                            '& .MuiTypography-root': {
                              fontSize: '0.8125rem',
                              fontWeight: 'inherit',
                              whiteSpace: 'nowrap',
                            }
                          }}
                        />
                      )}
                    </ListItemButton>
                  )

                  return (
                    <ListItem key={item.path} disablePadding>
                      {!sidebarOpen ? (
                        <Tooltip title={item.name} placement="right" arrow>
                          {btn}
                        </Tooltip>
                      ) : btn}
                    </ListItem>
                  )
                })}
              </List>
            </Box>
          )
        })}
      </Box>

      {/* Toggle colapsar */}
      <Box sx={{ p: 1, borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <ListItemButton
          onClick={() => setSidebarOpen(!sidebarOpen)}
          sx={{
            borderRadius: 2,
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            color: '#4ade80',
            bgcolor: 'rgba(255,255,255,0.04)',
            px: sidebarOpen ? 1.5 : 0,
            minHeight: 36,
            gap: 1,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.09)', color: '#86efac' },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: sidebarOpen ? 28 : 'auto' }}>
            {sidebarOpen
              ? <ChevronLeftIcon sx={{ fontSize: 18 }} />
              : <ChevronRightIcon sx={{ fontSize: 18 }} />
            }
          </ListItemIcon>
          {sidebarOpen && (
            <ListItemText
              primary="Colapsar"
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }
              }}
            />
          )}
        </ListItemButton>
      </Box>
    </Drawer>
  )
}