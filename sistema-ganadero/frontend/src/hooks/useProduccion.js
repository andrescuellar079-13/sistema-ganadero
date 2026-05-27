// frontend/src/hooks/useProduccion.js
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_LACTANCIAS,
  GET_LACTANCIAS_ACTIVAS,
  GET_PRODUCCIONES_LECHE,
  GET_PRODUCCIONES_HOY,
  GET_REGISTROS_PESO,
  GET_PRODUCCION_TOTAL_HOY,
  GET_TOP_5_VACAS_PRODUCCION,  // 👈 Corregido: GET_TOP_5_VACAS_PRODUCCION
  CREATE_LACTANCIA,
  SECAR_LACTANCIA,
  CREATE_PRODUCCION_LECHE,
  CREATE_REGISTRO_PESO,
} from '../graphql/produccion'

export const useProduccion = () => {
  const fincaId = localStorage.getItem('fincaId') || '1'

  // Queries
  const { data: lactancias, loading: loadingLactancias, refetch: refetchLactancias } = useQuery(GET_LACTANCIAS, {
    variables: { fincaId }
  })
  
  const { data: lactanciasActivas, loading: loadingActivas, refetch: refetchActivas } = useQuery(GET_LACTANCIAS_ACTIVAS, {
    variables: { fincaId }
  })
  
  const { data: producciones, loading: loadingProducciones, refetch: refetchProducciones } = useQuery(GET_PRODUCCIONES_LECHE, {
    variables: { fincaId }
  })
  
  const { data: produccionesHoy, loading: loadingHoy, refetch: refetchHoy } = useQuery(GET_PRODUCCIONES_HOY, {
    variables: { fincaId }
  })
  
  const { data: produccionTotalHoy } = useQuery(GET_PRODUCCION_TOTAL_HOY, {
    variables: { fincaId }
  })
  
  const { data: top5Vacas } = useQuery(GET_TOP_5_VACAS_PRODUCCION, {  // 👈 Corregido aquí también
    variables: { fincaId }
  })

  // Mutations
  const [crearLactanciaMutation] = useMutation(CREATE_LACTANCIA)
  const [secarLactanciaMutation] = useMutation(SECAR_LACTANCIA)
  const [crearProduccionMutation] = useMutation(CREATE_PRODUCCION_LECHE)
  const [crearRegistroPesoMutation] = useMutation(CREATE_REGISTRO_PESO)

  const crearLactancia = async (variables) => {
    try {
      const { data } = await crearLactanciaMutation({
        variables: { fincaId, ...variables }
      })
      await refetchLactancias()
      await refetchActivas()
      return { success: true, data: data?.crearLactancia }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const secarLactancia = async (id, fechaSecado) => {
    try {
      const { data } = await secarLactanciaMutation({
        variables: { id, fechaSecado }
      })
      await refetchLactancias()
      await refetchActivas()
      return { success: true, data: data?.secarLactancia }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const crearProduccion = async (variables) => {
    try {
      const { data } = await crearProduccionMutation({
        variables: { fincaId, ...variables }
      })
      await refetchProducciones()
      await refetchHoy()
      return { success: true, data: data?.crearProduccionLeche }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const crearRegistroPeso = async (variables) => {
    try {
      const { data } = await crearRegistroPesoMutation({
        variables: { fincaId, ...variables }
      })
      return { success: true, data: data?.crearRegistroPeso }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    // Data
    lactancias: lactancias?.lactancias || [],
    lactanciasActivas: lactanciasActivas?.lactanciasActivas || [],
    producciones: producciones?.produccionesLeche || [],
    produccionesHoy: produccionesHoy?.produccionesHoy || [],
    produccionTotalHoy: produccionTotalHoy?.produccionTotalHoy || 0,
    top5Vacas: top5Vacas?.top5VacasProduccion || [],
    
    // Loading
    loading: loadingLactancias || loadingActivas || loadingProducciones || loadingHoy,
    
    // Functions
    crearLactancia,
    secarLactancia,
    crearProduccion,
    crearRegistroPeso,
    
    // Refetch
    refetchLactancias,
    refetchProducciones,
    refetchHoy,
  }
}