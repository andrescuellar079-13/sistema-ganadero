// frontend/src/graphql/fincas.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_FINCAS = gql`
  query GetFincas {
    fincas {
      id
      nombre
      propietario
      departamento
      municipio
      ubicacion
      telefono
      activo
      fechaCreacion
    }
  }
`

export const GET_FINCA = gql`
  query GetFinca($id: ID!) {
    finca(id: $id) {
      id
      nombre
      propietario
      departamento
      municipio
      ubicacion
      telefono
      activo
      fechaCreacion
    }
  }
`

export const GET_FINCA_ACTUAL = gql`
  query GetFincaActual {
    fincaActual {
      id
      nombre
      propietario
      departamento
      municipio
      ubicacion
      telefono
    }
  }
`

// ==========================================
// MUTATIONS
// ==========================================

export const CREATE_FINCA = gql`
  mutation CrearFinca(
    $nombre: String!
    $propietario: String
    $departamento: String
    $municipio: String
    $ubicacion: String
    $telefono: String
  ) {
    crearFinca(
      nombre: $nombre
      propietario: $propietario
      departamento: $departamento
      municipio: $municipio
      ubicacion: $ubicacion
      telefono: $telefono
    ) {
      finca {
        id
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_FINCA = gql`
  mutation ActualizarFinca(
    $id: ID!
    $nombre: String
    $propietario: String
    $departamento: String
    $municipio: String
    $ubicacion: String
    $telefono: String
    $activo: Boolean
  ) {
    actualizarFinca(
      id: $id
      nombre: $nombre
      propietario: $propietario
      departamento: $departamento
      municipio: $municipio
      ubicacion: $ubicacion
      telefono: $telefono
      activo: $activo
    ) {
      finca {
        id
        nombre
      }
      success
      message
    }
  }
`

export const DELETE_FINCA = gql`
  mutation EliminarFinca($id: ID!) {
    eliminarFinca(id: $id) {
      success
      message
    }
  }
`