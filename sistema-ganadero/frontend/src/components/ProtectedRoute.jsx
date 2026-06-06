// frontend/src/components/ProtectedRoute.jsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

/**
 * Protege una ruta:
 *   - Si cargando: spinner
 *   - Si no autenticado: redirige al login
 *   - Si no tiene permiso (y no es administrador): redirige a /unauthorized
 *   - Si tiene permiso o es administrador: muestra el contenido
 *
 * Props:
 *   requiredPermission?: string   — permiso concreto requerido (opcional)
 *   children: ReactNode
 */
const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const { isAuthenticated, loading, tienePermiso, esAdministrador } = useAuth()

  if (loading) return <LoadingSpinner />

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (requiredPermission && !esAdministrador && !tienePermiso(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
