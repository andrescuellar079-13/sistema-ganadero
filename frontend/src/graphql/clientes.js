import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_CLIENTES = gql`
  query GetClientes {
    clientes {
      id
      nombre
      apellidos
      ci
      telefono
      email
      direccion
    }
  }
`

// ==========================================
// MUTATIONS
// ==========================================

export const CREATE_CLIENTE = gql`
  mutation CrearCliente(
    $fincaId: ID!
    $nombre: String!
    $apellidos: String
    $ci: String
    $telefono: String
    $email: String
    $direccion: String
  ) {
    crearCliente(
      fincaId: $fincaId
      nombre: $nombre
      apellidos: $apellidos
      ci: $ci
      telefono: $telefono
      email: $email
      direccion: $direccion
    ) {
      cliente {
        id
        nombre
        apellidos
      }
      success
      message
    }
  }
`

export const UPDATE_CLIENTE = gql`
  mutation ActualizarCliente(
    $id: ID!
    $nombre: String
    $apellidos: String
    $telefono: String
    $email: String
    $direccion: String
  ) {
    actualizarCliente(
      id: $id
      nombre: $nombre
      apellidos: $apellidos
      telefono: $telefono
      email: $email
      direccion: $direccion
    ) {
      cliente {
        id
        nombre
        apellidos
        telefono
        email
      }
      success
      message
    }
  }
`

export const DELETE_CLIENTE = gql`
  mutation EliminarCliente($id: ID!) {
    eliminarCliente(id: $id) {
      success
      message
    }
  }
`