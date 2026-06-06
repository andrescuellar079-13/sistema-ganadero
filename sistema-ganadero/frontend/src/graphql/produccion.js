// frontend/src/graphql/produccion.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_LACTANCIAS = gql`
  query GetLactancias($fincaId: ID!) {
    lactancias(fincaId: $fincaId) {
      id
      numeroLactancia
      fechaInicio
      fechaSecado
      diasProduccion
      totalLitros
      promedioDiario
      ajuste305Dias
      estado
      observaciones
      vaca {
        id
        nroArete
        nombre
        raza {
          id
          nombre
        }
      }
    }
  }
`

export const GET_LACTANCIAS_ACTIVAS = gql`
  query GetLactanciasActivas($fincaId: ID!) {
    lactanciasActivas(fincaId: $fincaId) {
      id
      numeroLactancia
      fechaInicio
      diasProduccion
      totalLitros
      promedioDiario
      estado
      vaca {
        id
        nroArete
        nombre
        raza {
          id
          nombre
        }
      }
    }
  }
`

export const GET_PRODUCCIONES_LECHE = gql`
  query GetProduccionesLeche($fincaId: ID!) {
    produccionesLeche(fincaId: $fincaId) {
      id
      fecha
      turno
      litros
      diasEnLactancia
      observaciones
      vaca {
        id
        nroArete
        nombre
      }
      lactancia {
        id
        numeroLactancia
      }
    }
  }
`

export const GET_PRODUCCIONES_HOY = gql`
  query GetProduccionesHoy($fincaId: ID!) {
    produccionesHoy(fincaId: $fincaId) {
      id
      fecha
      turno
      litros
      observaciones
      vaca {
        id
        nroArete
        nombre
      }
    }
  }
`

export const GET_REGISTROS_PESO = gql`
  query GetRegistrosPeso($fincaId: ID!, $animalId: ID) {
    registrosPeso(fincaId: $fincaId, animalId: $animalId) {
      id
      fechaPesaje
      pesoKg
      gananciaDiaria
      condicionCorporal
      observacion
      animal {
        id
        nroArete
        nombre
      }
    }
  }
`

export const GET_PRODUCCION_TOTAL_HOY = gql`
  query GetProduccionTotalHoy($fincaId: ID!) {
    produccionTotalHoy(fincaId: $fincaId)
  }
`

export const GET_TOP_5_VACAS_PRODUCCION = gql`
  query GetTop5VacasProduccion($fincaId: ID!) {
    top5VacasProduccion(fincaId: $fincaId) {
      id
      litros
      turno
      fecha
      vaca {
        id
        nroArete
        nombre
      }
    }
  }
`

export const GET_PRODUCCION_POR_ANIMAL = gql`
  query GetProduccionLechePorAnimal($animalId: ID!) {
    produccionLechePorAnimal(animalId: $animalId) {
      id
      fecha
      turno
      litros
      diasEnLactancia
      lactancia {
        id
        numeroLactancia
      }
    }
  }
`

export const GET_PRODUCCION_POR_ANIO = gql`
  query GetProduccionLechePorAnio($anio: Int!) {
    produccionLechePorAnio(anio: $anio) {
      id
      fecha
      turno
      litros
      vaca {
        id
        nroArete
        nombre
      }
    }
  }
`

export const GET_ALIMENTACIONES_ANIMALES = gql`
  query GetAlimentacionesAnimales($fincaId: ID!) {
    alimentacionesAnimales(fincaId: $fincaId) {
      id
      cantidad
      fechaAlimentacion
      observaciones
      animal {
        id
        nroArete
        nombre
      }
      alimento {
        id
        nombre
      }
    }
  }
`

// ==========================================
// MUTATIONS - LACTANCIA
// ==========================================

export const CREATE_LACTANCIA = gql`
  mutation CrearLactancia(
    $fincaId: ID!
    $vacaId: ID!
    $fechaInicio: Date!
    $numeroLactancia: Int!
    $reproduccionId: ID
    $observaciones: String
  ) {
    crearLactancia(
      fincaId: $fincaId
      vacaId: $vacaId
      fechaInicio: $fechaInicio
      numeroLactancia: $numeroLactancia
      reproduccionId: $reproduccionId
      observaciones: $observaciones
    ) {
      lactancia {
        id
        numeroLactancia
        fechaInicio
      }
      success
      message
    }
  }
`

export const SECAR_LACTANCIA = gql`
  mutation SecarLactancia($id: ID!, $fechaSecado: Date!) {
    secarLactancia(id: $id, fechaSecado: $fechaSecado) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - PRODUCCION LECHE
// ==========================================

export const CREATE_PRODUCCION_LECHE = gql`
  mutation CrearProduccionLeche(
    $fincaId: ID!
    $vacaId: ID!
    $turno: String!
    $litros: Decimal!
    $observaciones: String
  ) {
    crearProduccionLeche(
      fincaId: $fincaId
      vacaId: $vacaId
      turno: $turno
      litros: $litros
      observaciones: $observaciones
    ) {
      produccion {
        id
        litros
        fecha
        turno
      }
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - REGISTRO PESO
// ==========================================

export const CREATE_REGISTRO_PESO = gql`
  mutation CrearRegistroPeso(
    $fincaId: ID!
    $animalId: ID!
    $pesoKg: Decimal!
    $fechaPesaje: Date!
    $condicionCorporal: Decimal
    $observacion: String
  ) {
    crearRegistroPeso(
      fincaId: $fincaId
      animalId: $animalId
      pesoKg: $pesoKg
      fechaPesaje: $fechaPesaje
      condicionCorporal: $condicionCorporal
      observacion: $observacion
    ) {
      registro {
        id
        pesoKg
        fechaPesaje
      }
      success
      message
    }
  }
`