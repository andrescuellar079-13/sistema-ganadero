// frontend/src/hooks/useFincas.js
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_FINCAS,
  GET_FINCA_ACTUAL,
  CREATE_FINCA,
  UPDATE_FINCA,
  DELETE_FINCA,
} from '../graphql/fincas'

export const useFincas = () => {
  // Queries
  const { data: fincas, loading: loadingFincas, error, refetch: refetchFincas } = useQuery(GET_FINCAS)
  const { data: fincaActual, loading: loadingActual, refetch: refetchActual } = useQuery(GET_FINCA_ACTUAL)

  // Mutations
  const [crearFincaMutation] = useMutation(CREATE_FINCA)
  const [actualizarFincaMutation] = useMutation(UPDATE_FINCA)
  const [eliminarFincaMutation] = useMutation(DELETE_FINCA)

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
    
    // Loading
    loading: loadingFincas || loadingActual,
    error,
    
    // Functions
    crearFinca,
    actualizarFinca,
    eliminarFinca,
    
    // Refetch
    refetchFincas,
    refetchActual,
  }
}