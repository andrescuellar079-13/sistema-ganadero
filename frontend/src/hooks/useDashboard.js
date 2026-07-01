// frontend/src/hooks/useDashboard.js
import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { GET_DASHBOARD } from '../graphql/dashboard'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const num = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return isNaN(n) ? 0 : n
}

/**
 * Centro de control operativo del Dashboard.
 * Orquesta los resolvers de resumen ya existentes en cada módulo (sin recalcular
 * nada en el frontend) y expone el resultado agrupado en secciones + datos de
 * gráficos. El filtro temporal (ANIO/MES/PERSONALIZADO) solo afecta los KPIs
 * financieros acumulados; los contadores operativos son en tiempo real.
 */
export const useDashboard = (fincaId, filtroParams = {}) => {
  const anioActual = new Date().getFullYear()
  const { tipoFiltro = 'ANIO', fechaInicio = '', fechaFin = '' } = filtroParams

  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD, {
    variables: { fincaId, anio: anioActual },
    skip: !fincaId,
    fetchPolicy: 'cache-and-network',
  })

  const cumpleFiltroFecha = (fechaStr) => {
    if (!fechaStr) return false
    const fecha = new Date(fechaStr)
    const hoy = new Date()
    if (tipoFiltro === 'MES') {
      return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
    }
    if (tipoFiltro === 'PERSONALIZADO') {
      if (!fechaInicio || !fechaFin) return true
      return fecha >= new Date(fechaInicio + 'T00:00:00') && fecha <= new Date(fechaFin + 'T23:59:59')
    }
    return fecha.getFullYear() === anioActual
  }

  const resultado = useMemo(() => {
    // Series mensuales base para los gráficos (Ene..Dic fijos)
    const datosMensuales = MESES.map((name) => ({ name, ventas: 0, gastos: 0, leche: 0 }))

    const secciones = {
      animales: null,
      produccion: null,
      sanidad: null,
      reproduccion: null,
      alertas: null,
    }
    const finanzas = { ventasPeriodo: 0, gastosPeriodo: 0, balancePeriodo: 0, lecheHoy: 0, lecheMes: 0 }
    let distribucionCategoria = []
    let alertasPorTipo = []

    if (!data) {
      return { datosMensuales, secciones, finanzas, distribucionCategoria, alertasPorTipo }
    }

    // --- Animales (reporteAnimalesGrupal) ---
    const rA = data.resumenAnimales
    if (rA) {
      secciones.animales = {
        total: rA.total ?? 0,
        activos: rA.activos ?? 0,
        vendidos: rA.vendidos ?? 0,
        bajas: (rA.muertos ?? 0) + (rA.baja ?? 0),
        machos: rA.machos ?? 0,
        hembras: rA.hembras ?? 0,
      }
      distribucionCategoria = (rA.porCategoria || [])
        .map((c) => ({ name: c.nombre || 'Sin categoría', value: c.total ?? 0 }))
        .filter((c) => c.value > 0)
        .sort((a, b) => b.value - a.value)
    }

    // --- Producción (resumenProduccion) ---
    const rP = data.resumenProduccion
    if (rP) {
      secciones.produccion = {
        lecheHoy: num(rP.produccionLecheHoy),
        promedioLitrosVaca: num(rP.promedioLitrosVaca),
        lactanciasActivas: rP.lactanciasActivas ?? 0,
        animalesEngorde: rP.animalesEngorde ?? 0,
        gananciaDiariaPromedio: num(rP.gananciaDiariaPromedio),
        animalesSinPesaje: rP.animalesSinPesaje ?? 0,
        animalesListosVenta: rP.animalesListosVenta ?? 0,
      }
      finanzas.lecheHoy = num(rP.produccionLecheHoy)
    }

    // --- Sanidad (resumenSanidad) ---
    const rS = data.resumenSanidad
    if (rS) {
      secciones.sanidad = {
        tratamientosActivos: rS.tratamientosActivos ?? 0,
        animalesEnRetiro: rS.animalesEnRetiro ?? 0,
        vacunasVencidas: rS.vacunasVencidas ?? 0,
        vacunasProximas: rS.vacunasProximas ?? 0,
        desparasitacionesVencidas: rS.desparasitacionesVencidas ?? 0,
        desparasitacionesProximas: rS.desparasitacionesProximas ?? 0,
        mastitisActivas: rS.mastitisActivas ?? 0,
        examenesPendientes: rS.examenesPendientes ?? 0,
      }
    }

    // --- Reproducción (proximosPartos + vacasPrenadas) ---
    secciones.reproduccion = {
      proximosPartos: data.proximosPartos?.length ?? 0,
      vacasPrenadas: data.vacasPrenadas?.length ?? 0,
    }

    // --- Alertas (resumenAlertas) ---
    const rAl = data.resumenAlertas
    if (rAl) {
      secciones.alertas = {
        pendientes: rAl.pendientes ?? 0,
        criticas: rAl.criticas ?? 0,
        vencidas: rAl.vencidas ?? 0,
        resueltas: rAl.resueltas ?? 0,
      }
    }

    // --- Series financieras + producción para gráficos y KPIs de período ---
    const mesActual = new Date().getMonth()

    // Solo se acumulan en las series mensuales los registros del año actual
    // (ventas/gastos/leche pueden traer varios años; el gráfico es anual).
    const esAnioActual = (fechaStr) => new Date(fechaStr).getFullYear() === anioActual

    data.ventasPorAnio?.forEach((v) => {
      const monto = num(v.montoTotal)
      if (!v.fechaVenta) return
      const mesIdx = new Date(v.fechaVenta).getMonth()
      if (esAnioActual(v.fechaVenta) && mesIdx >= 0 && mesIdx < 12) datosMensuales[mesIdx].ventas += monto
      if (cumpleFiltroFecha(v.fechaVenta)) finanzas.ventasPeriodo += monto
    })

    data.gastos?.forEach((g) => {
      const monto = num(g.total)
      if (!g.fecha) return
      const mesIdx = new Date(g.fecha).getMonth()
      if (esAnioActual(g.fecha) && mesIdx >= 0 && mesIdx < 12) datosMensuales[mesIdx].gastos += monto
      if (cumpleFiltroFecha(g.fecha)) finanzas.gastosPeriodo += monto
    })

    data.produccionesLeche?.forEach((p) => {
      const litros = num(p.litros)
      if (!p.fecha) return
      const mesIdx = new Date(p.fecha).getMonth()
      if (esAnioActual(p.fecha) && mesIdx >= 0 && mesIdx < 12) datosMensuales[mesIdx].leche += litros
    })

    finanzas.lecheMes = datosMensuales[mesActual]?.leche ?? 0
    finanzas.balancePeriodo = finanzas.ventasPeriodo - finanzas.gastosPeriodo

    // --- Alertas por tipo (agrupado en cliente desde la lista real) ---
    const conteoTipo = {}
    data.alertas?.forEach((a) => {
      const tipo = a.tipo || 'OTRO'
      conteoTipo[tipo] = (conteoTipo[tipo] || 0) + 1
    })
    alertasPorTipo = Object.entries(conteoTipo)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    return { datosMensuales, secciones, finanzas, distribucionCategoria, alertasPorTipo }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, tipoFiltro, fechaInicio, fechaFin])

  return { loading, error, refetch, ...resultado }
}
