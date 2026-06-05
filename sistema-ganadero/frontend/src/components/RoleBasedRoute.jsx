// frontend/src/components/RoleBasedRoute.jsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import UnauthorizedPage from '../pages/UnauthorizedPage'

/**
 * Protege una ruta por nombre de rol o permiso.
 *
 * Props:
 *   roles?: string[]          — lista de nombres de rol permitidos
 *   permiso?: string          — permiso específico requerido
 *   mostrarDenegado?: boolean — si true muestra pantalla de acceso denegado
 *                               en lugar de redirigir (default: false)
 *   children: ReactNode
 */
const RoleBasedRoute = ({
  children,
  roles = [],
  permiso = null,
  mostrarDenegado = false,
}) => {
  const { isAuthenticated, loading, userRole, tienePermiso, esAdministrador } = useAuth()

  if (loading) return <LoadingSpinner />

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Administrador siempre pasa
  if (esAdministrador) return children

  // Verificar rol específico
  if (roles.length > 0 && !roles.includes(userRole)) {
    return mostrarDenegado ? <UnauthorizedPage /> : <Navigate to="/unauthorized" replace />
  }

  // Verificar permiso específico
  if (permiso && !tienePermiso(permiso)) {
    return mostrarDenegado ? <UnauthorizedPage /> : <Navigate to="/unauthorized" replace />
  }

  return children
}

export default RoleBasedRoute
