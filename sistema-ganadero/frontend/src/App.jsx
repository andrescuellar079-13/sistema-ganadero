// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LayoutProvider } from './context/LayoutContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './components/Login'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import UnauthorizedPage from './pages/UnauthorizedPage'
import NotFoundPage from './pages/NotFoundPage'
import ErrorBoundary from './components/ErrorBoundary'

import DashboardPage from './pages/DashboardPage'
import AnimalesPage from './pages/AnimalesPage'
import VacunacionesPage from './pages/VacunacionesPage'
import VacunasPage from './pages/VacunasPage'
import ClientesPage from './pages/ClientesPage'
import ProveedoresPage from './pages/ProveedoresPage'
import ComprasPage from './pages/ComprasPage'
import CatalogosPage from './pages/CatalogosPage'
import VentasPage from './pages/VentasPage'
import MuerteBajaPage from './pages/MuerteBajaPage'
import ReproduccionPage from './pages/ReproduccionPage'
import ProduccionPage from './pages/ProduccionPage'
import SanidadPage from './pages/SanidadPage'
import AlertasPage from './pages/AlertasPage'
import RrhhPage from './pages/RrhhPage'
import UsuariosPage from './pages/UsuariosPage'
import RolesPage from './pages/RolesPage'
import FincaPage from './pages/FincaPage'

// ---------------------------------------------------------------------------
// Layout para rutas protegidas
// ---------------------------------------------------------------------------
function AppLayout() {
  return (
    <Layout>
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/catalogos"    element={<ProtectedRoute requiredPermission="catalogos_ver"><CatalogosPage /></ProtectedRoute>} />
        <Route path="/animales"     element={<ProtectedRoute requiredPermission="animales_ver"><AnimalesPage /></ProtectedRoute>} />
        <Route path="/vacunas"      element={<ProtectedRoute requiredPermission="vacunas_ver"><VacunasPage /></ProtectedRoute>} />
        <Route path="/vacunaciones" element={<ProtectedRoute requiredPermission="vacunaciones_ver"><VacunacionesPage /></ProtectedRoute>} />
        <Route path="/reproduccion" element={<ProtectedRoute requiredPermission="reproduccion_ver"><ReproduccionPage /></ProtectedRoute>} />
        <Route path="/produccion"   element={<ProtectedRoute requiredPermission="produccion_ver"><ProduccionPage /></ProtectedRoute>} />
        <Route path="/sanidad"      element={<ProtectedRoute requiredPermission="sanidad_ver"><SanidadPage /></ProtectedRoute>} />
        <Route path="/alertas"      element={<ProtectedRoute requiredPermission="alertas_ver"><AlertasPage /></ProtectedRoute>} />
        <Route path="/rrhh"         element={<ProtectedRoute requiredPermission="rrhh_ver"><RrhhPage /></ProtectedRoute>} />
        <Route path="/clientes"     element={<ProtectedRoute requiredPermission="ventas_ver"><ClientesPage /></ProtectedRoute>} />
        <Route path="/proveedores"  element={<ProtectedRoute requiredPermission="compras_ver"><ProveedoresPage /></ProtectedRoute>} />
        <Route path="/compras"      element={<ProtectedRoute requiredPermission="compras_ver"><ComprasPage /></ProtectedRoute>} />
        <Route path="/ventas"       element={<ProtectedRoute requiredPermission="ventas_ver"><VentasPage /></ProtectedRoute>} />
        <Route path="/bajas"        element={<ProtectedRoute requiredPermission="animales_ver"><MuerteBajaPage /></ProtectedRoute>} />
        <Route path="/usuarios"     element={<ProtectedRoute requiredPermission="usuarios_ver"><UsuariosPage /></ProtectedRoute>} />
        <Route path="/roles"        element={<ProtectedRoute requiredPermission="roles_ver"><RolesPage /></ProtectedRoute>} />
        <Route path="/fincas"       element={<ProtectedRoute requiredPermission="configuracion_ver"><FincaPage /></ProtectedRoute>} />

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </ErrorBoundary>
    </Layout>
  )
}

// ---------------------------------------------------------------------------
// Contenido raíz — decide qué mostrar según estado de auth
// ---------------------------------------------------------------------------
function AppContent() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/*"
        element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />}
      />
    </Routes>
  )
}

// ---------------------------------------------------------------------------
// App principal — ApolloProvider ya está en main.jsx, no lo duplicamos aquí
// ---------------------------------------------------------------------------
function App() {
  return (
    <AuthProvider>
      <LayoutProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </LayoutProvider>
    </AuthProvider>
  )
}

export default App
