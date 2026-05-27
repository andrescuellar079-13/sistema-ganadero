import { useState, useCallback } from 'react'
import { useQuery } from '@apollo/client'
import { GET_PARCELAS_PAGINADAS } from '../graphql/parcelas'

const DEFAULT_PAGE_SIZE = 10

export const useParcelasPaginadas = (fincaId) => {
  const [pagina, setPagina] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)
  const [buscar, setBuscar] = useState('')
  const [estado, setEstado] = useState('')
  const [temporal, setTemporal] = useState('')
  const [ordering, setOrdering] = useState('')

  const { data, loading, error, refetch } = useQuery(GET_PARCELAS_PAGINADAS, {
    variables: {
      fincaId,
      page: pagina,
      pageSize,
      search: buscar || undefined,
      estado: estado || undefined,
      temporal: temporal || undefined,
      ordering: ordering || undefined,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    skip: !fincaId,
  })

  const resultado = data?.parcelasPaginadas

  const irAPagina = useCallback((nueva) => setPagina(nueva), [])

  const cambiarBusqueda = useCallback((texto) => {
    setBuscar(texto)
    setPagina(1)
  }, [])

  const cambiarEstado = useCallback((val) => {
    setEstado(val)
    setPagina(1)
  }, [])

  const cambiarTemporal = useCallback((val) => {
    setTemporal(val)
    setPagina(1)
  }, [])

  const cambiarOrdering = useCallback((val) => {
    setOrdering(val)
    setPagina(1)
  }, [])

  const limpiarFiltros = useCallback(() => {
    setBuscar('')
    setEstado('')
    setTemporal('')
    setOrdering('')
    setPagina(1)
  }, [])

  return {
    parcelas: resultado?.results || [],
    count: resultado?.count || 0,
    page: resultado?.page || 1,
    totalPages: resultado?.totalPages || 1,
    hasNext: resultado?.hasNext || false,
    hasPrevious: resultado?.hasPrevious || false,
    loading,
    error,
    buscar,
    estado,
    temporal,
    ordering,
    pageSize,
    irAPagina,
    cambiarBusqueda,
    cambiarEstado,
    cambiarTemporal,
    cambiarOrdering,
    limpiarFiltros,
    refetch,
  }
}
