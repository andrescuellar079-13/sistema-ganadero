// frontend/src/hooks/useVentas.js
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_NOTAS_VENTA,
  GET_CLIENTES,
  GET_ANIMALES_DISPONIBLES,
  GET_CORRALES_VENTA,
  CREATE_NOTA_VENTA,
  UPDATE_NOTA_VENTA,
  DELETE_NOTA_VENTA,
  CREATE_DETALLE_VENTA,
  DELETE_DETALLE_VENTA,
  CREATE_CORRAL_VENTA,
  DELETE_CORRAL_VENTA,
} from '../graphql/ventas'

export const useVentas = () => {
  const { data, loading, error, refetch } = useQuery(GET_NOTAS_VENTA)
  const { data: clientesData, loading: loadingClientes } = useQuery(GET_CLIENTES)
  const { data: animalesData, loading: loadingAnimales, refetch: refetchAnimales } = useQuery(GET_ANIMALES_DISPONIBLES)
  const { data: corralesData, loading: loadingCorrales, refetch: refetchCorrales } = useQuery(GET_CORRALES_VENTA)

  const [createNotaVenta] = useMutation(CREATE_NOTA_VENTA)
  const [updateNotaVenta] = useMutation(UPDATE_NOTA_VENTA)
  const [deleteNotaVenta] = useMutation(DELETE_NOTA_VENTA)
  const [createDetalleVenta] = useMutation(CREATE_DETALLE_VENTA)
  const [deleteDetalleVenta] = useMutation(DELETE_DETALLE_VENTA)
  const [createCorralVenta] = useMutation(CREATE_CORRAL_VENTA)
  const [deleteCorralVenta] = useMutation(DELETE_CORRAL_VENTA)

  // ─── NOTAS DE VENTA ───────────────────────────────────────────────

  const crearNotaVenta = async (input) => {
    try {
      const variables = {
        fincaId: '1',
        clienteId: input.clienteId || null,
        corralId: input.corralId || null,
        modalidadVenta: input.modalidadVenta || 'POR_KILO',
        fechaVenta: input.fechaVenta,
        guiaSalida: input.guiaSalida || null,
        observaciones: input.observaciones || null,
      }
      const result = await createNotaVenta({ variables })
      if (result.data?.crearNotaVenta?.success) {
        return {
          success: true,
          message: result.data.crearNotaVenta.message,
          id: result.data.crearNotaVenta.notaVenta.id,
        }
      }
      return { success: false, message: result.data?.crearNotaVenta?.message || 'Error al crear venta' }
    } catch (err) {
      console.error('Error creando nota de venta:', err)
      return { success: false, message: err.message }
    }
  }

  const actualizarNotaVenta = async (id, input) => {
    try {
      const variables = {
        id,
        clienteId: input.clienteId || null,
        corralId: input.corralId || null,
        modalidadVenta: input.modalidadVenta || null,
        fechaVenta: input.fechaVenta || null,
        guiaSalida: input.guiaSalida || null,
        observaciones: input.observaciones ?? null,
      }
      const result = await updateNotaVenta({ variables })
      if (result.data?.actualizarNotaVenta?.success) {
        return {
          success: true,
          message: result.data.actualizarNotaVenta.message,
          data: result.data.actualizarNotaVenta.notaVenta,
        }
      }
      return { success: false, message: result.data?.actualizarNotaVenta?.message || 'Error al actualizar' }
    } catch (err) {
      console.error('Error actualizando nota de venta:', err)
      return { success: false, message: err.message }
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
    } catch (err) {
      console.error('Error eliminando nota de venta:', err)
      return { success: false, message: err.message }
    }
  }

  // ─── DETALLES DE VENTA ────────────────────────────────────────────

  const crearDetalleVenta = async (input) => {
    try {
      const variables = {
        notaVentaId: input.notaVentaId,
        animalId: input.animalId,
        modalidad: input.modalidad || 'POR_KILO',
        precioKg: parseFloat(input.precioKg || input.precioUnitario || 0),
        pesoVentaKg: parseFloat(input.pesoVentaKg || 0),
        costoEstimado: parseFloat(input.costoEstimado || 0),
      }
      const result = await createDetalleVenta({ variables })
      if (result.data?.crearDetalleVenta?.success) {
        return { success: true, message: result.data.crearDetalleVenta.message }
      }
      return { success: false, message: result.data?.crearDetalleVenta?.message || 'Error al agregar detalle' }
    } catch (err) {
      console.error('Error creando detalle de venta:', err)
      return { success: false, message: err.message }
    }
  }

  const eliminarDetalleVenta = async (id) => {
    try {
      const result = await deleteDetalleVenta({ variables: { id } })
      if (result.data?.eliminarDetalleVenta?.success) {
        return { success: true, message: result.data.eliminarDetalleVenta.message }
      }
      return { success: false, message: result.data?.eliminarDetalleVenta?.message || 'Error al eliminar detalle' }
    } catch (err) {
      console.error('Error eliminando detalle de venta:', err)
      return { success: false, message: err.message }
    }
  }

  // ─── ACTUALIZAR VENTA COMPLETA (reemplaza detalles) ──────────────

  const actualizarVentaCompleta = async (id, formData, nuevosDetalles) => {
    try {
      // 1. Actualizar cabecera
      const resultVenta = await actualizarNotaVenta(id, formData)
      if (!resultVenta.success) return resultVenta

      // 2. Eliminar detalles existentes
      const ventaActual = data?.notasVenta?.find(v => v.id === id)
      if (ventaActual?.detalles?.length) {
        for (const detalle of ventaActual.detalles) {
          await eliminarDetalleVenta(detalle.id)
        }
      }

      // 3. Crear nuevos detalles
      for (const detalle of nuevosDetalles) {
        await crearDetalleVenta({
          notaVentaId: id,
          animalId: detalle.animalId,
          modalidad: detalle.modalidad || 'POR_KILO',
          precioKg: detalle.precioUnitario,
          pesoVentaKg: detalle.pesoVentaKg || 0,
          costoEstimado: detalle.costoEstimado || 0,
        })
      }

      await refetch()
      await refetchAnimales()
      return { success: true, message: 'Venta actualizada exitosamente' }
    } catch (err) {
      console.error('Error actualizando venta completa:', err)
      return { success: false, message: err.message }
    }
  }

  // ─── CORRALES ─────────────────────────────────────────────────────

  const crearCorralVenta = async (input) => {
    try {
      const variables = {
        fincaId: '1',
        nombre: input.nombre,
        descripcion: input.descripcion || null,
        fechaFormacion: input.fechaFormacion,
      }
      const result = await createCorralVenta({ variables })
      if (result.data?.crearCorralVenta?.success) {
        await refetchCorrales()
        return { success: true, message: result.data.crearCorralVenta.message, corral: result.data.crearCorralVenta.corral }
      }
      return { success: false, message: result.data?.crearCorralVenta?.message || 'Error al crear corral' }
    } catch (err) {
      console.error('Error creando corral:', err)
      return { success: false, message: err.message }
    }
  }

  const eliminarCorralVenta = async (id) => {
    try {
      const result = await deleteCorralVenta({ variables: { id } })
      if (result.data?.eliminarCorralVenta?.success) {
        await refetchCorrales()
        return { success: true, message: result.data.eliminarCorralVenta.message }
      }
      return { success: false, message: result.data?.eliminarCorralVenta?.message || 'Error al eliminar corral' }
    } catch (err) {
      console.error('Error eliminando corral:', err)
      return { success: false, message: err.message }
    }
  }

  return {
    // Datos
    notasVenta: data?.notasVenta || [],
    clientes: clientesData?.clientes || [],
    animalesDisponibles: animalesData?.animalesDisponibles || [],
    corralesVenta: corralesData?.corralesVenta || [],

    // Estados
    loading: loading || loadingClientes || loadingAnimales || loadingCorrales,
    error,

    // Notas de venta
    crearNotaVenta,
    actualizarNotaVenta,
    eliminarNotaVenta,
    actualizarVentaCompleta,

    // Detalles
    crearDetalleVenta,
    eliminarDetalleVenta,

    // Corrales
    crearCorralVenta,
    eliminarCorralVenta,

    // Refetch manual
    refetch,
    refetchAnimales,
    refetchCorrales,
  }
}