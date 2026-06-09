// frontend/src/graphql/alertas.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

const ALERTA_FIELDS = `
  id
  tipo
  mensaje
  fechaAlerta
  diasRestantes
  leida
  prioridad
  estado
  moduloOrigen
  fechaVencimiento
  accionRecomendada
  vencida
  animal {
    id
    nroArete
    nombre
  }
`

export const GET_ALERTAS = gql`
  query GetAlertas($fincaId: ID!, $estado: String, $prioridad: String, $moduloOrigen: String, $tipo: String) {
    alertas(fincaId: $fincaId, estado: $estado, prioridad: $prioridad, moduloOrigen: $moduloOrigen, tipo: $tipo) {
      ${ALERTA_FIELDS}
    }
  }
`

export const GET_ALERTAS_PENDIENTES = gql`
  query GetAlertasPendientes($fincaId: ID!) {
    alertasPendientes(fincaId: $fincaId) {
      ${ALERTA_FIELDS}
    }
  }
`

export const GET_RESUMEN_ALERTAS = gql`
  query GetResumenAlertas($fincaId: ID!) {
    resumenAlertas(fincaId: $fincaId) {
      pendientes
      criticas
      vencidas
      resueltas
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
      centroCosto
      metodoPago
      proveedor
      comprobante
      observaciones
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
    $centroCosto: String
    $metodoPago: String
    $parcelaId: ID
    $proveedor: String
    $comprobante: String
    $observaciones: String
  ) {
    crearGasto(
      fincaId: $fincaId
      fecha: $fecha
      tipoGasto: $tipoGasto
      descripcion: $descripcion
      cantidad: $cantidad
      precioUnitario: $precioUnitario
      animalId: $animalId
      centroCosto: $centroCosto
      metodoPago: $metodoPago
      parcelaId: $parcelaId
      proveedor: $proveedor
      comprobante: $comprobante
      observaciones: $observaciones
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
    $centroCosto: String
    $metodoPago: String
    $parcelaId: ID
    $proveedor: String
    $comprobante: String
    $observaciones: String
  ) {
    actualizarGasto(
      id: $id
      fecha: $fecha
      tipoGasto: $tipoGasto
      descripcion: $descripcion
      cantidad: $cantidad
      precioUnitario: $precioUnitario
      animalId: $animalId
      centroCosto: $centroCosto
      metodoPago: $metodoPago
      parcelaId: $parcelaId
      proveedor: $proveedor
      comprobante: $comprobante
      observaciones: $observaciones
    ) {
      gasto {
        id
        fecha
        tipoGasto
        descripcion
        cantidad
        precioUnitario
        total
        centroCosto
        metodoPago
        proveedor
        comprobante
        observaciones
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
    $prioridad: String
    $moduloOrigen: String
    $accionRecomendada: String
  ) {
    crearAlerta(
      fincaId: $fincaId
      tipo: $tipo
      mensaje: $mensaje
      fechaAlerta: $fechaAlerta
      diasRestantes: $diasRestantes
      animalId: $animalId
      prioridad: $prioridad
      moduloOrigen: $moduloOrigen
      accionRecomendada: $accionRecomendada
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

export const MARCAR_ALERTA_EN_PROCESO = gql`
  mutation MarcarAlertaEnProceso($id: ID!) {
    marcarAlertaEnProceso(id: $id) {
      success
      message
    }
  }
`

export const RESOLVER_ALERTA = gql`
  mutation ResolverAlerta($id: ID!, $observacion: String) {
    resolverAlerta(id: $id, observacion: $observacion) {
      success
      message
    }
  }
`

export const DESCARTAR_ALERTA = gql`
  mutation DescartarAlerta($id: ID!, $observacion: String) {
    descartarAlerta(id: $id, observacion: $observacion) {
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

export const GENERAR_ALERTAS_AUTOMATICAS = gql`
  mutation GenerarAlertasAutomaticas($fincaId: ID!) {
    generarAlertasAutomaticas(fincaId: $fincaId) {
      success
      total
      vacunasProximas
      vacunasVencidas
      partosProximos
      stockBajoMedicamento
      stockBajoAlimento
      pesajesPendientes
      transferenciasPendientes
    }
  }
`
