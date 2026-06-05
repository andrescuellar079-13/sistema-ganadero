// frontend/src/hooks/useReportesVentas.js
import { useQuery } from '@apollo/client'
import {
  GET_VENTAS_POR_RANGO,
  GET_RESUMEN_VENTAS_POR_PERIODO,
  GET_PRODUCTOS_MAS_VENDIDOS,
  GET_VENTAS_POR_CLIENTE,
  GET_ESTADISTICAS_VENTAS,
} from '../graphql/ventas'

export const useReportesVentas = () => {
  const getVentasPorRango = (fechaInicio, fechaFin) => {
    const { data, loading, error, refetch } = useQuery(GET_VENTAS_POR_RANGO, {
      variables: { fechaInicio, fechaFin },
      skip: !fechaInicio || !fechaFin,
    })
    return {
      ventas: data?.ventasPorRango || [],
      loading,
      error,
      refetch,
    }
  }

  const getResumenPorPeriodo = (periodo) => {
    const { data, loading, error, refetch } = useQuery(GET_RESUMEN_VENTAS_POR_PERIODO, {
      variables: { periodo },
    })
    return {
      resumen: data?.resumenVentasPorPeriodo || null,
      loading,
      error,
      refetch,
    }
  }

  const getProductosMasVendidos = (limit = 10, fechaInicio = null, fechaFin = null) => {
    const variables = { limit }
    if (fechaInicio && fechaFin) {
      variables.fechaInicio = fechaInicio
      variables.fechaFin = fechaFin
    }
    const { data, loading, error, refetch } = useQuery(GET_PRODUCTOS_MAS_VENDIDOS, {
      variables,
    })
    return {
      productos: data?.productosMasVendidos || [],
      loading,
      error,
      refetch,
    }
  }

  const getVentasPorCliente = (limit = 10, fechaInicio = null, fechaFin = null) => {
    const variables = { limit }
    if (fechaInicio && fechaFin) {
      variables.fechaInicio = fechaInicio
      variables.fechaFin = fechaFin
    }
    const { data, loading, error, refetch } = useQuery(GET_VENTAS_POR_CLIENTE, {
      variables,
    })
    return {
      clientes: data?.ventasPorCliente || [],
      loading,
      error,
      refetch,
    }
  }

  const getEstadisticas = (fechaInicio = null, fechaFin = null) => {
    const variables = {}
    if (fechaInicio && fechaFin) {
      variables.fechaInicio = fechaInicio
      variables.fechaFin = fechaFin
    }
    const { data, loading, error, refetch } = useQuery(GET_ESTADISTICAS_VENTAS, {
      variables,
    })
    return {
      estadisticas: data?.estadisticasVentas || null,
      loading,
      error,
      refetch,
    }
  }

  return {
    getVentasPorRango,
    getResumenPorPeriodo,
    getProductosMasVendidos,
    getVentasPorCliente,
    getEstadisticas,
  }
}