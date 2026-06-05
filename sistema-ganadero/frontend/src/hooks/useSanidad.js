// frontend/src/hooks/useSanidad.js
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_TRATAMIENTOS,
  GET_TRATAMIENTOS_ACTIVOS,
  GET_DESPARASITACIONES,
  GET_DIAGNOSTICOS,
  GET_OBSERVACIONES,
  GET_VACUNAS_PROXIMAS,
  CREATE_TRATAMIENTO,
  FINALIZAR_TRATAMIENTO,
  CREATE_DESPARASITACION,
  CREATE_DIAGNOSTICO,
  CREATE_OBSERVACION,
} from '../graphql/sanidad'

export const useSanidad = () => {
  const fincaId = localStorage.getItem('fincaId') || '1'

  // Queries
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

  // Mutations
  const [crearTratamientoMutation] = useMutation(CREATE_TRATAMIENTO)
  const [finalizarTratamientoMutation] = useMutation(FINALIZAR_TRATAMIENTO)
  const [crearDesparasitacionMutation] = useMutation(CREATE_DESPARASITACION)
  const [crearDiagnosticoMutation] = useMutation(CREATE_DIAGNOSTICO)
  const [crearObservacionMutation] = useMutation(CREATE_OBSERVACION)

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

  return {
    // Data
    tratamientos: tratamientos?.tratamientos || [],
    tratamientosActivos: tratamientosActivos?.tratamientosActivos || [],
    desparasitaciones: desparasitaciones?.desparasitaciones || [],
    diagnosticos: diagnosticos?.diagnosticos || [],
    observaciones: observaciones?.observacionesSanitarias || [],
    vacunasProximas: vacunasProximas?.vacunasProximas || [],

    // Loading
    loading: loadingTratamientos || loadingActivos || loadingDesparasitaciones || loadingDiagnosticos || loadingObservaciones,

    // Functions
    crearTratamiento,
    finalizarTratamiento,
    crearDesparasitacion,
    crearDiagnostico,
    crearObservacion,

    // Refetch
    refetchTratamientos,
    refetchDesparasitaciones,
    refetchDiagnosticos,
    refetchObservaciones,
    refetchVacunas,
  }
}