// frontend/src/hooks/useVacunaciones.js
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_VACUNACIONES,
  GET_VACUNAS,
  GET_ANIMALES_ACTIVOS,
  GET_VACUNAS_PROXIMAS,
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

  const { data: vacunasProximas, loading: loadingProximas, refetch: refetchProximas } = useQuery(GET_VACUNAS_PROXIMAS, {
    variables: { dias: 30 }
  })

  // Mutations
  const [crearVacunacionMutation] = useMutation(CREATE_VACUNACION)
  const [actualizarVacunacionMutation] = useMutation(UPDATE_VACUNACION)
  const [eliminarVacunacionMutation] = useMutation(DELETE_VACUNACION)

  const crearVacunacion = async (variables) => {
    try {
      const { data } = await crearVacunacionMutation({
        variables: { fincaId, ...variables }
      })
      await refetchVacunaciones()
      await refetchProximas()
      return { success: true, data: data?.crearVacunacion }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarVacunacion = async (id, variables) => {
    try {
      const { data } = await actualizarVacunacionMutation({
        variables: { id, ...variables }
      })
      await refetchVacunaciones()
      await refetchProximas()
      return { success: true, data: data?.actualizarVacunacion }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarVacunacion = async (id) => {
    try {
      const { data } = await eliminarVacunacionMutation({
        variables: { id }
      })
      await refetchVacunaciones()
      await refetchProximas()
      return { success: true, data: data?.eliminarVacunacion }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    // Data
    vacunaciones: vacunaciones?.vacunaciones || [],
    vacunas: vacunas?.allVacunas || [],
    animalesActivos: animalesActivos?.animalesActivos || [],
    vacunasProximas: vacunasProximas?.vacunasProximas || [],
    
    // Loading
    loading: loadingVacunaciones || loadingVacunas || loadingAnimales || loadingProximas,
    error,
    
    // Functions
    crearVacunacion,
    actualizarVacunacion,
    eliminarVacunacion,
    
    // Refetch
    refetchVacunaciones,
    refetchProximas,
    refetchAnimales,
  }
}