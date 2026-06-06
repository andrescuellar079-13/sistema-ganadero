// frontend/src/graphql/inventario.js
import { gql } from '@apollo/client'

export const GET_MOVIMIENTOS_INVENTARIO = gql`
  query GetMovimientosInventario($fincaId: ID, $tipoProducto: String, $tipoMovimiento: String) {
    movimientosInventario(fincaId: $fincaId, tipoProducto: $tipoProducto, tipoMovimiento: $tipoMovimiento) {
      id
      tipoMovimiento
      tipoProducto
      cantidad
      stockAnterior
      stockPosterior
      precioUnitario
      fecha
      motivo
      nombreProducto
      medicamento { id nombre unidadMedida }
      alimento { id nombre unidadMedida }
      vacuna { id nombre }
      notaCompra { id fechaCompra }
      registradoPor { id username }
    }
  }
`

export const GET_PRODUCTOS_POR_VENCER = gql`
  query GetProductosPorVencer($fincaId: ID, $dias: Int) {
    productosPorVencer(fincaId: $fincaId, dias: $dias)
  }
`

export const GET_PRODUCTOS_STOCK_BAJO = gql`
  query GetProductosStockBajo($fincaId: ID) {
    productosStockBajo(fincaId: $fincaId)
  }
`

export const REGISTRAR_MOVIMIENTO_INVENTARIO = gql`
  mutation RegistrarMovimientoInventario(
    $fincaId: ID!
    $tipoMovimiento: String!
    $tipoProducto: String!
    $cantidad: Decimal!
    $fecha: Date!
    $medicamentoId: ID
    $alimentoId: ID
    $vacunaId: ID
    $precioUnitario: Decimal
    $motivo: String
    $notaCompraId: ID
  ) {
    registrarMovimientoInventario(
      fincaId: $fincaId
      tipoMovimiento: $tipoMovimiento
      tipoProducto: $tipoProducto
      cantidad: $cantidad
      fecha: $fecha
      medicamentoId: $medicamentoId
      alimentoId: $alimentoId
      vacunaId: $vacunaId
      precioUnitario: $precioUnitario
      motivo: $motivo
      notaCompraId: $notaCompraId
    ) {
      movimiento { id tipoMovimiento cantidad fecha nombreProducto }
      success
      message
    }
  }
`
