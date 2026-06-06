import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const routeNames = {
  '/':             'Dashboard',
  '/catalogos':    'Catalogos',
  '/vacunas':      'Vacunas',
  '/animales':     'Animales',
  '/vacunaciones': 'Vacunaciones',
  '/clientes':     'Clientes',
  '/proveedores':  'Proveedores',
  '/compras':      'Compras',
  '/ventas':       'Ventas',
  '/reproduccion': 'Reproduccion',
  '/produccion':   'Produccion',
  '/sanidad':      'Sanidad',
  '/alertas':      'Alertas',
  '/rrhh':         'RRHH',
  '/bajas':        'Muertes y Bajas',
  '/usuarios':     'Usuarios',
  '/roles':        'Roles',
  '/fincas':       'Fincas',
}

export default function Navbar({ sidebarOpen }) {
  const location = useLocation()
  const { user }  = useAuth()

  const pageName = routeNames[location.pathname] || 'GanadoSoft'
  const initial  = (user?.username || 'U')[0].toUpperCase()

  return (
    <header
      className="fixed top-0 right-0 z-40 flex items-center justify-between px-6 transition-all duration-300"
      style={{
        left: sidebarOpen ? '240px' : '68px',
        height: '60px',
        background: 'rgba(255,255,255,.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9',
        boxShadow: '0 1px 8px rgba(0,0,0,.06)',
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-green-700 font-semibold text-sm">GanadoSoft</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"
        >
          <path d="M9 18l6-6-6-6"/>
        </svg>
        <span className="text-slate-500 text-sm font-medium">{pageName}</span>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">

        {/* Buscador */}
        <div
          className="hidden md:flex items-center gap-2 rounded-xl px-3 py-2 transition"
          style={{ background: '#f1f5f9' }}
        >
          <svg
            width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder="Buscar..."
            className="bg-transparent text-sm text-slate-600 outline-none w-32 placeholder-slate-400"
          />
        </div>

        {/* Notificaciones */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition hover:bg-slate-100"
          style={{ background: '#f8fafc' }}
          title="Notificaciones"
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          {/* Punto rojo */}
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"
            style={{ border: '2px solid white' }}
          />
        </button>

        {/* Separador */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Usuario */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-slate-700 leading-tight">{user?.username || 'Usuario'}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{user?.rol?.nombre || 'Sin rol'}</p>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
          >
            {initial}
          </div>
        </div>

      </div>
    </header>
  )
}