// frontend/src/graphql/reproduccion.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_INSEMINACIONES = gql`
  query GetInseminaciones($fincaId: ID) {
    inseminaciones(fincaId: $fincaId) {
      id
      fecha
      fechaProbableParto
      numeroServicio
      numeroPajuela
      tecnicoInseminador
      resultado
      observaciones
      hembra {
        id
        nombre
        nroArete
      }
      reproductor {
        id
        codigo
        nombre
        tipoOrigen
      }
    }
  }
`

export const GET_MONTAS_NATURALES = gql`
  query GetMontasNaturales($fincaId: ID) {
    montasNaturales(fincaId: $fincaId) {
      id
      fecha
      fechaProbableParto
      numeroServicio
      resultado
      observaciones
      hembra {
        id
        nombre
        nroArete
      }
      reproductor {
        id
        codigo
        nombre
        tipoOrigen
      }
    }
  }
`

export const GET_DIAGNOSTICOS_PRENEZ = gql`
  query GetDiagnosticosPrenez($fincaId: ID) {
    diagnosticosPrenez(fincaId: $fincaId) {
      id
      fecha
      resultadoPrenez
      diasGestacion
      metodo
      hembra {
        id
        nombre
        nroArete
      }
    }
  }
`

export const GET_REPRODUCCIONES = gql`
  query GetReproducciones($fincaId: ID) {
    reproducciones(fincaId: $fincaId) {
      id
      fechaServicio
      fechaPartoEsperado
      fechaPartoReal
      tipoParto
      numCrias
      estado
      observaciones
      madre {
        id
        nombre
        nroArete
      }
      padre {
        id
        nombre
        nroArete
      }
      inseminacion {
        id
        fecha
        reproductor {
          id
          codigo
          nombre
          tipoOrigen
        }
      }
      monta {
        id
        fecha
        reproductor {
          id
          codigo
          nombre
          tipoOrigen
        }
      }
      crias {
        id
        nroArete
        nombre
        sexo
        origen
        fechaNacimiento
      }
    }
  }
`

export const GET_VACAS_PREÑADAS = gql`
  query GetVacasPrenadas($fincaId: ID) {
    vacasPrenadas(fincaId: $fincaId) {
      id
      fechaServicio
      fechaPartoEsperado
      madre {
        id
        nombre
        nroArete
      }
    }
  }
`

export const GET_PROXIMOS_PARTOS = gql`
  query GetProximosPartos($dias: Int, $fincaId: ID) {
    proximosPartos(dias: $dias, fincaId: $fincaId) {
      id
      fechaPartoEsperado
      estado
      madre {
        id
        nombre
        nroArete
      }
    }
  }
`

// ==========================================
// MUTATIONS
// ==========================================

export const CREATE_INSEMINACION = gql`
  mutation CrearInseminacionArtificial(
    $fincaId: ID!
    $hembraId: ID!
    $fecha: Date!
    $reproductorId: ID
    $numeroServicio: Int
    $numeroPajuela: String
    $tecnicoInseminador: String
    $observaciones: String
  ) {
    crearInseminacionArtificial(
      fincaId: $fincaId
      hembraId: $hembraId
      fecha: $fecha
      reproductorId: $reproductorId
      numeroServicio: $numeroServicio
      numeroPajuela: $numeroPajuela
      tecnicoInseminador: $tecnicoInseminador
      observaciones: $observaciones
    ) {
      inseminacion {
        id
        fecha
        hembra {
          nombre
        }
      }
      success
      message
    }
  }
`

export const CREATE_DIAGNOSTICO_PRENEZ = gql`
  mutation CrearDiagnosticoPrenez(
    $fincaId: ID!
    $hembraId: ID!
    $fecha: Date!
    $resultadoPrenez: String!
    $diasGestacion: Int
    $metodo: String
  ) {
    crearDiagnosticoPrenez(
      fincaId: $fincaId
      hembraId: $hembraId
      fecha: $fecha
      resultadoPrenez: $resultadoPrenez
      diasGestacion: $diasGestacion
      metodo: $metodo
    ) {
      diagnostico {
        id
        resultadoPrenez
      }
      success
      message
    }
  }
`

export const CREATE_REPRODUCCION = gql`
  mutation CrearReproduccion(
    $fincaId: ID!
    $madreId: ID!
    $fechaServicio: Date
    $fechaPartoReal: Date
    $tipoParto: String
    $numCrias: Int
    $estado: String
    $observaciones: String
  ) {
    crearReproduccion(
      fincaId: $fincaId
      madreId: $madreId
      fechaServicio: $fechaServicio
      fechaPartoReal: $fechaPartoReal
      tipoParto: $tipoParto
      numCrias: $numCrias
      estado: $estado
      observaciones: $observaciones
    ) {
      reproduccion {
        id
        estado
      }
      success
      message
    }
  }
`

export const REGISTRAR_PARTO_CON_CRIAS = gql`
  mutation RegistrarPartoConCrias(
    $fincaId: ID!
    $madreId: ID!
    $inseminacionId: ID
    $montaId: ID
    $padreId: ID
    $fechaPartoEsperado: Date
    $fechaPartoReal: Date!
    $tipoParto: String
    $numCrias: Int
    $observaciones: String
    $crearLactancia: Boolean
    $crias: [CriaInput]
  ) {
    registrarPartoConCrias(
      fincaId: $fincaId
      madreId: $madreId
      inseminacionId: $inseminacionId
      montaId: $montaId
      padreId: $padreId
      fechaPartoEsperado: $fechaPartoEsperado
      fechaPartoReal: $fechaPartoReal
      tipoParto: $tipoParto
      numCrias: $numCrias
      observaciones: $observaciones
      crearLactancia: $crearLactancia
      crias: $crias
    ) {
      reproduccion {
        id
        fechaPartoReal
        tipoParto
        numCrias
        estado
        madre {
          id
          nroArete
          nombre
        }
        padre {
          id
          nroArete
          nombre
        }
        crias {
          id
          nroArete
          nombre
          sexo
          origen
          fechaNacimiento
        }
      }
      success
      message
    }
  }
`
