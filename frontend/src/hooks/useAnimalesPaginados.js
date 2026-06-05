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

  // Filtros nuevos
  const [sexo, setSexo] = useState('')
  const [tipoProduccion, setTipoProduccion] = useState('')
  const [origen, setOrigen] = useState('')
  const [pesoMin, setPesoMin] = useState(null)
  const [pesoMax, setPesoMax] = useState(null)
  const [fechaNacimientoDesde, setFechaNacimientoDesde] = useState(null)
  const [fechaNacimientoHasta, setFechaNacimientoHasta] = useState(null)
  const [fechaIngresoDesde, setFechaIngresoDesde] = useState(null)
  const [fechaIngresoHasta, setFechaIngresoHasta] = useState(null)
  const [fechaRegistroDesde, setFechaRegistroDesde] = useState(null)
  const [fechaRegistroHasta, setFechaRegistroHasta] = useState(null)

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
      sexo: sexo || undefined,
      tipoProduccion: tipoProduccion || undefined,
      origen: origen || undefined,
      pesoMin: pesoMin ?? undefined,
      pesoMax: pesoMax ?? undefined,
      fechaNacimientoDesde: fechaNacimientoDesde || undefined,
      fechaNacimientoHasta: fechaNacimientoHasta || undefined,
      fechaIngresoDesde: fechaIngresoDesde || undefined,
      fechaIngresoHasta: fechaIngresoHasta || undefined,
      fechaRegistroDesde: fechaRegistroDesde || undefined,
      fechaRegistroHasta: fechaRegistroHasta || undefined,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  })

  const resultado = data?.animalesPaginados

  const irAPagina = useCallback((nuevaPagina) => { setPagina(nuevaPagina) }, [])

  const cambiarBusqueda = useCallback((texto) => { setBuscar(texto); setPagina(1) }, [])
  const cambiarEstado = useCallback((v) => { setEstado(v); setPagina(1) }, [])
  const cambiarOrden = useCallback((v) => { setOrdenar(v); setPagina(1) }, [])
  const cambiarPorPagina = useCallback((v) => { setPorPagina(v); setPagina(1) }, [])

  const cambiarSexo = useCallback((v) => { setSexo(v); setPagina(1) }, [])
  const cambiarTipoProduccion = useCallback((v) => { setTipoProduccion(v); setPagina(1) }, [])
  const cambiarOrigen = useCallback((v) => { setOrigen(v); setPagina(1) }, [])
  const cambiarPesoMin = useCallback((v) => { setPesoMin(v); setPagina(1) }, [])
  const cambiarPesoMax = useCallback((v) => { setPesoMax(v); setPagina(1) }, [])

  const cambiarFechaNacimientoDesde = useCallback((v) => { setFechaNacimientoDesde(v); setPagina(1) }, [])
  const cambiarFechaNacimientoHasta = useCallback((v) => { setFechaNacimientoHasta(v); setPagina(1) }, [])
  const cambiarFechaIngresoDesde = useCallback((v) => { setFechaIngresoDesde(v); setPagina(1) }, [])
  const cambiarFechaIngresoHasta = useCallback((v) => { setFechaIngresoHasta(v); setPagina(1) }, [])
  const cambiarFechaRegistroDesde = useCallback((v) => { setFechaRegistroDesde(v); setPagina(1) }, [])
  const cambiarFechaRegistroHasta = useCallback((v) => { setFechaRegistroHasta(v); setPagina(1) }, [])

  const limpiarFiltros = useCallback(() => {
    setBuscar('')
    setEstado('')
    setOrdenar('recientes')
    setRazaId(null)
    setCategoriaId(null)
    setSexo('')
    setTipoProduccion('')
    setOrigen('')
    setPesoMin(null)
    setPesoMax(null)
    setFechaNacimientoDesde(null)
    setFechaNacimientoHasta(null)
    setFechaIngresoDesde(null)
    setFechaIngresoHasta(null)
    setFechaRegistroDesde(null)
    setFechaRegistroHasta(null)
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
    // estado de filtros
    buscar,
    estado,
    ordenar,
    porPagina,
    sexo,
    tipoProduccion,
    origen,
    pesoMin,
    pesoMax,
    fechaNacimientoDesde,
    fechaNacimientoHasta,
    fechaIngresoDesde,
    fechaIngresoHasta,
    fechaRegistroDesde,
    fechaRegistroHasta,
    // acciones
    irAPagina,
    cambiarBusqueda,
    cambiarEstado,
    cambiarOrden,
    cambiarPorPagina,
    cambiarSexo,
    cambiarTipoProduccion,
    cambiarOrigen,
    cambiarPesoMin,
    cambiarPesoMax,
    cambiarFechaNacimientoDesde,
    cambiarFechaNacimientoHasta,
    cambiarFechaIngresoDesde,
    cambiarFechaIngresoHasta,
    cambiarFechaRegistroDesde,
    cambiarFechaRegistroHasta,
    limpiarFiltros,
    refetch,
  }
}
