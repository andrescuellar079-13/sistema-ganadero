// frontend/src/graphql/sanidad.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_TRATAMIENTOS = gql`
  query GetTratamientos($fincaId: ID!, $animalId: ID) {
    tratamientos(fincaId: $fincaId, animalId: $animalId) {
      id
      fecha
      fechaInicio
      fechaFin
      diagnostico
      tipo
      dosis
      costoTotal
      enTratamiento
      observaciones
      animal {
        id
        nroArete
        nombre
      }
      medicamento {
        id
        nombre
      }
      veterinario {
        id
        nombre
        apellidos
      }
    }
  }
`

export const GET_TRATAMIENTOS_ACTIVOS = gql`
  query GetTratamientosActivos($fincaId: ID!) {
    tratamientosActivos(fincaId: $fincaId) {
      id
      fecha
      fechaInicio
      diagnostico
      enTratamiento
      animal {
        id
        nroArete
        nombre
      }
    }
  }
`

export const GET_DESPARASITACIONES = gql`
  query GetDesparasitaciones($fincaId: ID!, $animalId: ID) {
    desparasitaciones(fincaId: $fincaId, animalId: $animalId) {
      id
      fecha
      tipoParasiticida
      producto
      dosis
      pesoAplicacion
      lote
      fechaProxima
      observaciones
      animal {
        id
        nroArete
        nombre
      }
      veterinario {
        id
        nombre
        apellidos
      }
    }
  }
`

export const GET_DIAGNOSTICOS = gql`
  query GetDiagnosticos($fincaId: ID!, $animalId: ID) {
    diagnosticos(fincaId: $fincaId, animalId: $animalId) {
      id
      fecha
      descripcion
      animal {
        id
        nroArete
        nombre
      }
      veterinario {
        id
        nombre
        apellidos
      }
    }
  }
`

export const GET_OBSERVACIONES = gql`
  query GetObservacionesSanitarias($fincaId: ID!, $animalId: ID) {
    observacionesSanitarias(fincaId: $fincaId, animalId: $animalId) {
      id
      fecha
      descripcion
      animal {
        id
        nroArete
        nombre
      }
    }
  }
`

export const GET_VACUNAS_PROXIMAS = gql`
  query GetVacunasProximas($dias: Int) {
    vacunasProximas(dias: $dias) {
      id
      fechaAplicacion
      fechaProxima
      campana
      nombreVacuna
      animal {
        id
        nroArete
        nombre
      }
    }
  }
`

// ==========================================
// MUTATIONS - TRATAMIENTOS
// ==========================================

export const CREATE_TRATAMIENTO = gql`
  mutation CrearTratamiento(
    $fincaId: ID!
    $animalId: ID!
    $fecha: Date!
    $diagnostico: String
    $tipo: String
    $dosis: String
    $costoTotal: Decimal
    $medicamentoId: ID
  ) {
    crearTratamiento(
      fincaId: $fincaId
      animalId: $animalId
      fecha: $fecha
      diagnostico: $diagnostico
      tipo: $tipo
      dosis: $dosis
      costoTotal: $costoTotal
      medicamentoId: $medicamentoId
    ) {
      tratamiento {
        id
        diagnostico
      }
      success
      message
    }
  }
`

export const FINALIZAR_TRATAMIENTO = gql`
  mutation FinalizarTratamiento($id: ID!, $fechaFin: Date!) {
    finalizarTratamiento(id: $id, fechaFin: $fechaFin) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - DESPARASITACIONES
// ==========================================

export const CREATE_DESPARASITACION = gql`
  mutation CrearDesparasitacion(
    $fincaId: ID!
    $animalId: ID!
    $fecha: Date!
    $tipoParasiticida: String!
    $producto: String!
    $dosis: String!
    $pesoAplicacion: Decimal
    $lote: String
    $fechaProxima: Date
    $observaciones: String
    $veterinarioId: ID
  ) {
    crearDesparasitacion(
      fincaId: $fincaId
      animalId: $animalId
      fecha: $fecha
      tipoParasiticida: $tipoParasiticida
      producto: $producto
      dosis: $dosis
      pesoAplicacion: $pesoAplicacion
      lote: $lote
      fechaProxima: $fechaProxima
      observaciones: $observaciones
      veterinarioId: $veterinarioId
    ) {
      desparasitacion {
        id
        producto
      }
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - DIAGNOSTICOS
// ==========================================

export const CREATE_DIAGNOSTICO = gql`
  mutation CrearDiagnostico(
    $fincaId: ID!
    $animalId: ID!
    $fecha: Date!
    $descripcion: String!
    $veterinarioId: ID
  ) {
    crearDiagnostico(
      fincaId: $fincaId
      animalId: $animalId
      fecha: $fecha
      descripcion: $descripcion
      veterinarioId: $veterinarioId
    ) {
      diagnostico {
        id
        descripcion
      }
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - OBSERVACIONES
// ==========================================

export const CREATE_OBSERVACION = gql`
  mutation CrearObservacion(
    $fincaId: ID!
    $animalId: ID!
    $fecha: Date!
    $descripcion: String!
  ) {
    crearObservacion(
      fincaId: $fincaId
      animalId: $animalId
      fecha: $fecha
      descripcion: $descripcion
    ) {
      observacion {
        id
        descripcion
      }
      success
      message
    }
  }
`