import { useState, useCallback } from 'react'
import { useQuery } from '@apollo/client'
import { GET_ANIMALES_PAGINADOS } from '../graphql/animales'

const DEFAULT_PAGE_SIZE = 10

export const useAnimalesPaginados = (fincaId) => {
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(DEFAULT_PAGE_SIZE)
  const [buscar, setBuscar] = useState('')
  const [estado, setEstado] = useState('')
  const [ordenar, setOrdenar] = useState('recientes')
  const [razaId, setRazaId] = useState(null)
  const [categoriaId, setCategoriaId] = useState(null)

  const { data, loading, error, refetch } = useQuery(GET_ANIMALES_PAGINADOS, {
    variables: {
      fincaId: fincaId || undefined,
      pagina,
      porPagina,
      buscar: buscar || undefined,
      estado: estado || undefined,
      ordenar: ordenar || undefined,
      razaId: razaId || undefined,
      categoriaId: categoriaId || undefined,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  })

  const resultado = data?.animalesPaginados

  const irAPagina = useCallback((nuevaPagina) => {
    setPagina(nuevaPagina)
  }, [])

  const cambiarBusqueda = useCallback((texto) => {
    setBuscar(texto)
    setPagina(1)
  }, [])

  const cambiarEstado = useCallback((nuevoEstado) => {
    setEstado(nuevoEstado)
    setPagina(1)
  }, [])

  const cambiarOrden = useCallback((nuevoOrden) => {
    setOrdenar(nuevoOrden)
    setPagina(1)
  }, [])

  const cambiarPorPagina = useCallback((cantidad) => {
    setPorPagina(cantidad)
    setPagina(1)
  }, [])

  const limpiarFiltros = useCallback(() => {
    setBuscar('')
    setEstado('')
    setOrdenar('recientes')
    setRazaId(null)
    setCategoriaId(null)
    setPagina(1)
  }, [])

  return {
    animales: resultado?.animales || [],
    total: resultado?.total || 0,
    paginas: resultado?.paginas || 1,
    paginaActual: resultado?.paginaActual || 1,
    tieneSiguiente: resultado?.tieneSiguiente || false,
    tieneAnterior: resultado?.tieneAnterior || false,
    loading,
    error,
    // estado de filtros (para los controles)
    buscar,
    estado,
    ordenar,
    porPagina,
    // acciones
    irAPagina,
    cambiarBusqueda,
    cambiarEstado,
    cambiarOrden,
    cambiarPorPagina,
    limpiarFiltros,
    refetch,
  }
}
