// frontend/src/graphql/catalogos.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_TIPOS_MEDICAMENTO = gql`
  query GetTiposMedicamento {
    tiposMedicamento {
      id
      nombre
      descripcion
    }
  }
`

export const GET_MEDICAMENTOS = gql`
  query GetMedicamentos {
    medicamentos {
      id
      nombre
      descripcion
      laboratorio
      unidadMedida
      stockCantidad
      contenidoNeto
      fechaVencimiento
      precioCompra
      intervaloDias
      activo
      tipo {
        id
        nombre
      }
    }
  }
`

export const GET_ALIMENTOS = gql`
  query GetAlimentos {
    alimentos {
      id
      nombre
      contenidoNeto
      unidadMedida
      fechaVencimiento
      stockCantidad
      precioReferencia
      activo
    }
  }
`

export const GET_RAZAS = gql`
  query GetRazas {
    razas {
      id
      nombre
      orientacion
      origen
      descripcion
      activo
    }
  }
`

export const GET_CATEGORIAS_ANIMALES = gql`
  query GetCategoriasAnimales {
    categoriasAnimales {
      id
      nombre
      descripcion
      activo
    }
  }
`

export const GET_VETERINARIOS = gql`
  query GetVeterinarios {
    veterinarios {
      id
      nombre
      apellidos
      ci
      especialidad
      telefono
      email
      activo
    }
  }
`

export const GET_REPRODUCTORES = gql`
  query GetReproductores {
    reproductores {
      id
      codigo
      nombre
      tipoOrigen
      codigoPajuela
      laboratorio
      observaciones
      activo
      raza {
        id
        nombre
      }
    }
  }
`

// ==========================================
// MUTATIONS - MEDICAMENTOS
// ==========================================

export const CREATE_MEDICAMENTO = gql`
  mutation CrearMedicamento(
    $fincaId: ID!
    $nombre: String!
    $laboratorio: String
    $unidadMedida: String
    $stockCantidad: Decimal
    $precioCompra: Decimal
  ) {
    crearMedicamento(
      fincaId: $fincaId
      nombre: $nombre
      laboratorio: $laboratorio
      unidadMedida: $unidadMedida
      stockCantidad: $stockCantidad
      precioCompra: $precioCompra
    ) {
      medicamento {
        id
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_MEDICAMENTO = gql`
  mutation ActualizarMedicamento(
    $id: ID!
    $nombre: String
    $stockCantidad: Decimal
    $precioCompra: Decimal
    $activo: Boolean
  ) {
    actualizarMedicamento(
      id: $id
      nombre: $nombre
      stockCantidad: $stockCantidad
      precioCompra: $precioCompra
      activo: $activo
    ) {
      medicamento {
        id
        nombre
      }
      success
      message
    }
  }
`

export const DELETE_MEDICAMENTO = gql`
  mutation EliminarMedicamento($id: ID!) {
    eliminarMedicamento(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - ALIMENTOS
// ==========================================

export const CREATE_ALIMENTO = gql`
  mutation CrearAlimento(
    $fincaId: ID!
    $nombre: String!
    $contenidoNeto: Decimal
    $unidadMedida: String
    $fechaVencimiento: Date
    $stockCantidad: Decimal
    $precioReferencia: Decimal
  ) {
    crearAlimento(
      fincaId: $fincaId
      nombre: $nombre
      contenidoNeto: $contenidoNeto
      unidadMedida: $unidadMedida
      fechaVencimiento: $fechaVencimiento
      stockCantidad: $stockCantidad
      precioReferencia: $precioReferencia
    ) {
      alimento {
        id
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_ALIMENTO = gql`
  mutation ActualizarAlimento(
    $id: ID!
    $nombre: String
    $stockCantidad: Decimal
    $precioReferencia: Decimal
    $activo: Boolean
  ) {
    actualizarAlimento(
      id: $id
      nombre: $nombre
      stockCantidad: $stockCantidad
      precioReferencia: $precioReferencia
      activo: $activo
    ) {
      alimento {
        id
        nombre
        stockCantidad
        precioReferencia
        activo
      }
      success
      message
    }
  }
`

export const DELETE_ALIMENTO = gql`
  mutation EliminarAlimento($id: ID!) {
    eliminarAlimento(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - RAZAS
// ==========================================

export const CREATE_RAZA = gql`
  mutation CrearRaza(
    $nombre: String!
    $orientacion: String
    $origen: String
    $descripcion: String
  ) {
    crearRaza(
      nombre: $nombre
      orientacion: $orientacion
      origen: $origen
      descripcion: $descripcion
    ) {
      raza {
        id
        nombre
        orientacion
        origen
      }
      success
      message
    }
  }
`

export const UPDATE_RAZA = gql`
  mutation ActualizarRaza(
    $id: ID!
    $nombre: String
    $orientacion: String
    $origen: String
    $activo: Boolean
  ) {
    actualizarRaza(
      id: $id
      nombre: $nombre
      orientacion: $orientacion
      origen: $origen
      activo: $activo
    ) {
      raza {
        id
        nombre
        orientacion
        origen
        activo
      }
      success
      message
    }
  }
`

export const DELETE_RAZA = gql`
  mutation EliminarRaza($id: ID!) {
    eliminarRaza(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - CATEGORIAS ANIMALES
// ==========================================

export const CREATE_CATEGORIA_ANIMAL = gql`
  mutation CrearCategoriaAnimal(
    $nombre: String!
    $descripcion: String
  ) {
    crearCategoriaAnimal(
      nombre: $nombre
      descripcion: $descripcion
    ) {
      categoria {
        id
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_CATEGORIA_ANIMAL = gql`
  mutation ActualizarCategoriaAnimal(
    $id: ID!
    $nombre: String
    $activo: Boolean
  ) {
    actualizarCategoriaAnimal(
      id: $id
      nombre: $nombre
      activo: $activo
    ) {
      categoria {
        id
        nombre
        activo
      }
      success
      message
    }
  }
`

export const DELETE_CATEGORIA_ANIMAL = gql`
  mutation EliminarCategoriaAnimal($id: ID!) {
    eliminarCategoriaAnimal(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - VETERINARIOS
// ==========================================

export const CREATE_VETERINARIO = gql`
  mutation CrearVeterinario(
    $fincaId: ID!
    $nombre: String!
    $apellidos: String
    $ci: String
    $especialidad: String
    $telefono: String
    $email: String
  ) {
    crearVeterinario(
      fincaId: $fincaId
      nombre: $nombre
      apellidos: $apellidos
      ci: $ci
      especialidad: $especialidad
      telefono: $telefono
      email: $email
    ) {
      veterinario {
        id
        nombre
        apellidos
      }
      success
      message
    }
  }
`

export const UPDATE_VETERINARIO = gql`
  mutation ActualizarVeterinario(
    $id: ID!
    $nombre: String
    $apellidos: String
    $telefono: String
    $especialidad: String
    $activo: Boolean
  ) {
    actualizarVeterinario(
      id: $id
      nombre: $nombre
      apellidos: $apellidos
      telefono: $telefono
      especialidad: $especialidad
      activo: $activo
    ) {
      veterinario {
        id
        nombre
        apellidos
        activo
      }
      success
      message
    }
  }
`

export const DELETE_VETERINARIO = gql`
  mutation EliminarVeterinario($id: ID!) {
    eliminarVeterinario(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - REPRODUCTORES
// ==========================================

export const CREATE_REPRODUCTOR = gql`
  mutation CrearReproductor(
    $fincaId: ID!
    $razaId: ID
    $codigo: String!
    $nombre: String
    $tipoOrigen: String!
    $codigoPajuela: String
    $laboratorio: String
    $observaciones: String
  ) {
    crearReproductor(
      fincaId: $fincaId
      razaId: $razaId
      codigo: $codigo
      nombre: $nombre
      tipoOrigen: $tipoOrigen
      codigoPajuela: $codigoPajuela
      laboratorio: $laboratorio
      observaciones: $observaciones
    ) {
      reproductor {
        id
        codigo
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_REPRODUCTOR = gql`
  mutation ActualizarReproductor(
    $id: ID!
    $nombre: String
    $activo: Boolean
  ) {
    actualizarReproductor(
      id: $id
      nombre: $nombre
      activo: $activo
    ) {
      reproductor {
        id
        nombre
        activo
      }
      success
      message
    }
  }
`

export const DELETE_REPRODUCTOR = gql`
  mutation EliminarReproductor($id: ID!) {
    eliminarReproductor(id: $id) {
      success
      message
    }
  }
`