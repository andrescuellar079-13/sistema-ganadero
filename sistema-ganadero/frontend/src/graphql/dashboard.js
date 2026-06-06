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