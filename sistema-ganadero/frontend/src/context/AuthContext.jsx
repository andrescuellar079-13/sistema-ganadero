// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { useApolloClient, useMutation } from '@apollo/client'
import { GET_MI_USUARIO, LOGIN, LOGOUT } from '../graphql/auth'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}

// ---------------------------------------------------------------------------
// Helpers de permisos
// ---------------------------------------------------------------------------

/**
 * Dado el array permisosLista del rol, decide si se tiene un permiso.
 *   - 'all' en la lista → acceso total
 *   - coincidencia exacta ('animales_ver')
 *   - coincidencia de módulo ('animales' → cubre 'animales_*')
 */
function evaluarPermiso(permisosLista, permiso) {
  if (!Array.isArray(permisosLista) || !permiso) return false
  if (permisosLista.includes('all')) return true
  if (permisosLista.includes(permiso)) return true
  // módulo: si piden 'animales', verificar si hay algún 'animales_*'
  const modulo = permiso.split('_')[0]
  if (modulo !== permiso && permisosLista.includes(modulo)) return true
  return false
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const AuthProvider = ({ children }) => {
  const client = useApolloClient()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const [loginMutation] = useMutation(LOGIN)
  const [logoutMutation] = useMutation(LOGOUT)

  // -------------------------------------------------------------------------
  // Carga del usuario con el token actual
  // -------------------------------------------------------------------------
  const cargarUsuario = useCallback(async () => {
    const tkn = localStorage.getItem('token')
    if (!tkn) {
      setUser(null)
      setLoading(false)
      return null
    }

    try {
      const { data, errors } = await client.query({
        query: GET_MI_USUARIO,
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      })

      if (data?.miUsuario) {
        setUser(data.miUsuario)
        if (data.miUsuario.finca?.id) {
          localStorage.setItem('fincaId', data.miUsuario.finca.id)
        }
        setLoading(false)
        return data.miUsuario
      }

      // Si hay errores de autenticación (token inválido/expirado)
      const esErrorAuth = errors?.some(
        (e) =>
          e.message?.toLowerCase().includes('not authenticated') ||
          e.message?.toLowerCase().includes('signature has expired') ||
          e.message?.toLowerCase().includes('invalid token')
      )
      if (esErrorAuth) {
        _limpiarSesion()
      }
    } catch {
      // Error de red u otro — mantener el estado sin desloguear
    }

    setLoading(false)
    return null
  }, [client])

  // -------------------------------------------------------------------------
  // Carga inicial al montar / cuando cambia el token
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (token) {
      cargarUsuario()
    } else {
      setUser(null)
      setLoading(false)
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------
  const login = async (username, password) => {
    try {
      const { data } = await loginMutation({
        variables: {
          username: username.trim(),
          password: password.trim(),
        },
        errorPolicy: 'all',
      })

      const newToken = data?.tokenAuth?.token
      if (!newToken) {
        return { success: false, message: 'Credenciales inválidas' }
      }

      localStorage.setItem('token', newToken)
      setToken(newToken)

      // Limpiar caché antes de cargar el usuario para evitar datos stale
      await client.clearStore()

      const usuario = await cargarUsuario()
      if (!usuario) {
        return { success: false, message: 'Login correcto pero no se pudo cargar el usuario' }
      }

      return { success: true, user: usuario }
    } catch (error) {
      const msg = error?.graphQLErrors?.[0]?.message || error?.message || 'Error al iniciar sesión'
      return { success: false, message: traducirErrorLogin(msg) }
    }
  }

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      await logoutMutation()
    } catch {
      // El backend puede fallar pero el cierre local siempre ocurre
    }
    _limpiarSesion()
    // Resetear el store después de limpiar para no reejecutar queries con token viejo
    try {
      await client.resetStore()
    } catch {
      await client.clearStore()
    }
  }, [client, logoutMutation])

  // -------------------------------------------------------------------------
  // Limpieza interna de sesión
  // -------------------------------------------------------------------------
  const _limpiarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('fincaId')
    setToken(null)
    setUser(null)
  }

  // -------------------------------------------------------------------------
  // Permisos
  // -------------------------------------------------------------------------
  const tienePermiso = useCallback(
    (permiso) => {
      if (!user?.rol?.permisosLista) return false
      return evaluarPermiso(user.rol.permisosLista, permiso)
    },
    [user]
  )

  const esAdministrador = user?.rol
    ? evaluarPermiso(user.rol.permisosLista ?? [], 'all') ||
      ['administrador', 'admin', 'super_admin'].includes(
        user.rol.nombre?.toLowerCase() ?? ''
      )
    : false

  // -------------------------------------------------------------------------
  // Valor del contexto
  // -------------------------------------------------------------------------
  const value = {
    user,
    loading,
    isAuthenticated: !!user && !!token,
    esAdministrador,
    login,
    logout,
    tienePermiso,
    userRole: user?.rol?.nombre ?? null,
    nombreCompleto: user
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username
      : null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------
// Mapa de errores de backend a mensajes amigables en español
// ---------------------------------------------------------------------------
function traducirErrorLogin(msg) {
  const m = msg.toLowerCase()
  if (m.includes('invalid credentials') || m.includes('please enter valid credentials'))
    return 'Usuario o contraseña incorrectos'
  if (m.includes('not active') || m.includes('disabled'))
    return 'Tu cuenta está desactivada. Contacta al administrador.'
  if (m.includes('signature has expired') || m.includes('token expired'))
    return 'Tu sesión ha expirado. Inicia sesión de nuevo.'
  return msg
}
