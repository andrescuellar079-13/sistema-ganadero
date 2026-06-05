// frontend/src/hooks/useVentas.js
import { useQuery, useMutation } from '@apollo/client'
import { 
  GET_NOTAS_VENTA, 
  CREATE_NOTA_VENTA, 
  CREATE_DETALLE_VENTA,
  UPDATE_NOTA_VENTA,
  UPDATE_DETALLE_VENTA,
  DELETE_NOTA_VENTA,
  DELETE_DETALLE_VENTA,
  GET_CLIENTES,
  GET_ANIMALES_DISPONIBLES
} from '../graphql/ventas'

export const useVentas = () => {
  const { data, loading, error, refetch } = useQuery(GET_NOTAS_VENTA)
  const { data: clientesData, loading: loadingClientes } = useQuery(GET_CLIENTES)
  const { data: animalesData, loading: loadingAnimales, refetch: refetchAnimales } = useQuery(GET_ANIMALES_DISPONIBLES)

  const [createNotaVenta] = useMutation(CREATE_NOTA_VENTA)
  const [createDetalleVenta] = useMutation(CREATE_DETALLE_VENTA)
  const [updateNotaVenta] = useMutation(UPDATE_NOTA_VENTA)
  const [updateDetalleVenta] = useMutation(UPDATE_DETALLE_VENTA)
  const [deleteNotaVenta] = useMutation(DELETE_NOTA_VENTA)
  const [deleteDetalleVenta] = useMutation(DELETE_DETALLE_VENTA)

  const crearNotaVenta = async (input) => {
    try {
      const variables = { fincaId: '1', ...input }
      const result = await createNotaVenta({ variables })
      if (result.data?.crearNotaVenta?.success) {
        await refetch()
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
        await refetch()
        await refetchAnimales()
        return { success: true, message: result.data.crearDetalleVenta.message }
      }
      return { success: false, message: result.data?.crearDetalleVenta?.message || 'Error al agregar detalle' }
    } catch (error) {
      console.error('Error creando detalle de venta:', error)
      return { success: false, message: error.message }
    }
  }

  const actualizarNotaVenta = async (id, input) => {
    try {
      const result = await updateNotaVenta({ 
        variables: { 
          id,
          clienteId: input.clienteId,
          fechaVenta: input.fechaVenta,
          observaciones: input.observaciones || null
        } 
      })
      
      if (result.data?.actualizarNotaVenta?.success) {
        await refetch()
        return { 
          success: true, 
          message: result.data.actualizarNotaVenta.message,
          data: result.data.actualizarNotaVenta.notaVenta
        }
      }
      return { success: false, message: result.data?.actualizarNotaVenta?.message || 'Error al actualizar' }
    } catch (error) {
      console.error('Error actualizando nota de venta:', error)
      return { success: false, message: error.message }
    }
  }

  const actualizarDetalleVenta = async (id, input) => {
    try {
      const result = await updateDetalleVenta({ 
        variables: { 
          id,
          pesoVentaKg: input.pesoVentaKg,
          precioKg: input.precioKg
        } 
      })
      if (result.data?.actualizarDetalleVenta?.success) {
        await refetch()
        return { success: true, message: result.data.actualizarDetalleVenta.message }
      }
      return { success: false, message: result.data?.actualizarDetalleVenta?.message || 'Error al actualizar detalle' }
    } catch (error) {
      console.error('Error actualizando detalle de venta:', error)
      return { success: false, message: error.message }
    }
  }

  const eliminarNotaVenta = async (id) => {
    try {
      const result = await deleteNotaVenta({ variables: { id } })
      if (result.data?.eliminarNotaVenta?.success) {
        await refetch()
        await refetchAnimales()
        return { success: true, message: result.data.eliminarNotaVenta.message }
      }
      return { success: false, message: result.data?.eliminarNotaVenta?.message || 'Error al eliminar' }
    } catch (error) {
      console.error('Error eliminando nota de venta:', error)
      return { success: false, message: error.message }
    }
  }

  const eliminarDetalleVenta = async (id) => {
    try {
      const result = await deleteDetalleVenta({ variables: { id } })
      if (result.data?.eliminarDetalleVenta?.success) {
        await refetch()
        await refetchAnimales()
        return { success: true, message: result.data.eliminarDetalleVenta.message }
      }
      return { success: false, message: result.data?.eliminarDetalleVenta?.message || 'Error al eliminar detalle' }
    } catch (error) {
      console.error('Error eliminando detalle de venta:', error)
      return { success: false, message: error.message }
    }
  }

  const actualizarVentaCompleta = async (id, formData, nuevosDetalles) => {
    try {
      const resultVenta = await actualizarNotaVenta(id, {
        clienteId: formData.clienteId,
        fechaVenta: formData.fechaVenta,
        observaciones: formData.observaciones
      })
      
      if (!resultVenta.success) {
        return resultVenta
      }
      
      const ventaActual = data?.notasVenta?.find(v => v.id === id)
      
      if (ventaActual?.detalles) {
        for (const detalle of ventaActual.detalles) {
          await eliminarDetalleVenta(detalle.id)
        }
      }
      
      for (const detalle of nuevosDetalles) {
        await crearDetalleVenta({
          notaVentaId: id,
          animalId: detalle.animalId,
          pesoVentaKg: parseFloat(detalle.pesoVentaKg),
          precioKg: parseFloat(detalle.precioKg)
        })
      }
      
      await refetch()
      return { success: true, message: 'Venta actualizada exitosamente' }
    } catch (error) {
      console.error('Error actualizando venta completa:', error)
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
    actualizarNotaVenta,
    actualizarDetalleVenta,
    eliminarNotaVenta,
    eliminarDetalleVenta,
    actualizarVentaCompleta,
    refetch
  }
}