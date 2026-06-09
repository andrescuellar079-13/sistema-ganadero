// frontend/src/hooks/useFincas.js
import { useApolloClient, useQuery, useMutation } from '@apollo/client'
import {
  GET_FINCAS,
  GET_FINCA_ACTUAL,
  GET_MIS_FINCAS,
  CREATE_FINCA,
  UPDATE_FINCA,
  DELETE_FINCA,
  SELECCIONAR_FINCA_ACTIVA,
} from '../graphql/fincas'

export const useFincas = () => {
  const client = useApolloClient()

  // Queries
  const { data: fincas, loading: loadingFincas, error, refetch: refetchFincas } = useQuery(GET_FINCAS)
  const { data: fincaActual, loading: loadingActual, refetch: refetchActual } = useQuery(GET_FINCA_ACTUAL)
  const { data: misFincasData, loading: loadingMis, refetch: refetchMisFincas } = useQuery(GET_MIS_FINCAS)

  // Mutations
  const [crearFincaMutation] = useMutation(CREATE_FINCA)
  const [actualizarFincaMutation] = useMutation(UPDATE_FINCA)
  const [eliminarFincaMutation] = useMutation(DELETE_FINCA)
  const [seleccionarFincaActivaMutation] = useMutation(SELECCIONAR_FINCA_ACTIVA)

  // Selecciona la finca activa (valida pertenencia en el backend) y refresca el store.
  const setFincaActiva = async (fincaId) => {
    try {
      const { data } = await seleccionarFincaActivaMutation({ variables: { fincaId } })
      const res = data?.seleccionarFincaActiva
      if (res?.success) {
        localStorage.setItem('fincaId', String(fincaId))
        await client.resetStore()
      }
      return { success: !!res?.success, message: res?.message }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  const crearFinca = async (variables) => {
    try {
      const { data } = await crearFincaMutation({ variables })
      await refetchFincas()
      return { success: true, data: data?.crearFinca }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarFinca = async (id, variables) => {
    try {
      const { data } = await actualizarFincaMutation({ variables: { id, ...variables } })
      await refetchFincas()
      await refetchActual()
      return { success: true, data: data?.actualizarFinca }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarFinca = async (id) => {
    try {
      const { data } = await eliminarFincaMutation({ variables: { id } })
      await refetchFincas()
      if (data?.eliminarFinca?.success) {
        await refetchActual()
      }
      return { success: true, data: data?.eliminarFinca }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    // Data
    fincas: fincas?.fincas || [],
    fincaActual: fincaActual?.fincaActual || null,
    misFincas: misFincasData?.misFincas || [],

    // Loading
    loading: loadingFincas || loadingActual,
    loadingMisFincas: loadingMis,
    error,

    // Functions
    crearFinca,
    actualizarFinca,
    eliminarFinca,
    setFincaActiva,

    // Refetch
    refetchFincas,
    refetchActual,
    refetchMisFincas,
  }
}