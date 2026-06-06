// frontend/src/graphql/parcelas.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_PARCELAS = gql`
  query GetParcelas($fincaId: ID!) {
    parcelas(fincaId: $fincaId) {
      id
      nombre
      estado
      tamano
      capacidadMaxima
      tipoPastura
      animalesActuales {
        id
        animal {
          id
          nroArete
          nombre
          sexo
        }
        fechaIngreso
      }
    }
  }
`

export const GET_PARCELA = gql`
  query GetParcela($id: ID!) {
    parcela(id: $id) {
      id
      nombre
      estado
      tamano
      capacidadMaxima
      tipoPastura
      animalesActuales {
        id
        animal {
          id
          nroArete
          nombre
          sexo
        }
        fechaIngreso
      }
    }
  }
`

export const GET_ANIMALES_EN_PARCELA = gql`
  query GetAnimalesEnParcela($parcelaId: ID!) {
    animalesEnParcela(parcelaId: $parcelaId) {
      id
      animal {
        id
        nroArete
        nombre
        sexo
        peso
        raza {
          nombre
        }
      }
      fechaIngreso
    }
  }
`

export const GET_ANIMALES_DISPONIBLES = gql`
  query GetAnimalesDisponibles($fincaId: ID!) {
    animalesActivos(fincaId: $fincaId) {
      id
      nroArete
      nombre
      sexo
      peso
      raza {
        nombre
      }
    }
  }
`

// ==========================================
// MUTATIONS - PARCELAS
// ==========================================

export const CREATE_PARCELA = gql`
  mutation CrearParcela(
    $fincaId: ID!
    $nombre: String!
    $tamano: Decimal
    $capacidadMaxima: Int
    $tipoPastura: String
    $estado: String
  ) {
    crearParcela(
      fincaId: $fincaId
      nombre: $nombre
      tamano: $tamano
      capacidadMaxima: $capacidadMaxima
      tipoPastura: $tipoPastura
      estado: $estado
    ) {
      parcela {
        id
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_PARCELA = gql`
  mutation ActualizarParcela(
    $id: ID!
    $nombre: String
    $tamano: Decimal
    $capacidadMaxima: Int
    $tipoPastura: String
    $estado: String
  ) {
    actualizarParcela(
      id: $id
      nombre: $nombre
      tamano: $tamano
      capacidadMaxima: $capacidadMaxima
      tipoPastura: $tipoPastura
      estado: $estado
    ) {
      parcela {
        id
        nombre
      }
      success
      message
    }
  }
`

export const DELETE_PARCELA = gql`
  mutation EliminarParcela($id: ID!) {
    eliminarParcela(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - MOVIMIENTOS
// ==========================================

export const MOVER_ANIMAL_A_PARCELA = gql`
  mutation MoverAnimalAParcela(
    $fincaId: ID!
    $animalId: ID!
    $parcelaId: ID!
    $fechaIngreso: Date!
    $observaciones: String
  ) {
    moverAnimalAParcela(
      fincaId: $fincaId
      animalId: $animalId
      parcelaId: $parcelaId
      fechaIngreso: $fechaIngreso
      observaciones: $observaciones
    ) {
      movimiento {
        id
      }
      success
      message
    }
  }
`

export const SACAR_ANIMAL_DE_PARCELA = gql`
  mutation SacarAnimalDeParcela($movimientoId: ID!, $fechaSalida: Date!) {
    sacarAnimalDeParcela(movimientoId: $movimientoId, fechaSalida: $fechaSalida) {
      success
      message
    }
  }
`

// ==========================================
// QUERY PARCELAS DISPONIBLES PARA MOVIMIENTO
// ==========================================

export const GET_PARCELAS_DISPONIBLES_PARA_MOVIMIENTO = gql`
  query ParcelasDisponiblesParaMovimiento($fincaId: ID!, $animalId: ID!) {
    parcelasDisponiblesParaMovimiento(fincaId: $fincaId, animalId: $animalId) {
      id
      nombre
      estado
      capacidadMaxima
      ocupacionActual
    }
  }
`

// ==========================================
// QUERY PAGINADA CON BÚSQUEDA Y FILTROS
// ==========================================

export const GET_PARCELAS_PAGINADAS = gql`
  query ParcelasPaginadas(
    $fincaId: ID!
    $search: String
    $estado: String
    $temporal: String
    $ordering: String
    $page: Int
    $pageSize: Int
  ) {
    parcelasPaginadas(
      fincaId: $fincaId
      search: $search
      estado: $estado
      temporal: $temporal
      ordering: $ordering
      page: $page
      pageSize: $pageSize
    ) {
      count
      page
      pageSize
      totalPages
      hasNext
      hasPrevious
      results {
        id
        nombre
        estado
        tamano
        capacidadMaxima
        tipoPastura
        ocupacionActual
        animalesActuales {
          id
          animal {
            id
            nroArete
            nombre
          }
          fechaIngreso
        }
      }
    }
  }
`