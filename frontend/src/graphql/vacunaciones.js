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
      estadoProxima
      campana
      lote
      dosisAplicada
      viaAplicacion
      observaciones
      nombreVeterinario
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
      veterinario {
        id
        nombre
        apellidos
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
      edadMinimaMeses
      diasAnticipacionAlerta
      stockCantidad
      stockMinimo
      fechaVencimiento
      activo
      sexoAplicable
      tipoProduccionAplicable
      isStockBajo
      isVencida
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
      fechaNacimiento
      tipoProduccion
    }
  }
`

export const GET_VETERINARIOS = gql`
  query GetVeterinarios {
    veterinarios {
      id
      nombre
      apellidos
      activo
    }
  }
`

export const GET_VACUNAS_PROXIMAS = gql`
  query GetVacunasProximas($fincaId: ID, $dias: Int) {
    vacunasProximas(fincaId: $fincaId, dias: $dias) {
      id
      fechaAplicacion
      fechaProxima
      estadoProxima
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

export const GET_VACUNAS_VENCIDAS = gql`
  query GetVacunasVencidas($fincaId: ID) {
    vacunasVencidas(fincaId: $fincaId) {
      id
      fechaAplicacion
      fechaProxima
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
    $veterinarioId: ID
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
      veterinarioId: $veterinarioId
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
      advertencia
    }
  }
`

export const UPDATE_VACUNACION = gql`
  mutation ActualizarVacunacion(
    $id: ID!
    $fechaAplicacion: Date
    $veterinarioId: ID
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
      veterinarioId: $veterinarioId
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
