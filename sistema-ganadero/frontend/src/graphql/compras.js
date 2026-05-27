// frontend/src/graphql/compras.js
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
      direccion
      telefono
      nit
      ci
      estado
    }
  }
`

export const GET_NOTAS_COMPRA = gql`
  query GetNotasCompra {
    notasCompra {
      id
      tipoCompra
      fechaCompra
      montoTotal
      observaciones
      proveedor {
        id
        nombre
        apellidos
      }
      detallesMedicamentos {
        id
        cantidad
        precioUnitario
        subTotal
        medicamento {
          id
          nombre
        }
      }
      detallesAlimentos {
        id
        cantidad
        precioUnitario
        subTotal
        alimento {
          id
          nombre
        }
      }
      detallesAnimales {
        id
        nroArete
        nombre
        sexo
        peso
        precioUnitario
        subTotal
        raza {
          id
          nombre
        }
        categoria {
          id
          nombre
        }
      }
    }
  }
`

export const GET_MEDICAMENTOS = gql`
  query GetMedicamentos {
    medicamentos {
      id
      nombre
      stockCantidad
      precioCompra
    }
  }
`

export const GET_ALIMENTOS = gql`
  query GetAlimentos {
    alimentos {
      id
      nombre
      stockCantidad
      precioReferencia
    }
  }
`

export const GET_RAZAS = gql`
  query GetRazas {
    razas {
      id
      nombre
    }
  }
`

export const GET_CATEGORIAS = gql`
  query GetCategorias {
    categoriasAnimales {
      id
      nombre
    }
  }
`

// ==========================================
// MUTATIONS - PROVEEDORES
// ==========================================

export const CREATE_PROVEEDOR = gql`
  mutation CrearProveedor(
    $fincaId: ID!
    $nombre: String!
    $apellidos: String
    $direccion: String
    $telefono: String
    $nit: String
    $ci: String
  ) {
    crearProveedor(
      fincaId: $fincaId
      nombre: $nombre
      apellidos: $apellidos
      direccion: $direccion
      telefono: $telefono
      nit: $nit
      ci: $ci
    ) {
      proveedor {
        id
        nombre
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
    $direccion: String
    $telefono: String
    $nit: String
    $ci: String
  ) {
    actualizarProveedor(
      id: $id
      nombre: $nombre
      apellidos: $apellidos
      direccion: $direccion
      telefono: $telefono
      nit: $nit
      ci: $ci
    ) {
      proveedor {
        id
        nombre
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

// ==========================================
// MUTATIONS - NOTAS COMPRA
// ==========================================

export const CREATE_NOTA_COMPRA = gql`
  mutation CrearNotaCompra(
    $fincaId: ID!
    $proveedorId: ID
    $tipoCompra: String!
    $fechaCompra: Date!
    $observaciones: String
  ) {
    crearNotaCompra(
      fincaId: $fincaId
      proveedorId: $proveedorId
      tipoCompra: $tipoCompra
      fechaCompra: $fechaCompra
      observaciones: $observaciones
    ) {
      notaCompra {
        id
        fechaCompra
        tipoCompra
      }
      success
      message
    }
  }
`

export const UPDATE_NOTA_COMPRA = gql`
  mutation ActualizarNotaCompra(
    $id: ID!
    $proveedorId: ID
    $fechaCompra: Date
    $observaciones: String
  ) {
    actualizarNotaCompra(
      id: $id
      proveedorId: $proveedorId
      fechaCompra: $fechaCompra
      observaciones: $observaciones
    ) {
      notaCompra {
        id
        fechaCompra
      }
      success
      message
    }
  }
`

export const DELETE_NOTA_COMPRA = gql`
  mutation EliminarNotaCompra($id: ID!) {
    eliminarNotaCompra(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - DETALLES (MEDICAMENTOS)
// ==========================================

export const CREATE_DETALLE_COMPRA = gql`
  mutation CrearDetalleCompra(
    $notaCompraId: ID!
    $medicamentoId: ID!
    $precioUnitario: Decimal!
    $cantidad: Decimal!
  ) {
    crearDetalleCompra(
      notaCompraId: $notaCompraId
      medicamentoId: $medicamentoId
      precioUnitario: $precioUnitario
      cantidad: $cantidad
    ) {
      detalleCompra {
        id
        subTotal
      }
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - DETALLES (ALIMENTOS)
// ==========================================

export const CREATE_DETALLE_COMPRA_ALIMENTO = gql`
  mutation CrearDetalleCompraAlimento(
    $notaCompraId: ID!
    $alimentoId: ID!
    $precioUnitario: Decimal!
    $cantidad: Decimal!
  ) {
    crearDetalleCompraAlimento(
      notaCompraId: $notaCompraId
      alimentoId: $alimentoId
      precioUnitario: $precioUnitario
      cantidad: $cantidad
    ) {
      detalleCompraAlimento {
        id
        subTotal
      }
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - DETALLES (ANIMALES)
// ==========================================

export const CREATE_DETALLE_COMPRA_ANIMAL = gql`
  mutation CrearDetalleCompraAnimal(
    $notaCompraId: ID!
    $nroArete: String!
    $nombre: String
    $sexo: String!
    $razaId: ID
    $categoriaId: ID
    $peso: Decimal
    $precioUnitario: Decimal!
    $fechaNacimiento: Date
    $observaciones: String
  ) {
    crearDetalleCompraAnimal(
      notaCompraId: $notaCompraId
      nroArete: $nroArete
      nombre: $nombre
      sexo: $sexo
      razaId: $razaId
      categoriaId: $categoriaId
      peso: $peso
      precioUnitario: $precioUnitario
      fechaNacimiento: $fechaNacimiento
      observaciones: $observaciones
    ) {
      detalleCompraAnimal {
        id
        subTotal
      }
      success
      message
    }
  }
`

export const DELETE_DETALLE_COMPRA_ANIMAL = gql`
  mutation EliminarDetalleCompraAnimal($id: ID!) {
    eliminarDetalleCompraAnimal(id: $id) {
      success
      message
    }
  }
`