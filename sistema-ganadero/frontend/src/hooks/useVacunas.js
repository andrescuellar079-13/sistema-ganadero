import { useQuery, useMutation } from '@apollo/client'
import { GET_VACUNAS, CREATE_VACUNA, UPDATE_VACUNA, DELETE_VACUNA } from '../graphql/vacunas'

export const useVacunas = () => {
  const { data, loading, error, refetch } = useQuery(GET_VACUNAS)

  const [createVacuna] = useMutation(CREATE_VACUNA)
  const [updateVacuna] = useMutation(UPDATE_VACUNA)
  const [deleteVacuna] = useMutation(DELETE_VACUNA)

  const crearVacuna = async (input) => {
    try {
      const result = await createVacuna({ variables: input })
      if (result.data.crearVacuna.success) {
        refetch()
        return { success: true, message: result.data.crearVacuna.message }
      }
      return { success: false, message: result.data.crearVacuna.message }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const actualizarVacuna = async (id, input) => {
    try {
      const result = await updateVacuna({ variables: { id, ...input } })
      if (result.data.actualizarVacuna.success) {
        refetch()
        return { success: true, message: result.data.actualizarVacuna.message }
      }
      return { success: false, message: result.data.actualizarVacuna.message }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const eliminarVacuna = async (id) => {
    try {
      const result = await deleteVacuna({ variables: { id } })
      if (result.data.eliminarVacuna.success) {
        refetch()
        return { success: true, message: result.data.eliminarVacuna.message }
      }
      return { success: false, message: result.data.eliminarVacuna.message }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  return {
    vacunas: data?.allVacunas || [],
    loading,
    error,
    crearVacuna,
    actualizarVacuna,
    eliminarVacuna,
    refetch
  }
}