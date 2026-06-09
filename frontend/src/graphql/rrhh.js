// frontend/src/graphql/rrhh.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES - TIPOS DE EMPLEADO
// ==========================================

export const GET_TIPOS_EMPLEADO = gql`
  query GetTiposEmpleado($fincaId: ID!) {
    tiposEmpleado(fincaId: $fincaId) {
      id
      nombre
      descripcion
      salarioBase
      activo
    }
  }
`

export const GET_TIPO_EMPLEADO = gql`
  query GetTipoEmpleado($id: ID!) {
    tipoEmpleado(id: $id) {
      id
      nombre
      descripcion
      salarioBase
      activo
    }
  }
`

// ==========================================
// QUERIES - EMPLEADOS
// ==========================================

export const GET_EMPLEADOS = gql`
  query GetEmpleados($fincaId: ID!, $estadoLaboral: String, $tipoId: ID, $tipoEmpleado: String) {
    empleados(fincaId: $fincaId, estadoLaboral: $estadoLaboral, tipoId: $tipoId, tipoEmpleado: $tipoEmpleado) {
      id
      nombre
      apellidos
      nombreCompleto
      ci
      sexo
      fechaNacimiento
      telefono
      email
      direccion
      tipoEmpleado
      fechaIngreso
      salario
      estadoLaboral
      fechaSalida
      motivoSalida
      isActivo
      observaciones
      cargoNombre
      documentoCiUrl
      contratoUrl
      tipo {
        id
        nombre
      }
      finca {
        id
        nombre
      }
      usuario {
        id
        username
      }
    }
  }
`

export const GET_EMPLEADO = gql`
  query GetEmpleado($id: ID!) {
    empleado(id: $id) {
      id
      nombre
      apellidos
      nombreCompleto
      ci
      sexo
      fechaNacimiento
      telefono
      email
      direccion
      tipoEmpleado
      fechaIngreso
      salario
      estadoLaboral
      fechaSalida
      motivoSalida
      isActivo
      observaciones
      cargoNombre
      documentoCiUrl
      contratoUrl
      tipo {
        id
        nombre
      }
      finca {
        id
        nombre
      }
      usuario {
        id
        username
      }
    }
  }
`

export const GET_EMPLEADOS_ACTIVOS = gql`
  query GetEmpleadosActivos($fincaId: ID!) {
    empleadosActivos(fincaId: $fincaId) {
      id
      nombre
      apellidos
      nombreCompleto
      tipo {
        id
        nombre
      }
    }
  }
`

// ==========================================
// MUTATIONS - TIPOS DE EMPLEADO
// ==========================================

export const CREATE_TIPO_EMPLEADO = gql`
  mutation CrearTipoEmpleado(
    $nombre: String!
    $descripcion: String
    $salarioBase: Decimal
  ) {
    crearTipoEmpleado(
      nombre: $nombre
      descripcion: $descripcion
      salarioBase: $salarioBase
    ) {
      tipo {
        id
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_TIPO_EMPLEADO = gql`
  mutation ActualizarTipoEmpleado(
    $id: ID!
    $nombre: String
    $descripcion: String
    $salarioBase: Decimal
    $activo: Boolean
  ) {
    actualizarTipoEmpleado(
      id: $id
      nombre: $nombre
      descripcion: $descripcion
      salarioBase: $salarioBase
      activo: $activo
    ) {
      tipo {
        id
        nombre
        activo
      }
      success
      message
    }
  }
`

export const DELETE_TIPO_EMPLEADO = gql`
  mutation EliminarTipoEmpleado($id: ID!) {
    eliminarTipoEmpleado(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - EMPLEADOS
// ==========================================

export const CREATE_EMPLEADO = gql`
  mutation CrearEmpleado(
    $fincaId: ID!
    $tipoId: ID!
    $nombre: String!
    $apellidos: String
    $ci: String
    $sexo: String
    $fechaNacimiento: Date
    $telefono: String
    $email: String
    $direccion: String
    $tipoEmpleado: String
    $fechaIngreso: Date!
    $salario: Decimal
    $estadoLaboral: String
    $fechaSalida: Date
    $motivoSalida: String
    $usuarioId: ID
    $observaciones: String
  ) {
    crearEmpleado(
      fincaId: $fincaId
      tipoId: $tipoId
      nombre: $nombre
      apellidos: $apellidos
      ci: $ci
      sexo: $sexo
      fechaNacimiento: $fechaNacimiento
      telefono: $telefono
      email: $email
      direccion: $direccion
      tipoEmpleado: $tipoEmpleado
      fechaIngreso: $fechaIngreso
      salario: $salario
      estadoLaboral: $estadoLaboral
      fechaSalida: $fechaSalida
      motivoSalida: $motivoSalida
      usuarioId: $usuarioId
      observaciones: $observaciones
    ) {
      empleado {
        id
        nombreCompleto
      }
      success
      message
    }
  }
`

export const UPDATE_EMPLEADO = gql`
  mutation ActualizarEmpleado(
    $id: ID!
    $fincaId: ID
    $tipoId: ID
    $nombre: String
    $apellidos: String
    $ci: String
    $sexo: String
    $fechaNacimiento: Date
    $telefono: String
    $email: String
    $direccion: String
    $tipoEmpleado: String
    $fechaIngreso: Date
    $salario: Decimal
    $estadoLaboral: String
    $fechaSalida: Date
    $motivoSalida: String
    $usuarioId: ID
    $observaciones: String
  ) {
    actualizarEmpleado(
      id: $id
      fincaId: $fincaId
      tipoId: $tipoId
      nombre: $nombre
      apellidos: $apellidos
      ci: $ci
      sexo: $sexo
      fechaNacimiento: $fechaNacimiento
      telefono: $telefono
      email: $email
      direccion: $direccion
      tipoEmpleado: $tipoEmpleado
      fechaIngreso: $fechaIngreso
      salario: $salario
      estadoLaboral: $estadoLaboral
      fechaSalida: $fechaSalida
      motivoSalida: $motivoSalida
      usuarioId: $usuarioId
      observaciones: $observaciones
    ) {
      empleado {
        id
        nombreCompleto
        estadoLaboral
      }
      success
      message
    }
  }
`

export const DELETE_EMPLEADO = gql`
  mutation EliminarEmpleado($id: ID!) {
    eliminarEmpleado(id: $id) {
      success
      message
    }
  }
`