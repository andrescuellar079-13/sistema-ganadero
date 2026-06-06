import { useQuery, useMutation } from '@apollo/client'
import { GET_CLIENTES, CREATE_CLIENTE, UPDATE_CLIENTE, DELETE_CLIENTE } from '../graphql/clientes'

export const useClientes = () => {
  const { data, loading, error, refetch } = useQuery(GET_CLIENTES)

  const [createCliente] = useMutation(CREATE_CLIENTE)
  const [updateCliente] = useMutation(UPDATE_CLIENTE)
  const [deleteCliente] = useMutation(DELETE_CLIENTE)

  const crearCliente = async (input) => {
    try {
      const variables = { fincaId: "1", ...input }
      const result = await createCliente({ variables })
      if (result.data?.crearCliente?.success) {
        refetch()
        return { success: true, message: result.data.crearCliente.message }
      }
      return { success: false, message: result.data?.crearCliente?.message || 'Error al crear' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const actualizarCliente = async (id, input) => {
    try {
      const result = await updateCliente({ variables: { id, ...input } })
      if (result.data?.actualizarCliente?.success) {
        refetch()
        return { success: true, message: result.data.actualizarCliente.message }
      }
      return { success: false, message: result.data?.actualizarCliente?.message || 'Error al actualizar' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const eliminarCliente = async (id) => {
    try {
      const result = await deleteCliente({ variables: { id } })
      if (result.data?.eliminarCliente?.success) {
        refetch()
        return { success: true, message: result.data.eliminarCliente.message }
      }
      return { success: false, message: result.data?.eliminarCliente?.message || 'Error al eliminar' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  return {
    clientes: data?.clientes || [],
    loading,
    error,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    refetch
  }
}