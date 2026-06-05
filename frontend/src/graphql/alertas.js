// frontend/src/graphql/alertas.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_ALERTAS = gql`
  query GetAlertas($fincaId: ID!) {
    alertas(fincaId: $fincaId) {
      id
      tipo
      mensaje
      fechaAlerta
      diasRestantes
      leida
      animal {
        id
        nroArete
        nombre
      }
    }
  }
`

export const GET_ALERTAS_PENDIENTES = gql`
  query GetAlertasPendientes($fincaId: ID!) {
    alertasPendientes(fincaId: $fincaId) {
      id
      tipo
      mensaje
      fechaAlerta
      diasRestantes
      animal {
        id
        nroArete
        nombre
      }
    }
  }
`

export const GET_GASTOS = gql`
  query GetGastos($fincaId: ID!, $animalId: ID) {
    gastos(fincaId: $fincaId, animalId: $animalId) {
      id
      tipoGasto
      descripcion
      cantidad
      precioUnitario
      total
      fecha
      animal {
        id
        nroArete
        nombre
      }
    }
  }
`

export const GET_GASTOS_POR_ANIO = gql`
  query GetGastosPorAnio($fincaId: ID!, $anio: Int!) {
    gastosPorAnio(fincaId: $fincaId, anio: $anio) {
      id
      tipoGasto
      descripcion
      cantidad
      precioUnitario
      total
      fecha
      animal {
        id
        nroArete
        nombre
      }
    }
  }
`

export const GET_TOTAL_GASTOS = gql`
  query GetTotalGastos($fincaId: ID!, $anio: Int) {
    totalGastos(fincaId: $fincaId, anio: $anio)
  }
`

// ==========================================
// MUTATIONS - GASTOS
// ==========================================

export const CREATE_GASTO = gql`
  mutation CrearGasto(
    $fincaId: ID!
    $fecha: Date!
    $tipoGasto: String!
    $descripcion: String!
    $cantidad: Float!
    $precioUnitario: Float!
    $animalId: ID
  ) {
    crearGasto(
      fincaId: $fincaId
      fecha: $fecha
      tipoGasto: $tipoGasto
      descripcion: $descripcion
      cantidad: $cantidad
      precioUnitario: $precioUnitario
      animalId: $animalId
    ) {
      gasto {
        id
        descripcion
        total
      }
      success
      message
    }
  }
`

export const UPDATE_GASTO = gql`
  mutation ActualizarGasto(
    $id: ID!
    $fecha: Date
    $tipoGasto: String
    $descripcion: String
    $cantidad: Float
    $precioUnitario: Float
    $animalId: ID
  ) {
    actualizarGasto(
      id: $id
      fecha: $fecha
      tipoGasto: $tipoGasto
      descripcion: $descripcion
      cantidad: $cantidad
      precioUnitario: $precioUnitario
      animalId: $animalId
    ) {
      gasto {
        id
        fecha
        tipoGasto
        descripcion
        cantidad
        precioUnitario
        total
        animal {
          id
          nroArete
          nombre
        }
      }
      success
      message
    }
  }
`

export const DELETE_GASTO = gql`
  mutation EliminarGasto($id: ID!) {
    eliminarGasto(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - ALERTAS
// ==========================================

export const CREATE_ALERTA = gql`
  mutation CrearAlerta(
    $fincaId: ID!
    $tipo: String!
    $mensaje: String!
    $fechaAlerta: Date!
    $diasRestantes: Int
    $animalId: ID
  ) {
    crearAlerta(
      fincaId: $fincaId
      tipo: $tipo
      mensaje: $mensaje
      fechaAlerta: $fechaAlerta
      diasRestantes: $diasRestantes
      animalId: $animalId
    ) {
      alerta {
        id
        mensaje
      }
      success
      message
    }
  }
`

export const MARCAR_ALERTA_LEIDA = gql`
  mutation MarcarAlertaLeida($id: ID!) {
    marcarAlertaLeida(id: $id) {
      success
      message
    }
  }
`

export const DELETE_ALERTA = gql`
  mutation EliminarAlerta($id: ID!) {
    eliminarAlerta(id: $id) {
      success
      message
    }
  }
`