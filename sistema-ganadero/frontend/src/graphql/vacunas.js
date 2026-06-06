import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_VACUNAS = gql`
  query GetVacunas {
    allVacunas {
      id
      nombre
      descripcion
      dosisRecomendada
      viaAplicacion
      intervaloDias
      edadMinimaMeses
      activo
    }
  }
`

export const GET_VACUNA_BY_ID = gql`
  query GetVacunaById($id: ID!) {
    vacunaById(id: $id) {
      id
      nombre
      descripcion
      dosisRecomendada
      viaAplicacion
      intervaloDias
      edadMinimaMeses
      activo
    }
  }
`

// ==========================================
// MUTATIONS
// ==========================================

export const CREATE_VACUNA = gql`
  mutation CrearVacuna(
    $fincaId: ID!
    $nombre: String!
    $dosisRecomendada: String!
    $viaAplicacion: String!
    $intervaloDias: Int
    $edadMinimaMeses: Int
    $descripcion: String
  ) {
    crearVacuna(
      fincaId: $fincaId
      nombre: $nombre
      dosisRecomendada: $dosisRecomendada
      viaAplicacion: $viaAplicacion
      intervaloDias: $intervaloDias
      edadMinimaMeses: $edadMinimaMeses
      descripcion: $descripcion
    ) {
      vacuna {
        id
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_VACUNA = gql`
  mutation ActualizarVacuna(
    $id: ID!
    $nombre: String
    $dosisRecomendada: String
    $viaAplicacion: String
    $intervaloDias: Int
    $activo: Boolean
  ) {
    actualizarVacuna(
      id: $id
      nombre: $nombre
      dosisRecomendada: $dosisRecomendada
      viaAplicacion: $viaAplicacion
      intervaloDias: $intervaloDias
      activo: $activo
    ) {
      vacuna {
        id
        nombre
        dosisRecomendada
        viaAplicacion
        intervaloDias
        activo
      }
      success
      message
    }
  }
`

export const DELETE_VACUNA = gql`
  mutation EliminarVacuna($id: ID!) {
    eliminarVacuna(id: $id) {
      success
      message
    }
  }
`