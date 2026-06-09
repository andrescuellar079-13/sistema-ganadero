// frontend/src/hooks/useVacunaciones.js
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_VACUNACIONES,
  GET_VACUNAS,
  GET_ANIMALES_ACTIVOS,
  GET_VETERINARIOS,
  GET_VACUNAS_PROXIMAS,
  GET_VACUNAS_VENCIDAS,
  CREATE_VACUNACION,
  UPDATE_VACUNACION,
  DELETE_VACUNACION,
} from '../graphql/vacunaciones'

export const useVacunaciones = () => {
  const fincaId = localStorage.getItem('fincaId') || '1'

  // Queries
  const { data: vacunaciones, loading: loadingVacunaciones, error, refetch: refetchVacunaciones } = useQuery(GET_VACUNACIONES, {
    variables: { fincaId }
  })

  const { data: vacunas, loading: loadingVacunas } = useQuery(GET_VACUNAS)

  const { data: animalesActivos, loading: loadingAnimales, refetch: refetchAnimales } = useQuery(GET_ANIMALES_ACTIVOS, {
    variables: { fincaId }
  })

  const { data: veterinarios, loading: loadingVeterinarios } = useQuery(GET_VETERINARIOS)

  const { data: vacunasProximas, loading: loadingProximas, refetch: refetchProximas } = useQuery(GET_VACUNAS_PROXIMAS, {
    variables: { fincaId, dias: 30 }
  })

  const { data: vacunasVencidas, loading: loadingVencidas, refetch: refetchVencidas } = useQuery(GET_VACUNAS_VENCIDAS, {
    variables: { fincaId }
  })

  // Mutations
  const [crearVacunacionMutation] = useMutation(CREATE_VACUNACION)
  const [actualizarVacunacionMutation] = useMutation(UPDATE_VACUNACION)
  const [eliminarVacunacionMutation] = useMutation(DELETE_VACUNACION)

  const refetchAll = async () => {
    await Promise.all([refetchVacunaciones(), refetchProximas(), refetchVencidas()])
  }

  const crearVacunacion = async (variables) => {
    try {
      const { data } = await crearVacunacionMutation({
        variables: { fincaId, ...variables }
      })
      const r = data?.crearVacunacion || {}
      if (r.success) await refetchAll()
      return r
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const actualizarVacunacion = async (id, variables) => {
    try {
      const { data } = await actualizarVacunacionMutation({
        variables: { id, ...variables }
      })
      const r = data?.actualizarVacunacion || {}
      if (r.success) await refetchAll()
      return r
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const eliminarVacunacion = async (id) => {
    try {
      const { data } = await eliminarVacunacionMutation({
        variables: { id }
      })
      const r = data?.eliminarVacunacion || {}
      if (r.success) await refetchAll()
      return r
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  return {
    // Data
    vacunaciones: vacunaciones?.vacunaciones || [],
    vacunas: vacunas?.allVacunas || [],
    animalesActivos: animalesActivos?.animalesActivos || [],
    veterinarios: veterinarios?.veterinarios || [],
    vacunasProximas: vacunasProximas?.vacunasProximas || [],
    vacunasVencidas: vacunasVencidas?.vacunasVencidas || [],

    // Loading
    loading: loadingVacunaciones || loadingVacunas || loadingAnimales || loadingVeterinarios || loadingProximas || loadingVencidas,
    error,

    // Functions
    crearVacunacion,
    actualizarVacunacion,
    eliminarVacunacion,

    // Refetch
    refetchVacunaciones,
    refetchProximas,
    refetchVencidas,
    refetchAnimales,
  }
}
