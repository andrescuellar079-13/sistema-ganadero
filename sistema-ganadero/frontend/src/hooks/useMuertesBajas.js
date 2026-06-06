import { useQuery, useMutation } from '@apollo/client'
import {
  GET_MUERTES_BAJAS,
  CREATE_MUERTE_BAJA,
  DELETE_MUERTE_BAJA,
  UPDATE_MUERTE_BAJA,
  GET_ANIMALES_DISPONIBLES,
} from '../graphql/ventas'

export const useMuertesBajas = () => {
  const { data, loading, error, refetch } = useQuery(GET_MUERTES_BAJAS)
  const { data: animalesData, loading: loadingAnimales, refetch: refetchAnimales } = useQuery(GET_ANIMALES_DISPONIBLES)

  const [createMuerteBaja] = useMutation(CREATE_MUERTE_BAJA)
  const [deleteMuerteBaja] = useMutation(DELETE_MUERTE_BAJA)
  const [updateMuerteBaja] = useMutation(UPDATE_MUERTE_BAJA)

  const crearMuerteBaja = async (input) => {
    try {
      const variables = { fincaId: '1', ...input }
      const result = await createMuerteBaja({ variables })
      if (result.data?.crearMuerteBaja?.success) {
        refetch()
        refetchAnimales()
        return { success: true, message: result.data.crearMuerteBaja.message }
      }
      return {
        success: false,
        message: result.data?.crearMuerteBaja?.message || 'Error al registrar',
      }
    } catch (error) {
      console.error('Error creando muerte/baja:', error)
      return { success: false, message: error.message }
    }
  }

  const actualizarMuerteBaja = async (id, input) => {
    try {
      const result = await updateMuerteBaja({ variables: { id, ...input } })
      if (result.data?.actualizarMuerteBaja?.success) {
        refetch()
        return { success: true, message: result.data.actualizarMuerteBaja.message }
      }
      return {
        success: false,
        message: result.data?.actualizarMuerteBaja?.message || 'Error al actualizar',
      }
    } catch (error) {
      console.error('Error actualizando muerte/baja:', error)
      return { success: false, message: error.message }
    }
  }

  const eliminarMuerteBaja = async (id) => {
    try {
      const result = await deleteMuerteBaja({ variables: { id } })
      if (result.data?.eliminarMuerteBaja?.success) {
        refetch()
        refetchAnimales()
        return { success: true, message: result.data.eliminarMuerteBaja.message }
      }
      return {
        success: false,
        message: result.data?.eliminarMuerteBaja?.message || 'Error al eliminar',
      }
    } catch (error) {
      console.error('Error eliminando muerte/baja:', error)
      return { success: false, message: error.message }
    }
  }

  return {
    muertesBajas: data?.muertesBajas || [],
    animalesDisponibles: animalesData?.animalesDisponibles || [],
    loading: loading || loadingAnimales,
    error,
    crearMuerteBaja,
    actualizarMuerteBaja,
    eliminarMuerteBaja,
    refetch,
  }
}