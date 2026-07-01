// frontend/src/graphql/sanidad.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES EXISTENTES
// ==========================================

export const GET_TRATAMIENTOS = gql`
  query GetTratamientos($fincaId: ID!, $animalId: ID) {
    tratamientos(fincaId: $fincaId, animalId: $animalId) {
      id
      fecha
      fechaInicio
      fechaFin
      diagnostico
      tipo
      dosis
      costoTotal
      enTratamiento
      observaciones
      animal {
        id
        nroArete
        nombre
      }
      medicamento {
        id
        nombre
      }
      veterinario {
        id
        nombre
        apellidos
      }
      enfermedad {
        id
        nombre
      }
    }
  }
`

export const GET_TRATAMIENTOS_ACTIVOS = gql`
  query GetTratamientosActivos($fincaId: ID!) {
    tratamientosActivos(fincaId: $fincaId) {
      id
      fecha
      fechaInicio
      diagnostico
      enTratamiento
      diasActivo
      costoTotal
      nombreMedicamento
      animal {
        id
        nroArete
        nombre
      }
      medicamento {
        id
        nombre
      }
    }
  }
`

// ==========================================
// DASHBOARD INTERNO Y CALENDARIO SANITARIO
// ==========================================

export const GET_RESUMEN_SANIDAD = gql`
  query GetResumenSanidad($fincaId: ID!) {
    resumenSanidad(fincaId: $fincaId) {
      tratamientosActivos
      vacunasProximas
      vacunasVencidas
      desparasitacionesProximas
      desparasitacionesVencidas
      mastitisActivas
      examenesPendientes
      animalesEnRetiro
    }
  }
`

export const GET_CALENDARIO_SANITARIO = gql`
  query GetCalendarioSanitario($fincaId: ID!, $dias: Int) {
    calendarioSanitario(fincaId: $fincaId, dias: $dias) {
      referenciaTipo
      referenciaId
      fecha
      animalId
      animal
      tipoEvento
      estado
      prioridad
      accionRecomendada
    }
  }
`

export const GET_DESPARASITACIONES = gql`
  query GetDesparasitaciones($fincaId: ID!, $animalId: ID) {
    desparasitaciones(fincaId: $fincaId, animalId: $animalId) {
      id
      fecha
      tipoParasiticida
      producto
      dosis
      pesoAplicacion
      lote
      fechaProxima
      observaciones
      animal {
        id
        nroArete
        nombre
      }
      veterinario {
        id
        nombre
        apellidos
      }
    }
  }
`

export const GET_DIAGNOSTICOS = gql`
  query GetDiagnosticos($fincaId: ID!, $animalId: ID) {
    diagnosticos(fincaId: $fincaId, animalId: $animalId) {
      id
      fecha
      descripcion
      animal {
        id
        nroArete
        nombre
      }
      veterinario {
        id
        nombre
        apellidos
      }
      enfermedad {
        id
        nombre
      }
    }
  }
`

export const GET_OBSERVACIONES = gql`
  query GetObservacionesSanitarias($fincaId: ID!, $animalId: ID) {
    observacionesSanitarias(fincaId: $fincaId, animalId: $animalId) {
      id
      fecha
      descripcion
      animal {
        id
        nroArete
        nombre
      }
    }
  }
`

export const GET_VACUNAS_PROXIMAS = gql`
  query GetVacunasProximas($dias: Int) {
    vacunasProximas(dias: $dias) {
      id
      fechaAplicacion
      fechaProxima
      campana
      nombreVacuna
      animal {
        id
        nroArete
        nombre
      }
    }
  }
`

// ==========================================
// NUEVAS QUERIES
// ==========================================

export const GET_ENFERMEDADES = gql`
  query GetEnfermedades {
    enfermedades {
      id
      nombre
      categoria
      sintomas
      causa
      tratamientoRecomendado
      tiempoRecuperacionDias
      esZoonotica
      mortalidadPorcentaje
    }
  }
`

export const GET_EXAMENES_LABORATORIO = gql`
  query GetExamenesLaboratorio($fincaId: ID!, $animalId: ID) {
    examenesLaboratorio(fincaId: $fincaId, animalId: $animalId) {
      id
      tipoExamen
      laboratorio
      fechaToma
      fechaResultado
      resultado
      esNormal
      observaciones
      animal {
        id
        nroArete
        nombre
      }
    }
  }
`

export const GET_REGISTROS_MASTITIS = gql`
  query GetRegistrosMastitis($fincaId: ID!, $animalId: ID) {
    registrosMastitis(fincaId: $fincaId, animalId: $animalId) {
      id
      fecha
      cuartoAfectado
      tipo
      bacteria
      recuentoCelsSomaticas
      seCuro
      fechaCuracion
      observaciones
      animal {
        id
        nroArete
        nombre
      }
      tratamiento {
        id
        diagnostico
      }
    }
  }
`

export const GET_TIEMPOS_RETIRO = gql`
  query GetTiemposRetiro($fincaId: ID!, $animalId: ID, $activos: Boolean) {
    tiemposRetiro(fincaId: $fincaId, animalId: $animalId, activos: $activos) {
      id
      tipoRetiro
      fechaInicio
      fechaFin
      diasRetiro
      diasRestantes
      estaEnRetiro
      activo
      observaciones
      animal {
        id
        nroArete
        nombre
      }
      tratamiento {
        id
        diagnostico
      }
    }
  }
`

export const GET_ANIMALES_EN_RETIRO = gql`
  query GetAnimalesEnRetiro($fincaId: ID!) {
    animalesEnRetiro(fincaId: $fincaId) {
      id
      tipoRetiro
      fechaInicio
      fechaFin
      diasRestantes
      animal {
        id
        nroArete
        nombre
      }
    }
  }
`

// ==========================================
// MUTATIONS EXISTENTES
// ==========================================

export const CREATE_TRATAMIENTO = gql`
  mutation CrearTratamiento(
    $fincaId: ID!
    $animalId: ID!
    $fecha: Date!
    $diagnostico: String
    $tipo: String
    $dosis: String
    $costoTotal: Decimal
    $medicamentoId: ID
    $enfermedadId: ID
  ) {
    crearTratamiento(
      fincaId: $fincaId
      animalId: $animalId
      fecha: $fecha
      diagnostico: $diagnostico
      tipo: $tipo
      dosis: $dosis
      costoTotal: $costoTotal
      medicamentoId: $medicamentoId
      enfermedadId: $enfermedadId
    ) {
      tratamiento {
        id
        diagnostico
      }
      success
      message
    }
  }
`

export const FINALIZAR_TRATAMIENTO = gql`
  mutation FinalizarTratamiento($id: ID!, $fechaFin: Date!) {
    finalizarTratamiento(id: $id, fechaFin: $fechaFin) {
      success
      message
    }
  }
`

export const CREATE_DESPARASITACION = gql`
  mutation CrearDesparasitacion(
    $fincaId: ID!
    $animalId: ID!
    $fecha: Date!
    $tipoParasiticida: String!
    $producto: String!
    $dosis: String!
    $pesoAplicacion: Decimal
    $lote: String
    $fechaProxima: Date
    $observaciones: String
    $veterinarioId: ID
  ) {
    crearDesparasitacion(
      fincaId: $fincaId
      animalId: $animalId
      fecha: $fecha
      tipoParasiticida: $tipoParasiticida
      producto: $producto
      dosis: $dosis
      pesoAplicacion: $pesoAplicacion
      lote: $lote
      fechaProxima: $fechaProxima
      observaciones: $observaciones
      veterinarioId: $veterinarioId
    ) {
      desparasitacion {
        id
        producto
      }
      success
      message
    }
  }
`

export const CREATE_DIAGNOSTICO = gql`
  mutation CrearDiagnostico(
    $fincaId: ID!
    $animalId: ID!
    $fecha: Date!
    $descripcion: String!
    $veterinarioId: ID
    $enfermedadId: ID
  ) {
    crearDiagnostico(
      fincaId: $fincaId
      animalId: $animalId
      fecha: $fecha
      descripcion: $descripcion
      veterinarioId: $veterinarioId
      enfermedadId: $enfermedadId
    ) {
      diagnostico {
        id
        descripcion
      }
      success
      message
    }
  }
`

export const CREATE_OBSERVACION = gql`
  mutation CrearObservacion(
    $fincaId: ID!
    $animalId: ID!
    $fecha: Date!
    $descripcion: String!
  ) {
    crearObservacion(
      fincaId: $fincaId
      animalId: $animalId
      fecha: $fecha
      descripcion: $descripcion
    ) {
      observacion {
        id
        descripcion
      }
      success
      message
    }
  }
`

// ==========================================
// NUEVAS MUTATIONS
// ==========================================

export const CREATE_ENFERMEDAD = gql`
  mutation CrearEnfermedad(
    $nombre: String!
    $categoria: String!
    $sintomas: String!
    $causa: String
    $tratamientoRecomendado: String
    $tiempoRecuperacionDias: Int
    $esZoonotica: Boolean
    $mortalidadPorcentaje: Decimal
  ) {
    crearEnfermedad(
      nombre: $nombre
      categoria: $categoria
      sintomas: $sintomas
      causa: $causa
      tratamientoRecomendado: $tratamientoRecomendado
      tiempoRecuperacionDias: $tiempoRecuperacionDias
      esZoonotica: $esZoonotica
      mortalidadPorcentaje: $mortalidadPorcentaje
    ) {
      enfermedad {
        id
        nombre
      }
      success
      message
    }
  }
`

export const CREATE_EXAMEN_LABORATORIO = gql`
  mutation CrearExamenLaboratorio(
    $fincaId: ID!
    $animalId: ID!
    $tipoExamen: String!
    $laboratorio: String!
    $fechaToma: Date!
    $resultado: String!
    $esNormal: Boolean
    $observaciones: String
    $fechaResultado: Date
  ) {
    crearExamenLaboratorio(
      fincaId: $fincaId
      animalId: $animalId
      tipoExamen: $tipoExamen
      laboratorio: $laboratorio
      fechaToma: $fechaToma
      resultado: $resultado
      esNormal: $esNormal
      observaciones: $observaciones
      fechaResultado: $fechaResultado
    ) {
      examen {
        id
        tipoExamen
      }
      success
      message
    }
  }
`

export const CREATE_REGISTRO_MASTITIS = gql`
  mutation CrearRegistroMastitis(
    $fincaId: ID!
    $animalId: ID!
    $fecha: Date!
    $cuartoAfectado: String!
    $tipo: String!
    $bacteria: String
    $recuentoCelsSomaticas: Int
    $tratamientoId: ID
    $observaciones: String
  ) {
    crearRegistroMastitis(
      fincaId: $fincaId
      animalId: $animalId
      fecha: $fecha
      cuartoAfectado: $cuartoAfectado
      tipo: $tipo
      bacteria: $bacteria
      recuentoCelsSomaticas: $recuentoCelsSomaticas
      tratamientoId: $tratamientoId
      observaciones: $observaciones
    ) {
      registro {
        id
        tipo
      }
      success
      message
    }
  }
`

export const CURAR_MASTITIS = gql`
  mutation CurarMastitis($id: ID!, $fechaCuracion: Date!) {
    curarMastitis(id: $id, fechaCuracion: $fechaCuracion) {
      success
      message
    }
  }
`

export const CREATE_TIEMPO_RETIRO = gql`
  mutation CrearTiempoRetiro(
    $tratamientoId: ID!
    $tipoRetiro: String!
    $fechaInicio: Date!
    $diasRetiro: Int!
  ) {
    crearTiempoRetiro(
      tratamientoId: $tratamientoId
      tipoRetiro: $tipoRetiro
      fechaInicio: $fechaInicio
      diasRetiro: $diasRetiro
    ) {
      tiempoRetiro {
        id
        tipoRetiro
        fechaInicio
        fechaFin
        diasRetiro
      }
      success
      message
    }
  }
`

export const FINALIZAR_TIEMPO_RETIRO = gql`
  mutation FinalizarTiempoRetiro($id: ID!) {
    finalizarTiempoRetiro(id: $id) {
      success
      message
    }
  }
`
// ==========================================
// MUTATIONS DE ACTUALIZACIÓN Y ELIMINACIÓN
// ==========================================

// ===== TRATAMIENTOS =====
export const UPDATE_TRATAMIENTO = gql`
  mutation ActualizarTratamiento(
    $id: ID!
    $diagnostico: String
    $tipo: String
    $dosis: String
    $costoTotal: Decimal
    $observaciones: String
    $enfermedadId: ID
  ) {
    actualizarTratamiento(
      id: $id
      diagnostico: $diagnostico
      tipo: $tipo
      dosis: $dosis
      costoTotal: $costoTotal
      observaciones: $observaciones
      enfermedadId: $enfermedadId
    ) {
      tratamiento {
        id
        diagnostico
      }
      success
      message
    }
  }
`

export const DELETE_TRATAMIENTO = gql`
  mutation EliminarTratamiento($id: ID!) {
    eliminarTratamiento(id: $id) {
      success
      message
    }
  }
`

// ===== DESPARASITACIONES =====
export const UPDATE_DESPARASITACION = gql`
  mutation ActualizarDesparasitacion(
    $id: ID!
    $tipoParasiticida: String
    $producto: String
    $dosis: String
    $pesoAplicacion: Decimal
    $lote: String
    $fechaProxima: Date
    $observaciones: String
  ) {
    actualizarDesparasitacion(
      id: $id
      tipoParasiticida: $tipoParasiticida
      producto: $producto
      dosis: $dosis
      pesoAplicacion: $pesoAplicacion
      lote: $lote
      fechaProxima: $fechaProxima
      observaciones: $observaciones
    ) {
      desparasitacion {
        id
        producto
      }
      success
      message
    }
  }
`

export const DELETE_DESPARASITACION = gql`
  mutation EliminarDesparasitacion($id: ID!) {
    eliminarDesparasitacion(id: $id) {
      success
      message
    }
  }
`

// ===== DIAGNÓSTICOS =====
export const UPDATE_DIAGNOSTICO = gql`
  mutation ActualizarDiagnostico(
    $id: ID!
    $descripcion: String
    $enfermedadId: ID
  ) {
    actualizarDiagnostico(
      id: $id
      descripcion: $descripcion
      enfermedadId: $enfermedadId
    ) {
      diagnostico {
        id
        descripcion
      }
      success
      message
    }
  }
`

export const DELETE_DIAGNOSTICO = gql`
  mutation EliminarDiagnostico($id: ID!) {
    eliminarDiagnostico(id: $id) {
      success
      message
    }
  }
`

// ===== OBSERVACIONES =====
export const UPDATE_OBSERVACION = gql`
  mutation ActualizarObservacion(
    $id: ID!
    $descripcion: String
  ) {
    actualizarObservacion(
      id: $id
      descripcion: $descripcion
    ) {
      observacion {
        id
        descripcion
      }
      success
      message
    }
  }
`

export const DELETE_OBSERVACION = gql`
  mutation EliminarObservacion($id: ID!) {
    eliminarObservacion(id: $id) {
      success
      message
    }
  }
`

// ===== EXÁMENES LABORATORIO =====
export const UPDATE_EXAMEN_LABORATORIO = gql`
  mutation ActualizarExamenLaboratorio(
    $id: ID!
    $tipoExamen: String
    $laboratorio: String
    $fechaToma: Date
    $resultado: String
    $esNormal: Boolean
    $observaciones: String
    $fechaResultado: Date
  ) {
    actualizarExamenLaboratorio(
      id: $id
      tipoExamen: $tipoExamen
      laboratorio: $laboratorio
      fechaToma: $fechaToma
      resultado: $resultado
      esNormal: $esNormal
      observaciones: $observaciones
      fechaResultado: $fechaResultado
    ) {
      examen {
        id
        tipoExamen
      }
      success
      message
    }
  }
`

export const DELETE_EXAMEN_LABORATORIO = gql`
  mutation EliminarExamenLaboratorio($id: ID!) {
    eliminarExamenLaboratorio(id: $id) {
      success
      message
    }
  }
`

// ===== MASTITIS =====
export const UPDATE_REGISTRO_MASTITIS = gql`
  mutation ActualizarRegistroMastitis(
    $id: ID!
    $fecha: Date
    $cuartoAfectado: String
    $tipo: String
    $bacteria: String
    $recuentoCelsSomaticas: Int
    $observaciones: String
  ) {
    actualizarRegistroMastitis(
      id: $id
      fecha: $fecha
      cuartoAfectado: $cuartoAfectado
      tipo: $tipo
      bacteria: $bacteria
      recuentoCelsSomaticas: $recuentoCelsSomaticas
      observaciones: $observaciones
    ) {
      registro {
        id
        tipo
      }
      success
      message
    }
  }
`

export const DELETE_REGISTRO_MASTITIS = gql`
  mutation EliminarRegistroMastitis($id: ID!) {
    eliminarRegistroMastitis(id: $id) {
      success
      message
    }
  }
`

// ===== TIEMPO RETIRO =====
export const UPDATE_TIEMPO_RETIRO = gql`
  mutation ActualizarTiempoRetiro(
    $id: ID!
    $tipoRetiro: String
    $fechaInicio: Date
    $diasRetiro: Int
  ) {
    actualizarTiempoRetiro(
      id: $id
      tipoRetiro: $tipoRetiro
      fechaInicio: $fechaInicio
      diasRetiro: $diasRetiro
    ) {
      tiempoRetiro {
        id
        tipoRetiro
      }
      success
      message
    }
  }
`

export const DELETE_TIEMPO_RETIRO = gql`
  mutation EliminarTiempoRetiro($id: ID!) {
    eliminarTiempoRetiro(id: $id) {
      success
      message
    }
  }
`