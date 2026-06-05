// frontend/src/graphql/auth.js
import { gql } from '@apollo/client'

export const LOGIN = gql`
  mutation TokenAuth($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
    }
  }
`

export const GET_MI_USUARIO = gql`
  query MiUsuario {
    miUsuario {
      id
      username
      email
      firstName
      lastName
      isActive
      finca {
        id
        nombre
      }
      rol {
        id
        nombre
        permisosLista
      }
    }
  }
`

export const LOGOUT = gql`
  mutation Logout {
    logout {
      success
    }
  }
`

export const VERIFY_TOKEN = gql`
  mutation VerifyToken($token: String!) {
    verifyToken(token: $token) {
      payload
    }
  }
`

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($token: String!) {
    refreshToken(token: $token) {
      token
    }
  }
`

export const CAMBIAR_PASSWORD = gql`
  mutation CambiarPassword($oldPassword: String!, $newPassword: String!) {
    cambiarPassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`
