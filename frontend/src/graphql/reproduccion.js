// frontend/src/graphql/reproduccion.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES EXISTENTES
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
        madre {
          id
          nroArete
          nombre
        }
      }
    }
  }
`

export const GET_VACAS_PRENADAS = gql`
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
// NUEVAS QUERIES
// ==========================================

export const GET_CELOS = gql`
  query GetCelos($fincaId: ID, $hembraId: ID) {
    celos(fincaId: $fincaId, hembraId: $hembraId) {
      id
      fechaInicio
      fechaFin
      tipo
      intensidad
      detectadoPor
      observaciones
      hembra {
        id
        nroArete
        nombre
      }
      duracionHoras
      createdAt
    }
  }
`

export const GET_PALPACIONES = gql`
  query GetPalpaciones($fincaId: ID) {
    palpaciones(fincaId: $fincaId) {
      id
      fecha
      resultado
      diasGestacionEstimados
      observaciones
      hembra {
        id
        nroArete
        nombre
      }
      veterinario {
        id
        nombre
        apellidos
      }
      createdAt
    }
  }
`

export const GET_HEMBRAS_REPETIDORAS = gql`
  query GetHembrasRepetidoras($fincaId: ID) {
    hembrasRepetidoras(fincaId: $fincaId) {
      id
      animal {
        id
        nroArete
        nombre
      }
      numeroServicios
      fechaUltimoServicio
      evaluadaVeterinario
      causaPresunta
      descartada
      motivoDescarte
    }
  }
`

export const GET_ABORTOS_DETALLADOS = gql`
  query GetAbortosDetallados($fincaId: ID) {
    abortosDetallados(fincaId: $fincaId) {
      id
      causa
      descripcion
      estadoFeto
      semanasGestacion
      tratamientoAplicado
      medidasPreventivas
      costoAsociado
      reproduccion {
        id
        madre {
          id
          nroArete
          nombre
        }
        fechaPartoReal
      }
      createdAt
    }
  }
`

export const GET_DESTETES = gql`
  query GetDestetes($fincaId: ID) {
    destetes(fincaId: $fincaId) {
      id
      fechaDestete
      tipo
      edadDesteteDias
      pesoCria
      estadoCria
      observaciones
      madre {
        id
        nroArete
        nombre
      }
      cria {
        id
        nroArete
        nombre
      }
      createdAt
    }
  }
`

export const GET_DIAS_ABIERTOS = gql`
  query GetDiasAbiertos($hembraId: ID!) {
    diasAbiertos(hembraId: $hembraId)
  }
`

// ==========================================
// MUTATIONS EXISTENTES
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

// ==========================================
// NUEVAS MUTATIONS - CREAR
// ==========================================

export const CREATE_CELO = gql`
  mutation CrearCelo(
    $fincaId: ID!
    $hembraId: ID!
    $fechaInicio: Date!
    $fechaFin: Date
    $tipo: String
    $intensidad: String
    $detectadoPor: String
    $observaciones: String
  ) {
    crearCelo(
      fincaId: $fincaId
      hembraId: $hembraId
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      tipo: $tipo
      intensidad: $intensidad
      detectadoPor: $detectadoPor
      observaciones: $observaciones
    ) {
      celo {
        id
        fechaInicio
        hembra {
          nroArete
        }
      }
      success
      message
    }
  }
`

export const CREATE_PALPACION = gql`
  mutation CrearPalpacion(
    $fincaId: ID!
    $hembraId: ID!
    $fecha: Date!
    $resultado: String!
    $diasGestacionEstimados: Int
    $observaciones: String
    $veterinarioId: ID
  ) {
    crearPalpacion(
      fincaId: $fincaId
      hembraId: $hembraId
      fecha: $fecha
      resultado: $resultado
      diasGestacionEstimados: $diasGestacionEstimados
      observaciones: $observaciones
      veterinarioId: $veterinarioId
    ) {
      palpacion {
        id
        resultado
        hembra {
          nroArete
        }
      }
      success
      message
    }
  }
`

export const CREATE_HEMBRA_REPETIDORA = gql`
  mutation CrearHembraRepetidora(
    $animalId: ID!
    $numeroServicios: Int
    $causaPresunta: String
  ) {
    crearHembraRepetidora(
      animalId: $animalId
      numeroServicios: $numeroServicios
      causaPresunta: $causaPresunta
    ) {
      hembraRepetidora {
        id
        animal {
          nroArete
        }
        numeroServicios
      }
      success
      message
    }
  }
`

export const CREATE_ABORTO_DETALLADO = gql`
  mutation CrearAbortoDetallado(
    $reproduccionId: ID!
    $causa: String!
    $descripcion: String!
    $semanasGestacion: Int!
    $estadoFeto: String
    $tratamientoAplicado: String
    $medidasPreventivas: String
    $costoAsociado: Float
  ) {
    crearAbortoDetallado(
      reproduccionId: $reproduccionId
      causa: $causa
      descripcion: $descripcion
      semanasGestacion: $semanasGestacion
      estadoFeto: $estadoFeto
      tratamientoAplicado: $tratamientoAplicado
      medidasPreventivas: $medidasPreventivas
      costoAsociado: $costoAsociado
    ) {
      aborto {
        id
        causa
        semanasGestacion
      }
      success
      message
    }
  }
`

export const CREATE_DESTETE = gql`
  mutation CrearDestete(
    $fincaId: ID!
    $madreId: ID!
    $criaId: ID!
    $fechaDestete: Date!
    $tipo: String
    $edadDesteteDias: Int!
    $pesoCria: Float
    $estadoCria: String
    $observaciones: String
  ) {
    crearDestete(
      fincaId: $fincaId
      madreId: $madreId
      criaId: $criaId
      fechaDestete: $fechaDestete
      tipo: $tipo
      edadDesteteDias: $edadDesteteDias
      pesoCria: $pesoCria
      estadoCria: $estadoCria
      observaciones: $observaciones
    ) {
      destete {
        id
        fechaDestete
        cria {
          nroArete
        }
      }
      success
      message
    }
  }
`

// ==========================================
// NUEVAS MUTATIONS - ACTUALIZAR Y ELIMINAR
// ==========================================

// CELOS
export const UPDATE_CELO = gql`
  mutation ActualizarCelo(
    $id: ID!
    $fechaInicio: Date
    $fechaFin: Date
    $tipo: String
    $intensidad: String
    $detectadoPor: String
    $observaciones: String
  ) {
    actualizarCelo(
      id: $id
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      tipo: $tipo
      intensidad: $intensidad
      detectadoPor: $detectadoPor
      observaciones: $observaciones
    ) {
      celo {
        id
        fechaInicio
        hembra {
          nroArete
        }
      }
      success
      message
    }
  }
`

export const DELETE_CELO = gql`
  mutation EliminarCelo($id: ID!) {
    eliminarCelo(id: $id) {
      success
      message
    }
  }
`

// PALPACIONES
export const UPDATE_PALPACION = gql`
  mutation ActualizarPalpacion(
    $id: ID!
    $fecha: Date
    $resultado: String
    $diasGestacionEstimados: Int
    $observaciones: String
    $veterinarioId: ID
  ) {
    actualizarPalpacion(
      id: $id
      fecha: $fecha
      resultado: $resultado
      diasGestacionEstimados: $diasGestacionEstimados
      observaciones: $observaciones
      veterinarioId: $veterinarioId
    ) {
      palpacion {
        id
        resultado
        hembra {
          nroArete
        }
      }
      success
      message
    }
  }
`

export const DELETE_PALPACION = gql`
  mutation EliminarPalpacion($id: ID!) {
    eliminarPalpacion(id: $id) {
      success
      message
    }
  }
`

// DESTETES
export const UPDATE_DESTETE = gql`
  mutation ActualizarDestete(
    $id: ID!
    $fechaDestete: Date
    $tipo: String
    $edadDesteteDias: Int
    $pesoCria: Float
    $estadoCria: String
    $observaciones: String
  ) {
    actualizarDestete(
      id: $id
      fechaDestete: $fechaDestete
      tipo: $tipo
      edadDesteteDias: $edadDesteteDias
      pesoCria: $pesoCria
      estadoCria: $estadoCria
      observaciones: $observaciones
    ) {
      destete {
        id
        fechaDestete
        cria {
          nroArete
        }
      }
      success
      message
    }
  }
`

export const DELETE_DESTETE = gql`
  mutation EliminarDestete($id: ID!) {
    eliminarDestete(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// INPUT TYPES
// ==========================================

export const CRIA_INPUT = gql`
  input CriaInput {
    nroArete: String!
    nombre: String
    sexo: String!
    razaId: ID
    categoriaId: ID
    pesoNacimiento: Float
    color: String
    observaciones: String
  }
`