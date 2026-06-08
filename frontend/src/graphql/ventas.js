// frontend/src/graphql/ventas.js
import { gql } from '@apollo/client'

export const GET_NOTAS_VENTA = gql`
  query GetNotasVenta {
    notasVenta {
      id
      fechaVenta
      guiaSalida
      observaciones
      montoTotal
      modalidadVenta
      corral { id nombre }
      cliente { id nombre apellidos ci }
      detalles {
        id
        pesoVentaKg
        precioUnitario
        subTotal
        modalidad
        costoEstimado
        utilidad
        animal { id nroArete nombre }
      }
    }
  }
`

export const GET_CLIENTES = gql`
  query GetClientes {
    clientes { id nombre apellidos ci telefono }
  }
`

export const GET_ANIMALES_DISPONIBLES = gql`
  query GetAnimalesDisponibles {
    animalesDisponibles { id nroArete nombre peso estado raza { nombre } }
  }
`

export const GET_MUERTES_BAJAS = gql`
  query GetMuertesBajas {
    muertesBajas {
      id fechaBaja causa tipo motivoDescarte descripcion pesoEstimadoKg
      animal { id nroArete nombre peso raza { nombre } }
    }
  }
`

export const GET_CORRALES_VENTA = gql`
  query GetCorralesVenta {
    corralesVenta {
      id nombre descripcion fechaFormacion activo totalAnimales pesoTotal
      animales { id pesoEntrada animal { id nroArete nombre peso } }
    }
  }
`

export const GET_UTILIDAD_POR_VENTA = gql`
  query GetUtilidadPorVenta($notaVentaId: ID!) {
    utilidadPorVenta(notaVentaId: $notaVentaId)
  }
`

export const CREATE_NOTA_VENTA = gql`
  mutation CrearNotaVenta(
    $fincaId: ID! $clienteId: ID $corralId: ID $modalidadVenta: String
    $fechaVenta: Date! $guiaSalida: String $observaciones: String
  ) {
    crearNotaVenta(
      fincaId: $fincaId clienteId: $clienteId corralId: $corralId
      modalidadVenta: $modalidadVenta fechaVenta: $fechaVenta
      guiaSalida: $guiaSalida observaciones: $observaciones
    ) {
      notaVenta { id fechaVenta modalidadVenta }
      success message
    }
  }
`

export const UPDATE_NOTA_VENTA = gql`
  mutation ActualizarNotaVenta(
    $id: ID! $clienteId: ID $corralId: ID $modalidadVenta: String
    $fechaVenta: Date $observaciones: String
  ) {
    actualizarNotaVenta(
      id: $id clienteId: $clienteId corralId: $corralId
      modalidadVenta: $modalidadVenta fechaVenta: $fechaVenta observaciones: $observaciones
    ) {
      notaVenta { id fechaVenta montoTotal }
      success message
    }
  }
`

export const DELETE_NOTA_VENTA = gql`
  mutation EliminarNotaVenta($id: ID!) {
    eliminarNotaVenta(id: $id) { success message }
  }
`

export const CREATE_DETALLE_VENTA = gql`
  mutation CrearDetalleVenta(
    $notaVentaId: ID! $animalId: ID! $modalidad: String
    $precioKg: Decimal! $pesoVentaKg: Decimal $costoEstimado: Decimal
  ) {
    crearDetalleVenta(
      notaVentaId: $notaVentaId animalId: $animalId modalidad: $modalidad
      precioKg: $precioKg pesoVentaKg: $pesoVentaKg costoEstimado: $costoEstimado
    ) {
      detalleVenta { id subTotal utilidad }
      success message
    }
  }
`

export const DELETE_DETALLE_VENTA = gql`
  mutation EliminarDetalleVenta($id: ID!) {
    eliminarDetalleVenta(id: $id) { success message }
  }
`

export const CREATE_CORRAL_VENTA = gql`
  mutation CrearCorralVenta(
    $fincaId: ID! $nombre: String! $descripcion: String $fechaFormacion: Date!
  ) {
    crearCorralVenta(
      fincaId: $fincaId nombre: $nombre descripcion: $descripcion fechaFormacion: $fechaFormacion
    ) {
      corral { id nombre }
      success message
    }
  }
`

export const AGREGAR_ANIMAL_CORRAL = gql`
  mutation AgregarAnimalCorral(
    $corralId: ID! $animalId: ID! $pesoEntrada: Decimal $fechaIngreso: Date! $observaciones: String
  ) {
    agregarAnimalCorral(
      corralId: $corralId animalId: $animalId pesoEntrada: $pesoEntrada
      fechaIngreso: $fechaIngreso observaciones: $observaciones
    ) {
      animalCorral { id }
      success message
    }
  }
`

export const DELETE_CORRAL_VENTA = gql`
  mutation EliminarCorralVenta($id: ID!) {
    eliminarCorralVenta(id: $id) { success message }
  }
`

export const CREATE_MUERTE_BAJA = gql`
  mutation CrearMuerteBaja(
    $fincaId: ID! $animalId: ID! $fechaBaja: Date! $tipo: String!
    $causa: String! $motivoDescarte: String $descripcion: String $pesoEstimadoKg: Decimal
  ) {
    crearMuerteBaja(
      fincaId: $fincaId animalId: $animalId fechaBaja: $fechaBaja tipo: $tipo
      causa: $causa motivoDescarte: $motivoDescarte descripcion: $descripcion pesoEstimadoKg: $pesoEstimadoKg
    ) {
      muerteBaja { id fechaBaja tipo motivoDescarte }
      success message
    }
  }
`

export const UPDATE_MUERTE_BAJA = gql`
  mutation ActualizarMuerteBaja(
    $id: ID! $fechaBaja: Date $tipo: String $causa: String
    $motivoDescarte: String $descripcion: String $pesoEstimadoKg: Decimal
  ) {
    actualizarMuerteBaja(
      id: $id fechaBaja: $fechaBaja tipo: $tipo causa: $causa
      motivoDescarte: $motivoDescarte descripcion: $descripcion pesoEstimadoKg: $pesoEstimadoKg
    ) {
      muerteBaja { id tipo causa motivoDescarte fechaBaja descripcion pesoEstimadoKg }
      success message
    }
  }
`

export const DELETE_MUERTE_BAJA = gql`
  mutation EliminarMuerteBaja($id: ID!) {
    eliminarMuerteBaja(id: $id) { success message }
  }
`


export const GET_VENTAS_POR_RANGO = gql`
  query GetVentasPorRango($fechaInicio: Date!, $fechaFin: Date!) {
    ventasPorRango(fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      id
      fechaVenta
      montoTotal
      cliente { nombre apellidos ci }
      detalles { id pesoVentaKg subTotal animal { nroArete nombre } }
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
