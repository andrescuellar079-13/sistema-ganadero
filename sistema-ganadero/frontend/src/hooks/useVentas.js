// frontend/src/hooks/useVentas.js
import { useQuery, useMutation } from '@apollo/client'
import { 
  GET_NOTAS_VENTA, 
  CREATE_NOTA_VENTA, 
  CREATE_DETALLE_VENTA,
  GET_CLIENTES,
  GET_ANIMALES_DISPONIBLES
} from '../graphql/ventas'

export const useVentas = () => {
  const { data, loading, error, refetch } = useQuery(GET_NOTAS_VENTA)
  const { data: clientesData, loading: loadingClientes } = useQuery(GET_CLIENTES)
  const { data: animalesData, loading: loadingAnimales, refetch: refetchAnimales } = useQuery(GET_ANIMALES_DISPONIBLES)

  const [createNotaVenta] = useMutation(CREATE_NOTA_VENTA)
  const [createDetalleVenta] = useMutation(CREATE_DETALLE_VENTA)

  const crearNotaVenta = async (input) => {
    try {
      const variables = { fincaId: '1', ...input }
      const result = await createNotaVenta({ variables })
      if (result.data?.crearNotaVenta?.success) {
        refetch()
        return { 
          success: true, 
          message: result.data.crearNotaVenta.message, 
          id: result.data.crearNotaVenta.notaVenta.id 
        }
      }
      return { success: false, message: result.data?.crearNotaVenta?.message || 'Error al crear' }
    } catch (error) {
      console.error('Error creando nota de venta:', error)
      return { success: false, message: error.message }
    }
  }

  const crearDetalleVenta = async (input) => {
    try {
      const result = await createDetalleVenta({ variables: input })
      if (result.data?.crearDetalleVenta?.success) {
        refetch()
        refetchAnimales()
        return { success: true, message: result.data.crearDetalleVenta.message }
      }
      return { success: false, message: result.data?.crearDetalleVenta?.message || 'Error al agregar detalle' }
    } catch (error) {
      console.error('Error creando detalle de venta:', error)
      return { success: false, message: error.message }
    }
  }

  return {
    notasVenta: data?.notasVenta || [],
    clientes: clientesData?.clientes || [],
    animalesDisponibles: animalesData?.animalesDisponibles || [],
    loading: loading || loadingClientes || loadingAnimales,
    error,
    crearNotaVenta,
    crearDetalleVenta,
    refetch
  }
}