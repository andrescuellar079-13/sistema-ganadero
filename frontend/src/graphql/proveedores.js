import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_PROVEEDORES = gql`
  query GetProveedores {
    proveedores {
      id
      nombre
      apellidos
      telefono
      direccion
      nit
      ci
    }
  }
`

// ==========================================
// MUTATIONS
// ==========================================

export const CREATE_PROVEEDOR = gql`
  mutation CrearProveedor(
    $fincaId: ID!
    $nombre: String!
    $apellidos: String
    $telefono: String
    $direccion: String
    $nit: String
    $ci: String
  ) {
    crearProveedor(
      fincaId: $fincaId
      nombre: $nombre
      apellidos: $apellidos
      telefono: $telefono
      direccion: $direccion
      nit: $nit
      ci: $ci
    ) {
      proveedor {
        id
        nombre
        apellidos
        telefono
      }
      success
      message
    }
  }
`

export const UPDATE_PROVEEDOR = gql`
  mutation ActualizarProveedor(
    $id: ID!
    $nombre: String
    $apellidos: String
    $telefono: String
    $direccion: String
    $nit: String
    $ci: String
  ) {
    actualizarProveedor(
      id: $id
      nombre: $nombre
      apellidos: $apellidos
      telefono: $telefono
      direccion: $direccion
      nit: $nit
      ci: $ci
    ) {
      proveedor {
        id
        nombre
        apellidos
        telefono
      }
      success
      message
    }
  }
`

export const DELETE_PROVEEDOR = gql`
  mutation EliminarProveedor($id: ID!) {
    eliminarProveedor(id: $id) {
      success
      message
    }
  }
`