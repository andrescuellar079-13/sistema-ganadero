// frontend/src/hooks/useSanidad.js
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_TRATAMIENTOS,
  GET_TRATAMIENTOS_ACTIVOS,
  GET_DESPARASITACIONES,
  GET_DIAGNOSTICOS,
  GET_OBSERVACIONES,
  GET_VACUNAS_PROXIMAS,
  GET_ENFERMEDADES,
  GET_EXAMENES_LABORATORIO,
  GET_REGISTROS_MASTITIS,
  GET_TIEMPOS_RETIRO,
  GET_ANIMALES_EN_RETIRO,
  CREATE_TRATAMIENTO,
  FINALIZAR_TRATAMIENTO,
  CREATE_DESPARASITACION,
  CREATE_DIAGNOSTICO,
  CREATE_OBSERVACION,
  CREATE_ENFERMEDAD,
  CREATE_EXAMEN_LABORATORIO,
  CREATE_REGISTRO_MASTITIS,
  CURAR_MASTITIS,
  CREATE_TIEMPO_RETIRO,
  FINALIZAR_TIEMPO_RETIRO,
  // NUEVAS MUTATIONS DE ACTUALIZACIÓN Y ELIMINACIÓN
  UPDATE_TRATAMIENTO,
  DELETE_TRATAMIENTO,
  UPDATE_DESPARASITACION,
  DELETE_DESPARASITACION,
  UPDATE_DIAGNOSTICO,
  DELETE_DIAGNOSTICO,
  UPDATE_OBSERVACION,
  DELETE_OBSERVACION,
  UPDATE_EXAMEN_LABORATORIO,
  DELETE_EXAMEN_LABORATORIO,
  UPDATE_REGISTRO_MASTITIS,
  DELETE_REGISTRO_MASTITIS,
  UPDATE_TIEMPO_RETIRO,
  DELETE_TIEMPO_RETIRO,
} from '../graphql/sanidad'

export const useSanidad = () => {
  const fincaId = localStorage.getItem('fincaId') || '1'

  // ==========================================
  // Queries Existentes
  // ==========================================
  
  const { data: tratamientos, loading: loadingTratamientos, refetch: refetchTratamientos } = useQuery(GET_TRATAMIENTOS, {
    variables: { fincaId }
  })

  const { data: tratamientosActivos, loading: loadingActivos, refetch: refetchActivos } = useQuery(GET_TRATAMIENTOS_ACTIVOS, {
    variables: { fincaId }
  })

  const { data: desparasitaciones, loading: loadingDesparasitaciones, refetch: refetchDesparasitaciones } = useQuery(GET_DESPARASITACIONES, {
    variables: { fincaId }
  })

  const { data: diagnosticos, loading: loadingDiagnosticos, refetch: refetchDiagnosticos } = useQuery(GET_DIAGNOSTICOS, {
    variables: { fincaId }
  })

  const { data: observaciones, loading: loadingObservaciones, refetch: refetchObservaciones } = useQuery(GET_OBSERVACIONES, {
    variables: { fincaId }
  })

  const { data: vacunasProximas, loading: loadingVacunas, refetch: refetchVacunas } = useQuery(GET_VACUNAS_PROXIMAS, {
    variables: { dias: 30 }
  })

  // ==========================================
  // Nuevas Queries
  // ==========================================

  const { data: enfermedades, loading: loadingEnfermedades, refetch: refetchEnfermedades } = useQuery(GET_ENFERMEDADES)

  const { data: examenesLaboratorio, loading: loadingExamenes, refetch: refetchExamenes } = useQuery(GET_EXAMENES_LABORATORIO, {
    variables: { fincaId }
  })

  const { data: registrosMastitis, loading: loadingMastitis, refetch: refetchMastitis } = useQuery(GET_REGISTROS_MASTITIS, {
    variables: { fincaId }
  })

  const { data: tiemposRetiro, loading: loadingTiemposRetiro, refetch: refetchTiemposRetiro } = useQuery(GET_TIEMPOS_RETIRO, {
    variables: { fincaId, activos: true }
  })

  const { data: animalesEnRetiro, loading: loadingAnimalesRetiro, refetch: refetchAnimalesRetiro } = useQuery(GET_ANIMALES_EN_RETIRO, {
    variables: { fincaId }
  })

  // ==========================================
  // Mutations de Creación Existentes
  // ==========================================

  const [crearTratamientoMutation] = useMutation(CREATE_TRATAMIENTO)
  const [finalizarTratamientoMutation] = useMutation(FINALIZAR_TRATAMIENTO)
  const [crearDesparasitacionMutation] = useMutation(CREATE_DESPARASITACION)
  const [crearDiagnosticoMutation] = useMutation(CREATE_DIAGNOSTICO)
  const [crearObservacionMutation] = useMutation(CREATE_OBSERVACION)

  // ==========================================
  // Nuevas Mutations de Creación
  // ==========================================

  const [crearEnfermedadMutation] = useMutation(CREATE_ENFERMEDAD)
  const [crearExamenLaboratorioMutation] = useMutation(CREATE_EXAMEN_LABORATORIO)
  const [crearRegistroMastitisMutation] = useMutation(CREATE_REGISTRO_MASTITIS)
  const [curarMastitisMutation] = useMutation(CURAR_MASTITIS)
  const [crearTiempoRetiroMutation] = useMutation(CREATE_TIEMPO_RETIRO)
  const [finalizarTiempoRetiroMutation] = useMutation(FINALIZAR_TIEMPO_RETIRO)

  // ==========================================
  // NUEVAS MUTATIONS DE ACTUALIZACIÓN Y ELIMINACIÓN
  // ==========================================

  // Tratamientos
  const [actualizarTratamientoMutation] = useMutation(UPDATE_TRATAMIENTO)
  const [eliminarTratamientoMutation] = useMutation(DELETE_TRATAMIENTO)

  // Desparasitaciones
  const [actualizarDesparasitacionMutation] = useMutation(UPDATE_DESPARASITACION)
  const [eliminarDesparasitacionMutation] = useMutation(DELETE_DESPARASITACION)

  // Diagnósticos
  const [actualizarDiagnosticoMutation] = useMutation(UPDATE_DIAGNOSTICO)
  const [eliminarDiagnosticoMutation] = useMutation(DELETE_DIAGNOSTICO)

  // Observaciones
  const [actualizarObservacionMutation] = useMutation(UPDATE_OBSERVACION)
  const [eliminarObservacionMutation] = useMutation(DELETE_OBSERVACION)

  // Exámenes de Laboratorio
  const [actualizarExamenLaboratorioMutation] = useMutation(UPDATE_EXAMEN_LABORATORIO)
  const [eliminarExamenLaboratorioMutation] = useMutation(DELETE_EXAMEN_LABORATORIO)

  // Mastitis
  const [actualizarRegistroMastitisMutation] = useMutation(UPDATE_REGISTRO_MASTITIS)
  const [eliminarRegistroMastitisMutation] = useMutation(DELETE_REGISTRO_MASTITIS)

  // Tiempo Retiro
  const [actualizarTiempoRetiroMutation] = useMutation(UPDATE_TIEMPO_RETIRO)
  const [eliminarTiempoRetiroMutation] = useMutation(DELETE_TIEMPO_RETIRO)

  // ==========================================
  // Funciones de Creación Existentes
  // ==========================================

  const crearTratamiento = async (variables) => {
    try {
      const { data } = await crearTratamientoMutation({
        variables: { fincaId, ...variables }
      })
      await refetchTratamientos()
      await refetchActivos()
      return { success: true, data: data?.crearTratamiento }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const finalizarTratamiento = async (id, fechaFin) => {
    try {
      const { data } = await finalizarTratamientoMutation({
        variables: { id, fechaFin }
      })
      await refetchTratamientos()
      await refetchActivos()
      return { success: true, data: data?.finalizarTratamiento }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const crearDesparasitacion = async (variables) => {
    try {
      const { data } = await crearDesparasitacionMutation({
        variables: { fincaId, ...variables }
      })
      await refetchDesparasitaciones()
      return { success: true, data: data?.crearDesparasitacion }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const crearDiagnostico = async (variables) => {
    try {
      const { data } = await crearDiagnosticoMutation({
        variables: { fincaId, ...variables }
      })
      await refetchDiagnosticos()
      return { success: true, data: data?.crearDiagnostico }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const crearObservacion = async (variables) => {
    try {
      const { data } = await crearObservacionMutation({
        variables: { fincaId, ...variables }
      })
      await refetchObservaciones()
      return { success: true, data: data?.crearObservacion }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // ==========================================
  // Nuevas Funciones de Creación
  // ==========================================

  const crearEnfermedad = async (variables) => {
    try {
      const { data } = await crearEnfermedadMutation({ variables })
      await refetchEnfermedades()
      return { success: true, data: data?.crearEnfermedad }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const crearExamenLaboratorio = async (variables) => {
    try {
      const { data } = await crearExamenLaboratorioMutation({
        variables: { fincaId, ...variables }
      })
      await refetchExamenes()
      return { success: true, data: data?.crearExamenLaboratorio }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const crearRegistroMastitis = async (variables) => {
    try {
      const { data } = await crearRegistroMastitisMutation({
        variables: { fincaId, ...variables }
      })
      await refetchMastitis()
      return { success: true, data: data?.crearRegistroMastitis }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const curarMastitis = async (id, fechaCuracion) => {
    try {
      const { data } = await curarMastitisMutation({
        variables: { id, fechaCuracion }
      })
      await refetchMastitis()
      return { success: true, data: data?.curarMastitis }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const crearTiempoRetiro = async (variables) => {
    try {
      const { data } = await crearTiempoRetiroMutation({ variables })
      await refetchTiemposRetiro()
      await refetchAnimalesRetiro()
      return { success: true, data: data?.crearTiempoRetiro }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const finalizarTiempoRetiro = async (id) => {
    try {
      const { data } = await finalizarTiempoRetiroMutation({
        variables: { id }
      })
      await refetchTiemposRetiro()
      await refetchAnimalesRetiro()
      return { success: true, data: data?.finalizarTiempoRetiro }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // ==========================================
  // NUEVAS FUNCIONES DE ACTUALIZACIÓN Y ELIMINACIÓN
  // ==========================================

  // === TRATAMIENTOS ===
  const actualizarTratamiento = async (id, variables) => {
    try {
      const { data } = await actualizarTratamientoMutation({
        variables: { id, ...variables }
      })
      await refetchTratamientos()
      await refetchActivos()
      return { success: true, data: data?.actualizarTratamiento }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarTratamiento = async (id) => {
    try {
      const { data } = await eliminarTratamientoMutation({
        variables: { id }
      })
      await refetchTratamientos()
      await refetchActivos()
      return { success: true, data: data?.eliminarTratamiento }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // === DESPARASITACIONES ===
  const actualizarDesparasitacion = async (id, variables) => {
    try {
      const { data } = await actualizarDesparasitacionMutation({
        variables: { id, ...variables }
      })
      await refetchDesparasitaciones()
      return { success: true, data: data?.actualizarDesparasitacion }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarDesparasitacion = async (id) => {
    try {
      const { data } = await eliminarDesparasitacionMutation({
        variables: { id }
      })
      await refetchDesparasitaciones()
      return { success: true, data: data?.eliminarDesparasitacion }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // === DIAGNÓSTICOS ===
  const actualizarDiagnostico = async (id, variables) => {
    try {
      const { data } = await actualizarDiagnosticoMutation({
        variables: { id, ...variables }
      })
      await refetchDiagnosticos()
      return { success: true, data: data?.actualizarDiagnostico }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarDiagnostico = async (id) => {
    try {
      const { data } = await eliminarDiagnosticoMutation({
        variables: { id }
      })
      await refetchDiagnosticos()
      return { success: true, data: data?.eliminarDiagnostico }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // === OBSERVACIONES ===
  const actualizarObservacion = async (id, variables) => {
    try {
      const { data } = await actualizarObservacionMutation({
        variables: { id, ...variables }
      })
      await refetchObservaciones()
      return { success: true, data: data?.actualizarObservacion }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarObservacion = async (id) => {
    try {
      const { data } = await eliminarObservacionMutation({
        variables: { id }
      })
      await refetchObservaciones()
      return { success: true, data: data?.eliminarObservacion }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // === EXÁMENES DE LABORATORIO ===
  const actualizarExamenLaboratorio = async (id, variables) => {
    try {
      const { data } = await actualizarExamenLaboratorioMutation({
        variables: { id, ...variables }
      })
      await refetchExamenes()
      return { success: true, data: data?.actualizarExamenLaboratorio }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarExamenLaboratorio = async (id) => {
    try {
      const { data } = await eliminarExamenLaboratorioMutation({
        variables: { id }
      })
      await refetchExamenes()
      return { success: true, data: data?.eliminarExamenLaboratorio }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // === MASTITIS ===
  const actualizarRegistroMastitis = async (id, variables) => {
    try {
      const { data } = await actualizarRegistroMastitisMutation({
        variables: { id, ...variables }
      })
      await refetchMastitis()
      return { success: true, data: data?.actualizarRegistroMastitis }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarRegistroMastitis = async (id) => {
    try {
      const { data } = await eliminarRegistroMastitisMutation({
        variables: { id }
      })
      await refetchMastitis()
      return { success: true, data: data?.eliminarRegistroMastitis }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // === TIEMPO RETIRO ===
  const actualizarTiempoRetiro = async (id, variables) => {
    try {
      const { data } = await actualizarTiempoRetiroMutation({
        variables: { id, ...variables }
      })
      await refetchTiemposRetiro()
      await refetchAnimalesRetiro()
      return { success: true, data: data?.actualizarTiempoRetiro }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarTiempoRetiro = async (id) => {
    try {
      const { data } = await eliminarTiempoRetiroMutation({
        variables: { id }
      })
      await refetchTiemposRetiro()
      await refetchAnimalesRetiro()
      return { success: true, data: data?.eliminarTiempoRetiro }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // ==========================================
  // RETURN
  // ==========================================

  return {
    // Datos existentes
    tratamientos: tratamientos?.tratamientos || [],
    tratamientosActivos: tratamientosActivos?.tratamientosActivos || [],
    desparasitaciones: desparasitaciones?.desparasitaciones || [],
    diagnosticos: diagnosticos?.diagnosticos || [],
    observaciones: observaciones?.observacionesSanitarias || [],
    vacunasProximas: vacunasProximas?.vacunasProximas || [],
    
    // Nuevos datos
    enfermedades: enfermedades?.enfermedades || [],
    examenesLaboratorio: examenesLaboratorio?.examenesLaboratorio || [],
    registrosMastitis: registrosMastitis?.registrosMastitis || [],
    tiemposRetiro: tiemposRetiro?.tiemposRetiro || [],
    animalesEnRetiro: animalesEnRetiro?.animalesEnRetiro || [],

    // Loading existentes
    loading: loadingTratamientos || loadingActivos || loadingDesparasitaciones || loadingDiagnosticos || loadingObservaciones,
    
    // Nuevos loading
    loadingEnfermedades,
    loadingExamenes,
    loadingMastitis,
    loadingTiemposRetiro,
    loadingAnimalesRetiro,

    // Funciones de creación existentes
    crearTratamiento,
    finalizarTratamiento,
    crearDesparasitacion,
    crearDiagnostico,
    crearObservacion,

    // Nuevas funciones de creación
    crearEnfermedad,
    crearExamenLaboratorio,
    crearRegistroMastitis,
    curarMastitis,
    crearTiempoRetiro,
    finalizarTiempoRetiro,

    // NUEVAS FUNCIONES DE ACTUALIZACIÓN Y ELIMINACIÓN
    actualizarTratamiento,
    eliminarTratamiento,
    actualizarDesparasitacion,
    eliminarDesparasitacion,
    actualizarDiagnostico,
    eliminarDiagnostico,
    actualizarObservacion,
    eliminarObservacion,
    actualizarExamenLaboratorio,
    eliminarExamenLaboratorio,
    actualizarRegistroMastitis,
    eliminarRegistroMastitis,
    actualizarTiempoRetiro,
    eliminarTiempoRetiro,

    // Refetch existentes
    refetchTratamientos,
    refetchDesparasitaciones,
    refetchDiagnosticos,
    refetchObservaciones,
    refetchVacunas,
    
    // Nuevos refetch
    refetchEnfermedades,
    refetchExamenes,
    refetchMastitis,
    refetchTiemposRetiro,
    refetchAnimalesRetiro,
  }
}