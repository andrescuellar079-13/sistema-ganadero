// frontend/src/hooks/useRrhh.js
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_TIPOS_EMPLEADO,
  GET_EMPLEADOS,
  GET_EMPLEADOS_ACTIVOS,
  CREATE_TIPO_EMPLEADO,
  UPDATE_TIPO_EMPLEADO,
  DELETE_TIPO_EMPLEADO,
  CREATE_EMPLEADO,
  UPDATE_EMPLEADO,
  DELETE_EMPLEADO,
} from '../graphql/rrhh'

export const useRrhh = () => {
  const fincaId = localStorage.getItem('fincaId') || '1'

  // Queries
  const { data: tipos, loading: loadingTipos, refetch: refetchTipos } = useQuery(GET_TIPOS_EMPLEADO, {
    variables: { fincaId }
  })

  const { data: empleados, loading: loadingEmpleados, refetch: refetchEmpleados } = useQuery(GET_EMPLEADOS, {
    variables: { fincaId }
  })

  const { data: empleadosActivos, loading: loadingActivos, refetch: refetchActivos } = useQuery(GET_EMPLEADOS_ACTIVOS, {
    variables: { fincaId }
  })

  // Mutations - Tipos
  const [crearTipoMutation] = useMutation(CREATE_TIPO_EMPLEADO)
  const [actualizarTipoMutation] = useMutation(UPDATE_TIPO_EMPLEADO)
  const [eliminarTipoMutation] = useMutation(DELETE_TIPO_EMPLEADO)

  // Mutations - Empleados
  const [crearEmpleadoMutation] = useMutation(CREATE_EMPLEADO)
  const [actualizarEmpleadoMutation] = useMutation(UPDATE_EMPLEADO)
  const [eliminarEmpleadoMutation] = useMutation(DELETE_EMPLEADO)

  const crearTipo = async (variables) => {
    try {
      const { data } = await crearTipoMutation({ variables })
      await refetchTipos()
      return { success: true, data: data?.crearTipoEmpleado }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarTipo = async (id, variables) => {
    try {
      const { data } = await actualizarTipoMutation({ variables: { id, ...variables } })
      await refetchTipos()
      return { success: true, data: data?.actualizarTipoEmpleado }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarTipo = async (id) => {
    try {
      const { data } = await eliminarTipoMutation({ variables: { id } })
      await refetchTipos()
      return { success: true, data: data?.eliminarTipoEmpleado }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const crearEmpleado = async (variables) => {
    try {
      const { data } = await crearEmpleadoMutation({
        variables: { fincaId, ...variables }
      })
      await refetchEmpleados()
      await refetchActivos()
      return { success: true, data: data?.crearEmpleado }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarEmpleado = async (id, variables) => {
    try {
      const { data } = await actualizarEmpleadoMutation({ variables: { id, ...variables } })
      await refetchEmpleados()
      await refetchActivos()
      return { success: true, data: data?.actualizarEmpleado }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarEmpleado = async (id) => {
    try {
      const { data } = await eliminarEmpleadoMutation({ variables: { id } })
      await refetchEmpleados()
      await refetchActivos()
      return { success: true, data: data?.eliminarEmpleado }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    // Data
    tipos: tipos?.tiposEmpleado || [],
    empleados: empleados?.empleados || [],
    empleadosActivos: empleadosActivos?.empleadosActivos || [],

    // Loading
    loading: loadingTipos || loadingEmpleados || loadingActivos,

    // Functions - Tipos
    crearTipo,
    actualizarTipo,
    eliminarTipo,

    // Functions - Empleados
    crearEmpleado,
    actualizarEmpleado,
    eliminarEmpleado,

    // Refetch
    refetchTipos,
    refetchEmpleados,
    refetchActivos,
  }
}