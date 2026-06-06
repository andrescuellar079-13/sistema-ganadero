// frontend/src/graphql/roles.js
import { gql } from '@apollo/client'

export const GET_ROLES = gql`
  query GetRoles {
    roles {
      id
      nombre
      descripcion
      permisosLista
      activo
    }
  }
`

export const GET_PERMISOS_SISTEMA = gql`
  query GetPermisosSistema {
    permisosSistemaDict
  }
`

export const CREATE_ROL = gql`
  mutation CrearRol(
    $nombre: String!
    $descripcion: String
    $permisos: [String]
  ) {
    crearRol(
      nombre: $nombre
      descripcion: $descripcion
      permisos: $permisos
    ) {
      rol {
        id
        nombre
        permisosLista
      }
      success
      message
    }
  }
`

export const UPDATE_ROL = gql`
  mutation ActualizarRol(
    $id: ID!
    $nombre: String
    $descripcion: String
    $permisos: [String]
    $activo: Boolean
  ) {
    actualizarRol(
      id: $id
      nombre: $nombre
      descripcion: $descripcion
      permisos: $permisos
      activo: $activo
    ) {
      rol {
        id
        nombre
        permisosLista
      }
      success
      message
    }
  }
`

export const DELETE_ROL = gql`
  mutation EliminarRol($id: ID!) {
    eliminarRol(id: $id) {
      success
      message
    }
  }
`