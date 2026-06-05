import { useQuery, useMutation } from '@apollo/client'
import { GET_PROVEEDORES, CREATE_PROVEEDOR, UPDATE_PROVEEDOR, DELETE_PROVEEDOR } from '../graphql/proveedores'

export const useProveedores = () => {
  const { data, loading, error, refetch } = useQuery(GET_PROVEEDORES)

  const [createProveedor] = useMutation(CREATE_PROVEEDOR)
  const [updateProveedor] = useMutation(UPDATE_PROVEEDOR)
  const [deleteProveedor] = useMutation(DELETE_PROVEEDOR)

  const crearProveedor = async (input) => {
    try {
      const variables = { fincaId: "1", ...input }
      const result = await createProveedor({ variables })
      if (result.data?.crearProveedor?.success) {
        refetch()
        return { success: true, message: result.data.crearProveedor.message }
      }
      return { success: false, message: result.data?.crearProveedor?.message || 'Error al crear' }
    } catch (error) {
      console.error('Error creando proveedor:', error)
      return { success: false, message: error.message }
    }
  }

  const actualizarProveedor = async (id, input) => {
    try {
      const result = await updateProveedor({ variables: { id, ...input } })
      if (result.data?.actualizarProveedor?.success) {
        refetch()
        return { success: true, message: result.data.actualizarProveedor.message }
      }
      return { success: false, message: result.data?.actualizarProveedor?.message || 'Error al actualizar' }
    } catch (error) {
      console.error('Error actualizando proveedor:', error)
      return { success: false, message: error.message }
    }
  }

  const eliminarProveedor = async (id) => {
    try {
      const result = await deleteProveedor({ variables: { id } })
      if (result.data?.eliminarProveedor?.success) {
        refetch()
        return { success: true, message: result.data.eliminarProveedor.message }
      }
      return { success: false, message: result.data?.eliminarProveedor?.message || 'Error al eliminar' }
    } catch (error) {
      console.error('Error eliminando proveedor:', error)
      return { success: false, message: error.message }
    }
  }

  return {
    proveedores: data?.proveedores || [],
    loading,
    error,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    refetch
  }
}