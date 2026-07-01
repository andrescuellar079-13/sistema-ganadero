// frontend/src/graphql/dashboard.js
import { gql } from '@apollo/client'

export const GET_STATS = gql`
  query GetStats($fincaId: ID!) {
    totalAnimales: allAnimales {
      id
    }
    totalVacunas: allVacunas {
      id
    }
    totalVacunaciones: vacunaciones(fincaId: $fincaId) {
      id
    }
    animalesActivos: animalesActivos(fincaId: $fincaId) {
      id
    }
  }
`

export const GET_PROXIMAS_VACUNACIONES = gql`
  query GetProximasVacunaciones($dias: Int) {
    vacunasProximas(dias: $dias) {
      id
      fechaAplicacion
      fechaProxima
      animal {
        id
        nroArete
        nombre
      }
      vacuna {
        id
        nombre
      }
    }
  }
`

export const GET_VACUNACIONES_POR_MES = gql`
  query GetVacunacionesPorMes($fincaId: ID!) {
    vacunaciones(fincaId: $fincaId) {
      id
      fechaAplicacion
    }
  }
`

export const GET_ANIMALES_POR_CATEGORIA = gql`
  query GetAnimalesPorCategoria {
    allAnimales {
      id
      categoria {
        id
        nombre
      }
    }
  }
`

export const GET_ANIMALES_POR_SEXO = gql`
  query GetAnimalesPorSexo {
    allAnimales {
      id
      sexo
    }
  }
`

export const GET_VACUNAS_POR_TIPO = gql`
  query GetVacunasPorTipo {
    allVacunas {
      id
      viaAplicacion
    }
  }
`

export const GET_VENTAS_POR_MES = gql`
  query GetVentasPorMes($fincaId: ID!) {
    ventasPorAnio(anio: ${new Date().getFullYear()}) {
      id
      montoTotal
      fechaVenta
    }
  }
`

export const GET_PRODUCCION_POR_MES = gql`
  query GetProduccionPorMes($fincaId: ID!) {
    produccionesLeche(fincaId: $fincaId) {
      id
      litros
      fecha
    }
  }
`

// ============================================================================
// QUERY CONSOLIDADA DEL CENTRO DE CONTROL OPERATIVO
// Reutiliza EXCLUSIVAMENTE resolvers de resumen ya existentes en cada módulo
// (fuente única de la verdad, sin duplicar cálculos en el frontend):
//   - reporteAnimalesGrupal  (animales)   -> inventario por estado/categoría
//   - resumenProduccion      (produccion) -> leche, engorde, sin pesaje
//   - resumenSanidad         (sanidad)    -> tratamientos, retiros, vencidos
//   - resumenAlertas         (alertas)    -> pendientes, críticas, vencidas
//   - proximosPartos / vacasPrenadas (reproduccion)
//   - ventasPorAnio / gastosPorAnio / produccionesLeche (finanzas + gráficos)
// ============================================================================
export const GET_DASHBOARD = gql`
  query GetDashboard($fincaId: ID!, $anio: Int!) {
    resumenAnimales: reporteAnimalesGrupal(fincaId: $fincaId) {
      total
      machos
      hembras
      activos
      vendidos
      muertos
      baja
      porCategoria {
        id
        nombre
        total
      }
    }
    resumenProduccion(fincaId: $fincaId) {
      produccionLecheHoy
      promedioLitrosVaca
      lactanciasActivas
      animalesEngorde
      gananciaDiariaPromedio
      animalesSinPesaje
      animalesListosVenta
    }
    resumenSanidad(fincaId: $fincaId) {
      tratamientosActivos
      vacunasProximas
      vacunasVencidas
      desparasitacionesProximas
      desparasitacionesVencidas
      mastitisActivas
      examenesPendientes
      animalesEnRetiro
    }
    resumenAlertas(fincaId: $fincaId) {
      pendientes
      criticas
      vencidas
      resueltas
    }
    proximosPartos(dias: 30, fincaId: $fincaId) {
      id
    }
    vacasPrenadas(fincaId: $fincaId) {
      id
    }
    ventasPorAnio(anio: $anio) {
      id
      montoTotal
      fechaVenta
    }
    gastos(fincaId: $fincaId) {
      id
      total
      fecha
    }
    produccionesLeche(fincaId: $fincaId) {
      id
      litros
      fecha
    }
    alertas(fincaId: $fincaId) {
      id
      tipo
      prioridad
    }
  }
`

// NUEVA QUERY DASHBOARD COMPLETO CON LOS NUEVOS KPIS
export const GET_DASHBOARD_COMPLETO = gql`
  query GetDashboardCompleto($fincaId: ID!, $anio: Int!) {
    allAnimales {
      id
      sexo
      categoria {
        id
        nombre
      }
    }
    proximosPartos(dias: 30, fincaId: $fincaId) {
      id
    }
    ventasPorAnio(anio: $anio) {
      id
      montoTotal
      fechaVenta
    }
    produccionesLeche(fincaId: $fincaId) {
      id
      litros
      fecha
    }
    comprasPorAnio(anio: $anio) {
      id
      montoTotal
      fechaCompra
    }
  }
`