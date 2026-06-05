// frontend/src/graphql/ventas.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_NOTAS_VENTA = gql`
  query GetNotasVenta {
    notasVenta {
      id
      fechaVenta
      guiaSalida
      observaciones
      montoTotal
      cliente {
        id
        nombre
        apellidos
        ci
      }
      detalles {
        id
        pesoVentaKg
        subTotal
        animal {
          id
          nroArete
          nombre
        }
      }
    }
  }
`

export const GET_CLIENTES = gql`
  query GetClientes {
    clientes {
      id
      nombre
      apellidos
      ci
      telefono
    }
  }
`

export const GET_ANIMALES_DISPONIBLES = gql`
  query GetAnimalesDisponibles {
    animalesDisponibles {
      id
      nroArete
      nombre
      peso
      estado
      raza {
        nombre
      }
    }
  }
`

export const GET_DETALLES_VENTA = gql`
  query GetDetallesVenta($notaVentaId: ID!) {
    detallesVenta(notaVentaId: $notaVentaId) {
      id
      pesoVentaKg
      subTotal
      animal {
        id
        nroArete
        nombre
        peso
      }
    }
  }
`

export const GET_MUERTES_BAJAS = gql`
  query GetMuertesBajas {
    muertesBajas {
      id
      fechaBaja
      causa
      tipo
      descripcion
      pesoEstimadoKg
      animal {
        id
        nroArete
        nombre
        peso
        raza {
          nombre
        }
      }
    }
  }
`

// ==========================================
// MUTATIONS - CREAR
// ==========================================

export const CREATE_NOTA_VENTA = gql`
  mutation CrearNotaVenta(
    $fincaId: ID!
    $clienteId: ID
    $fechaVenta: Date!
    $guiaSalida: String
    $observaciones: String
  ) {
    crearNotaVenta(
      fincaId: $fincaId
      clienteId: $clienteId
      fechaVenta: $fechaVenta
      guiaSalida: $guiaSalida
      observaciones: $observaciones
    ) {
      notaVenta {
        id
        fechaVenta
      }
      success
      message
    }
  }
`

export const CREATE_DETALLE_VENTA = gql`
  mutation CrearDetalleVenta(
    $notaVentaId: ID!
    $animalId: ID!
    $pesoVentaKg: Decimal!
    $precioKg: Decimal!
  ) {
    crearDetalleVenta(
      notaVentaId: $notaVentaId
      animalId: $animalId
      pesoVentaKg: $pesoVentaKg
      precioKg: $precioKg
    ) {
      detalleVenta {
        id
        subTotal
      }
      success
      message
    }
  }
`

export const CREATE_MUERTE_BAJA = gql`
  mutation CrearMuerteBaja(
    $fincaId: ID!
    $animalId: ID!
    $fechaBaja: Date!
    $tipo: String!
    $causa: String!
    $descripcion: String
    $pesoEstimadoKg: Decimal
  ) {
    crearMuerteBaja(
      fincaId: $fincaId
      animalId: $animalId
      fechaBaja: $fechaBaja
      tipo: $tipo
      causa: $causa
      descripcion: $descripcion
      pesoEstimadoKg: $pesoEstimadoKg
    ) {
      muerteBaja {
        id
        fechaBaja
        tipo
      }
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - ACTUALIZAR Y ELIMINAR VENTAS
// ==========================================

export const UPDATE_NOTA_VENTA = gql`
  mutation ActualizarNotaVenta(
    $id: ID!
    $clienteId: ID
    $fechaVenta: Date
    $observaciones: String
  ) {
    actualizarNotaVenta(
      id: $id
      clienteId: $clienteId
      fechaVenta: $fechaVenta
      observaciones: $observaciones
    ) {
      notaVenta {
        id
        fechaVenta
        observaciones
        montoTotal
        cliente {
          id
          nombre
          apellidos
          ci
        }
        detalles {
          id
          pesoVentaKg
          subTotal
          animal {
            id
            nroArete
            nombre
          }
        }
      }
      success
      message
    }
  }
`

export const DELETE_NOTA_VENTA = gql`
  mutation EliminarNotaVenta($id: ID!) {
    eliminarNotaVenta(id: $id) {
      success
      message
    }
  }
`

export const UPDATE_DETALLE_VENTA = gql`
  mutation ActualizarDetalleVenta(
    $id: ID!
    $pesoVentaKg: Decimal
    $precioKg: Decimal
  ) {
    actualizarDetalleVenta(
      id: $id
      pesoVentaKg: $pesoVentaKg
      precioKg: $precioKg
    ) {
      detalleVenta {
        id
        pesoVentaKg
        subTotal
      }
      success
      message
    }
  }
`

export const DELETE_DETALLE_VENTA = gql`
  mutation EliminarDetalleVenta($id: ID!) {
    eliminarDetalleVenta(id: $id) {
      success
      message
    }
  }
`

export const UPDATE_MUERTE_BAJA = gql`
  mutation ActualizarMuerteBaja(
    $id: ID!
    $fechaBaja: Date
    $tipo: String
    $causa: String
    $descripcion: String
    $pesoEstimadoKg: Decimal
  ) {
    actualizarMuerteBaja(
      id: $id
      fechaBaja: $fechaBaja
      tipo: $tipo
      causa: $causa
      descripcion: $descripcion
      pesoEstimadoKg: $pesoEstimadoKg
    ) {
      muerteBaja {
        id
        tipo
        causa
        fechaBaja
        descripcion
        pesoEstimadoKg
      }
      success
      message
    }
  }
`

export const DELETE_MUERTE_BAJA = gql`
  mutation EliminarMuerteBaja($id: ID!) {
    eliminarMuerteBaja(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// QUERIES PARA REPORTES
// ==========================================

export const GET_VENTAS_POR_RANGO = gql`
  query GetVentasPorRango($fechaInicio: Date!, $fechaFin: Date!) {
    ventasPorRango(fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      id
      fechaVenta
      montoTotal
      cliente {
        nombre
        apellidos
        ci
      }
      detalles {
        id
        pesoVentaKg
        subTotal
        animal {
          nroArete
          nombre
        }
      }
    }
  }
`

export const GET_RESUMEN_VENTAS_POR_PERIODO = gql`
  query GetResumenVentasPorPeriodo($periodo: String!) {
    resumenVentasPorPeriodo(periodo: $periodo)
  }
`

export const GET_PRODUCTOS_MAS_VENDIDOS = gql`
  query GetProductosMasVendidos($limit: Int, $fechaInicio: Date, $fechaFin: Date) {
    productosMasVendidos(limit: $limit, fechaInicio: $fechaInicio, fechaFin: $fechaFin)
  }
`

export const GET_VENTAS_POR_CLIENTE = gql`
  query GetVentasPorCliente($limit: Int, $fechaInicio: Date, $fechaFin: Date) {
    ventasPorCliente(limit: $limit, fechaInicio: $fechaInicio, fechaFin: $fechaFin)
  }
`

export const GET_ESTADISTICAS_VENTAS = gql`
  query GetEstadisticasVentas($fechaInicio: Date, $fechaFin: Date) {
    estadisticasVentas(fechaInicio: $fechaInicio, fechaFin: $fechaFin)
  }
`