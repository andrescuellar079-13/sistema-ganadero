// frontend/src/hooks/useProduccion.js
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_LACTANCIAS,
  GET_LACTANCIAS_ACTIVAS,
  GET_PRODUCCIONES_LECHE,
  GET_PRODUCCIONES_HOY,
  GET_REGISTROS_PESO,
  GET_PRODUCCION_TOTAL_HOY,
  GET_RESUMEN_PRODUCCION,
  GET_ANIMALES_PRODUCCION,
  GET_TOP_5_VACAS_PRODUCCION,  // 👈 Corregido: GET_TOP_5_VACAS_PRODUCCION
  GET_ENGORDES_ACTIVOS,
  CREATE_LACTANCIA,
  SECAR_LACTANCIA,
  CREATE_PRODUCCION_LECHE,
  CREATE_REGISTRO_PESO,
  INICIAR_ENGORDE,
  CAMBIAR_ESTADO_ENGORDE,
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

  // Resumen consolidado de producción (fuente única de los KPIs del módulo)
  const { data: resumenProduccion } = useQuery(GET_RESUMEN_PRODUCCION, {
    variables: { fincaId }
  })

  const { data: top5Vacas } = useQuery(GET_TOP_5_VACAS_PRODUCCION, {  // 👈 Corregido aquí también
    variables: { fincaId }
  })

  const { data: animalesProduccion, loading: loadingAnimales } = useQuery(GET_ANIMALES_PRODUCCION, {
    variables: { fincaId }
  })

  // Engordes activos (carne / engorde)
  const { data: engordesData, loading: loadingEngordes, refetch: refetchEngordes } = useQuery(GET_ENGORDES_ACTIVOS, {
    variables: { fincaId }
  })

  // Registros de peso (para reportes de pesajes / ganancia)
  const { data: registrosPesoData, refetch: refetchRegistrosPeso } = useQuery(GET_REGISTROS_PESO, {
    variables: { fincaId }
  })

  // Mutations
  const [crearLactanciaMutation] = useMutation(CREATE_LACTANCIA)
  const [secarLactanciaMutation] = useMutation(SECAR_LACTANCIA)
  const [crearProduccionMutation] = useMutation(CREATE_PRODUCCION_LECHE)
  const [crearRegistroPesoMutation] = useMutation(CREATE_REGISTRO_PESO)
  const [iniciarEngordeMutation] = useMutation(INICIAR_ENGORDE)
  const [cambiarEstadoEngordeMutation] = useMutation(CAMBIAR_ESTADO_ENGORDE)

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
      // El pesaje alimenta el control de engorde y el peso actual del animal
      await Promise.all([refetchRegistrosPeso(), refetchEngordes()])
      return { success: true, data: data?.crearRegistroPeso }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const iniciarEngorde = async (variables) => {
    try {
      const { data } = await iniciarEngordeMutation({
        variables: { fincaId, ...variables }
      })
      await refetchEngordes()
      return {
        success: data?.iniciarEngorde?.success ?? false,
        message: data?.iniciarEngorde?.message,
        data: data?.iniciarEngorde,
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const cambiarEstadoEngorde = async (id, estado) => {
    try {
      const { data } = await cambiarEstadoEngordeMutation({
        variables: { id, estado }
      })
      await refetchEngordes()
      return {
        success: data?.cambiarEstadoEngorde?.success ?? false,
        message: data?.cambiarEstadoEngorde?.message,
        data: data?.cambiarEstadoEngorde,
      }
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
    resumen: resumenProduccion?.resumenProduccion || null,
    top5Vacas: top5Vacas?.top5VacasProduccion || [],
    animalesProduccion: animalesProduccion?.animalesActivos || [],
    engordesActivos: engordesData?.engordesActivos || [],
    registrosPeso: registrosPesoData?.registrosPeso || [],

    // Loading
    loading: loadingLactancias || loadingActivas || loadingProducciones || loadingHoy || loadingAnimales || loadingEngordes,

    // Functions
    crearLactancia,
    secarLactancia,
    crearProduccion,
    crearRegistroPeso,
    iniciarEngorde,
    cambiarEstadoEngorde,

    // Refetch
    refetchLactancias,
    refetchProducciones,
    refetchHoy,
    refetchEngordes,
  }
}