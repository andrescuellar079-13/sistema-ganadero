// frontend/src/graphql/vacunaciones.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_VACUNACIONES = gql`
  query GetVacunaciones($fincaId: ID!) {
    vacunaciones(fincaId: $fincaId) {
      id
      fechaAplicacion
      fechaProxima
      campana
      lote
      dosisAplicada
      viaAplicacion
      observaciones
      animal {
        id
        nroArete
        nombre
      }
      vacuna {
        id
        nombre
        dosisRecomendada
      }
    }
  }
`

export const GET_VACUNAS = gql`
  query GetVacunas {
    allVacunas {
      id
      nombre
      dosisRecomendada
      viaAplicacion
      intervaloDias
    }
  }
`

export const GET_ANIMALES = gql`
  query GetAnimales {
    allAnimales {
      id
      nroArete
      nombre
      sexo
    }
  }
`

export const GET_ANIMALES_ACTIVOS = gql`
  query GetAnimalesActivos($fincaId: ID!) {
    animalesActivos(fincaId: $fincaId) {
      id
      nroArete
      nombre
      sexo
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
      vacuna {
        id
        nombre
      }
      animal {
        id
        nroArete
        nombre
      }
    }
  }
`

// ==========================================
// MUTATIONS
// ==========================================

export const CREATE_VACUNACION = gql`
  mutation CrearVacunacion(
    $fincaId: ID!
    $animalId: ID!
    $vacunaId: ID!
    $fechaAplicacion: Date!
    $campana: String
    $lote: String
    $dosisAplicada: String
    $viaAplicacion: String
    $observaciones: String
    $fechaProxima: Date
  ) {
    crearVacunacion(
      fincaId: $fincaId
      animalId: $animalId
      vacunaId: $vacunaId
      fechaAplicacion: $fechaAplicacion
      campana: $campana
      lote: $lote
      dosisAplicada: $dosisAplicada
      viaAplicacion: $viaAplicacion
      observaciones: $observaciones
      fechaProxima: $fechaProxima
    ) {
      vacunacion {
        id
        fechaAplicacion
        fechaProxima
      }
      success
      message
    }
  }
`

export const UPDATE_VACUNACION = gql`
  mutation ActualizarVacunacion(
    $id: ID!
    $fechaAplicacion: Date
    $campana: String
    $lote: String
    $dosisAplicada: String
    $viaAplicacion: String
    $observaciones: String
    $fechaProxima: Date
  ) {
    actualizarVacunacion(
      id: $id
      fechaAplicacion: $fechaAplicacion
      campana: $campana
      lote: $lote
      dosisAplicada: $dosisAplicada
      viaAplicacion: $viaAplicacion
      observaciones: $observaciones
      fechaProxima: $fechaProxima
    ) {
      vacunacion {
        id
        fechaAplicacion
        campana
        lote
        dosisAplicada
        observaciones
      }
      success
      message
    }
  }
`

export const DELETE_VACUNACION = gql`
  mutation EliminarVacunacion($id: ID!) {
    eliminarVacunacion(id: $id) {
      success
      message
    }
  }
`