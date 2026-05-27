// frontend/src/hooks/useDashboard.js
import { useQuery } from '@apollo/client'
import {
  GET_STATS,
  GET_PROXIMAS_VACUNACIONES,
  GET_VACUNACIONES_POR_MES,
  GET_ANIMALES_POR_CATEGORIA,
  GET_ANIMALES_POR_SEXO,
  GET_VACUNAS_POR_TIPO,
  GET_VENTAS_POR_MES,
  GET_PRODUCCION_POR_MES,
} from '../graphql/dashboard'

export const useDashboard = () => {
  const fincaId = localStorage.getItem('fincaId') || '1'

  const { data: stats, loading: loadingStats, error: statsError, refetch: refetchStats } = useQuery(GET_STATS, {
    variables: { fincaId }
  })

  const { data: proximasVacunaciones, loading: loadingProximas } = useQuery(GET_PROXIMAS_VACUNACIONES, {
    variables: { dias: 30 }
  })

  const { data: vacunacionesPorMes, loading: loadingVacunacionesMes } = useQuery(GET_VACUNACIONES_POR_MES, {
    variables: { fincaId }
  })

  const { data: animalesPorCategoria, loading: loadingAnimalesCategoria } = useQuery(GET_ANIMALES_POR_CATEGORIA)

  const { data: animalesPorSexo, loading: loadingAnimalesSexo } = useQuery(GET_ANIMALES_POR_SEXO)

  const { data: vacunasPorTipo, loading: loadingVacunasTipo } = useQuery(GET_VACUNAS_POR_TIPO)

  const { data: ventasPorMes, loading: loadingVentas } = useQuery(GET_VENTAS_POR_MES, {
    variables: { fincaId }
  })

  const { data: produccionPorMes, loading: loadingProduccion } = useQuery(GET_PRODUCCION_POR_MES, {
    variables: { fincaId }
  })

  // Estadísticas generales
  const totalAnimales = stats?.totalAnimales?.length || 0
  const totalVacunas = stats?.totalVacunas?.length || 0
  const totalVacunaciones = stats?.totalVacunaciones?.length || 0
  const animalesActivos = stats?.animalesActivos?.length || 0

  // Vacunaciones por mes (últimos 6 meses)
  const vacunacionesPorMesData = () => {
    if (!vacunacionesPorMes?.vacunaciones) return { labels: [], values: [] }
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const counts = new Array(12).fill(0)
    vacunacionesPorMes.vacunaciones.forEach(v => {
      const mes = new Date(v.fechaAplicacion).getMonth()
      if (mes >= 0) counts[mes]++
    })
    // Solo últimos 6 meses
    const hoy = new Date()
    const mesActual = hoy.getMonth()
    const labels = []
    const values = []
    for (let i = 5; i >= 0; i--) {
      let mes = mesActual - i
      if (mes < 0) mes += 12
      labels.push(meses[mes])
      values.push(counts[mes])
    }
    return { labels, values }
  }

  // Animales por categoría
  const animalesPorCategoriaData = () => {
    if (!animalesPorCategoria?.allAnimales) return { labels: [], values: [] }
    const categorias = {}
    animalesPorCategoria.allAnimales.forEach(a => {
      const nombre = a.categoria?.nombre || 'Sin categoría'
      categorias[nombre] = (categorias[nombre] || 0) + 1
    })
    return {
      labels: Object.keys(categorias),
      values: Object.values(categorias)
    }
  }

  // Animales por sexo
  const animalesPorSexoData = () => {
    if (!animalesPorSexo?.allAnimales) return { machos: 0, hembras: 0 }
    let machos = 0, hembras = 0
    animalesPorSexo.allAnimales.forEach(a => {
      if (a.sexo === 'MACHO') machos++
      else if (a.sexo === 'HEMBRA') hembras++
    })
    return { labels: ['Machos', 'Hembras'], values: [machos, hembras] }
  }

  // Vacunas por tipo (vía de aplicación)
  const vacunasPorTipoData = () => {
    if (!vacunasPorTipo?.allVacunas) return { labels: [], values: [] }
    const tipos = {}
    vacunasPorTipo.allVacunas.forEach(v => {
      const via = v.viaAplicacion || 'No especificada'
      tipos[via] = (tipos[via] || 0) + 1
    })
    return {
      labels: Object.keys(tipos),
      values: Object.values(tipos)
    }
  }

  // Ventas por mes (últimos 6 meses)
  const ventasPorMesData = () => {
    if (!ventasPorMes?.ventasPorAnio) return { labels: [], values: [] }
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const totales = new Array(12).fill(0)
    ventasPorMes.ventasPorAnio.forEach(v => {
      const mes = new Date(v.fechaVenta).getMonth()
      if (mes >= 0) totales[mes] += v.montoTotal || 0
    })
    const hoy = new Date()
    const mesActual = hoy.getMonth()
    const labels = []
    const values = []
    for (let i = 5; i >= 0; i--) {
      let mes = mesActual - i
      if (mes < 0) mes += 12
      labels.push(meses[mes])
      values.push(totales[mes])
    }
    return { labels, values }
  }

  // Producción por mes (últimos 6 meses)
  const produccionPorMesData = () => {
    if (!produccionPorMes?.produccionesLeche) return { labels: [], values: [] }
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const totales = new Array(12).fill(0)
    produccionPorMes.produccionesLeche.forEach(p => {
      const mes = new Date(p.fecha).getMonth()
      if (mes >= 0) totales[mes] += p.litros || 0
    })
    const hoy = new Date()
    const mesActual = hoy.getMonth()
    const labels = []
    const values = []
    for (let i = 5; i >= 0; i--) {
      let mes = mesActual - i
      if (mes < 0) mes += 12
      labels.push(meses[mes])
      values.push(totales[mes])
    }
    return { labels, values }
  }

  return {
    // Datos crudos
    proximasVacunaciones: proximasVacunaciones?.vacunasProximas || [],
    
    // Estadísticas
    totalAnimales,
    totalVacunas,
    totalVacunaciones,
    animalesActivos,
    
    // Datos para gráficos
    vacunacionesPorMes: vacunacionesPorMesData(),
    animalesPorCategoria: animalesPorCategoriaData(),
    animalesPorSexo: animalesPorSexoData(),
    vacunasPorTipo: vacunasPorTipoData(),
    ventasPorMes: ventasPorMesData(),
    produccionPorMes: produccionPorMesData(),
    
    // Loading
    loading: loadingStats || loadingProximas || loadingVacunacionesMes || loadingAnimalesCategoria || loadingAnimalesSexo || loadingVacunasTipo || loadingVentas || loadingProduccion,
    
    error: statsError,
    refetchStats,
  }
}