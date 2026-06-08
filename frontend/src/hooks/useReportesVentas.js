// frontend/src/hooks/useReportesVentas.js
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import {
  GET_ESTADISTICAS_VENTAS,
  GET_PRODUCTOS_MAS_VENDIDOS,
  GET_VENTAS_POR_CLIENTE,
  GET_RESUMEN_VENTAS_POR_PERIODO,
  GET_VENTAS_POR_RANGO,
} from '../graphql/ventas'

export const useReportesVentas = () => {
  // Los hooks van aquí en el nivel superior
  const [filtros, setFiltros] = useState({
    fechaInicio: null,
    fechaFin: null,
    periodo: 'mes',
    limit: 10,
  })

  const { data: statsData, loading: loadingStats, refetch: refetchStats } = useQuery(
    GET_ESTADISTICAS_VENTAS,
    {
      variables: {
        fechaInicio: filtros.fechaInicio || undefined,
        fechaFin: filtros.fechaFin || undefined,
      },
    }
  )

  const { data: productosData, loading: loadingProductos, refetch: refetchProductos } = useQuery(
    GET_PRODUCTOS_MAS_VENDIDOS,
    {
      variables: {
        limit: filtros.limit,
        fechaInicio: filtros.fechaInicio || undefined,
        fechaFin: filtros.fechaFin || undefined,
      },
    }
  )

  const { data: clientesData, loading: loadingClientes, refetch: refetchClientes } = useQuery(
    GET_VENTAS_POR_CLIENTE,
    {
      variables: {
        limit: filtros.limit,
        fechaInicio: filtros.fechaInicio || undefined,
        fechaFin: filtros.fechaFin || undefined,
      },
    }
  )

  const { data: resumenData, loading: loadingResumen, refetch: refetchResumen } = useQuery(
    GET_RESUMEN_VENTAS_POR_PERIODO,
    {
      variables: { periodo: filtros.periodo },
    }
  )

  // Parsear JSON si viene como string
  const parseJSON = (val) => {
    if (!val) return null
    if (typeof val === 'string') {
      try { return JSON.parse(val) } catch { return null }
    }
    return val
  }

  const estadisticas = parseJSON(statsData?.estadisticasVentas)
  const productos = parseJSON(productosData?.productosMasVendidos) || []
  const clientes = parseJSON(clientesData?.ventasPorCliente) || []
  const resumen = parseJSON(resumenData?.resumenVentasPorPeriodo)

  const aplicarFiltros = (nuevasFechas) => {
    setFiltros(prev => ({ ...prev, ...nuevasFechas }))
    setTimeout(() => {
      refetchStats()
      refetchProductos()
      refetchClientes()
      refetchResumen()
    }, 100)
  }

  const limpiarFiltros = () => {
    setFiltros({ fechaInicio: null, fechaFin: null, periodo: 'mes', limit: 10 })
    setTimeout(() => {
      refetchStats()
      refetchProductos()
      refetchClientes()
      refetchResumen()
    }, 100)
  }

  // Mantener compatibilidad con la API anterior del hook
  // (ReportesVentas.jsx llama getEstadisticas(), getProductosMasVendidos(), getVentasPorCliente())
  const getEstadisticas = () => ({
    estadisticas,
    loading: loadingStats,
    refetch: refetchStats,
  })

  const getProductosMasVendidos = () => ({
    productos,
    loading: loadingProductos,
    refetch: refetchProductos,
  })

  const getVentasPorCliente = () => ({
    clientes,
    loading: loadingClientes,
    refetch: refetchClientes,
  })

  const getResumenPorPeriodo = () => ({
    resumen,
    loading: loadingResumen,
    refetch: refetchResumen,
  })

  return {
    // API de compatibilidad (usada por ReportesVentas.jsx)
    getEstadisticas,
    getProductosMasVendidos,
    getVentasPorCliente,
    getResumenPorPeriodo,

    // Datos directos
    estadisticas,
    productos,
    clientes,
    resumen,

    // Estados
    loading: loadingStats || loadingProductos || loadingClientes,
    filtros,

    // Acciones
    aplicarFiltros,
    limpiarFiltros,
  }
}