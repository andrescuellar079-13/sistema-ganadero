// frontend/src/graphql/usuarios.js
import { gql } from '@apollo/client'

export const GET_USUARIOS = gql`
  query GetUsuarios {
    usuarios {
      id
      username
      email
      firstName
      lastName
      telefono
      isActive
      rol {
        id
        nombre
      }
    }
  }
`

export const CREATE_USUARIO = gql`
  mutation CrearUsuario(
    $username: String!
    $email: String!
    $password: String!
    $firstName: String
    $lastName: String
    $rolId: ID
    $telefono: String
  ) {
    crearUsuario(
      username: $username
      email: $email
      password: $password
      firstName: $firstName
      lastName: $lastName
      rolId: $rolId
      telefono: $telefono
    ) {
      usuario {
        id
        username
      }
      success
      message
    }
  }
`

export const UPDATE_USUARIO = gql`
  mutation ActualizarUsuario(
    $id: ID!
    $username: String
    $email: String
    $firstName: String
    $lastName: String
    $rolId: ID
    $telefono: String
    $isActive: Boolean
  ) {
    actualizarUsuario(
      id: $id
      username: $username
      email: $email
      firstName: $firstName
      lastName: $lastName
      rolId: $rolId
      telefono: $telefono
      isActive: $isActive
    ) {
      usuario {
        id
        username
      }
      success
      message
    }
  }
`

export const DELETE_USUARIO = gql`
  mutation EliminarUsuario($id: ID!) {
    eliminarUsuario(id: $id) {
      success
      message
    }
  }
`