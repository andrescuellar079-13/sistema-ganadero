// frontend/src/hooks/useFiltrosVentas.js
import { useState, useMemo } from 'react'

export const useFiltrosVentas = (ventas) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('mas_reciente')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [filterFechaInicio, setFilterFechaInicio] = useState(null)
  const [filterFechaFin, setFilterFechaFin] = useState(null)

  const filtrarVentas = useMemo(() => {
    let resultado = [...ventas]

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      resultado = resultado.filter(v => {
        const clienteNombre = `${v.cliente?.nombre || ''} ${v.cliente?.apellidos || ''}`.toLowerCase()
        const clienteCi = (v.cliente?.ci || '').toLowerCase()
        const id = v.id?.toLowerCase() || ''
        return clienteNombre.includes(term) || clienteCi.includes(term) || id.includes(term)
      })
    }

    // Filtro por estado
    if (filterEstado !== 'todos') {
      resultado = resultado.filter(v => v.estado === filterEstado)
    }

    // Filtro por fechas
    if (filterFechaInicio) {
      resultado = resultado.filter(v => new Date(v.fechaVenta) >= new Date(filterFechaInicio))
    }
    if (filterFechaFin) {
      resultado = resultado.filter(v => new Date(v.fechaVenta) <= new Date(filterFechaFin))
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      switch (sortBy) {
        case 'mas_reciente':
          return new Date(b.fechaVenta) - new Date(a.fechaVenta)
        case 'mas_antiguo':
          return new Date(a.fechaVenta) - new Date(b.fechaVenta)
        case 'cliente_asc':
          return (a.cliente?.nombre || '').localeCompare(b.cliente?.nombre || '')
        case 'cliente_desc':
          return (b.cliente?.nombre || '').localeCompare(a.cliente?.nombre || '')
        case 'monto_mayor':
          return (b.montoTotal || 0) - (a.montoTotal || 0)
        case 'monto_menor':
          return (a.montoTotal || 0) - (b.montoTotal || 0)
        default:
          return 0
      }
    })

    return resultado
  }, [ventas, searchTerm, sortBy, filterEstado, filterFechaInicio, filterFechaFin])

  return {
    ventasFiltradas: filtrarVentas,
    totalFiltrados: filtrarVentas.length,
    totalOriginal: ventas.length,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filterEstado,
    setFilterEstado,
    filterFechaInicio,
    setFilterFechaInicio,
    filterFechaFin,
    setFilterFechaFin,
    limpiarFiltros: () => {
      setSearchTerm('')
      setFilterEstado('todos')
      setFilterFechaInicio(null)
      setFilterFechaFin(null)
    }
  }
}