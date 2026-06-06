// frontend/src/hooks/useAlertas.js
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_ALERTAS,
  GET_ALERTAS_PENDIENTES,
  GET_GASTOS,
  GET_TOTAL_GASTOS,
  CREATE_GASTO,
  UPDATE_GASTO,
  DELETE_GASTO,
  MARCAR_ALERTA_LEIDA,
  DELETE_ALERTA,
} from '../graphql/alertas'

export const useAlertas = () => {
  const fincaId = localStorage.getItem('fincaId') || '1'

  // Queries
  const { data: alertas, loading: loadingAlertas, refetch: refetchAlertas } = useQuery(GET_ALERTAS, {
    variables: { fincaId }
  })

  const { data: alertasPendientes, loading: loadingPendientes, refetch: refetchPendientes } = useQuery(GET_ALERTAS_PENDIENTES, {
    variables: { fincaId }
  })

  const { data: gastos, loading: loadingGastos, refetch: refetchGastos } = useQuery(GET_GASTOS, {
    variables: { fincaId }
  })

  const { data: totalGastos, refetch: refetchTotal } = useQuery(GET_TOTAL_GASTOS, {
    variables: { fincaId, anio: new Date().getFullYear() }
  })

  // Mutations
  const [crearGastoMutation] = useMutation(CREATE_GASTO)
  const [actualizarGastoMutation] = useMutation(UPDATE_GASTO)
  const [eliminarGastoMutation] = useMutation(DELETE_GASTO)
  const [marcarLeidaMutation] = useMutation(MARCAR_ALERTA_LEIDA)
  const [eliminarAlertaMutation] = useMutation(DELETE_ALERTA)

  const crearGasto = async (variables) => {
    try {
      const { data } = await crearGastoMutation({
        variables: { fincaId, ...variables }
      })
      await refetchGastos()
      await refetchTotal()
      return { success: true, data: data?.crearGasto }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarGasto = async (id, variables) => {
    try {
      const { data } = await actualizarGastoMutation({
        variables: { id, ...variables }
      })
      await refetchGastos()
      await refetchTotal()
      return { success: true, data: data?.actualizarGasto }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarGasto = async (id) => {
    try {
      const { data } = await eliminarGastoMutation({ variables: { id } })
      await refetchGastos()
      await refetchTotal()
      return { success: true, data: data?.eliminarGasto }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const marcarAlertaLeida = async (id) => {
    try {
      const { data } = await marcarLeidaMutation({ variables: { id } })
      await refetchAlertas()
      await refetchPendientes()
      return { success: true, data: data?.marcarAlertaLeida }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarAlerta = async (id) => {
    try {
      const { data } = await eliminarAlertaMutation({ variables: { id } })
      await refetchAlertas()
      await refetchPendientes()
      return { success: true, data: data?.eliminarAlerta }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    // Data
    alertas: alertas?.alertas || [],
    alertasPendientes: alertasPendientes?.alertasPendientes || [],
    gastos: gastos?.gastos || [],
    totalGastos: totalGastos?.totalGastos || 0,

    // Loading
    loading: loadingAlertas || loadingPendientes || loadingGastos,

    // Functions
    crearGasto,
    actualizarGasto,
    eliminarGasto,
    marcarAlertaLeida,
    eliminarAlerta,

    // Refetch
    refetchAlertas,
    refetchGastos,
    refetchPendientes,
  }
}