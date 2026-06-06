// frontend/src/hooks/useReproduccion.js
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_INSEMINACIONES,
  GET_MONTAS_NATURALES,
  GET_DIAGNOSTICOS_PRENEZ,
  GET_REPRODUCCIONES,
  GET_VACAS_PREÑADAS,
  GET_PROXIMOS_PARTOS,
  CREATE_INSEMINACION,
  CREATE_DIAGNOSTICO_PRENEZ,
  CREATE_REPRODUCCION,
  REGISTRAR_PARTO_CON_CRIAS,
} from '../graphql/reproduccion'

export const useReproduccion = () => {
  const fincaId = localStorage.getItem('fincaId') || '1'

  const { data: inseminacionesData, loading: loadingInseminaciones, refetch: refetchInseminaciones } =
    useQuery(GET_INSEMINACIONES, { variables: { fincaId } })

  const { data: montasData, loading: loadingMontas } =
    useQuery(GET_MONTAS_NATURALES, { variables: { fincaId } })

  const { data: diagnosticosData, loading: loadingDiagnosticos } =
    useQuery(GET_DIAGNOSTICOS_PRENEZ, { variables: { fincaId } })

  const { data: reproduccionesData, loading: loadingReproducciones, refetch: refetchReproducciones } =
    useQuery(GET_REPRODUCCIONES, { variables: { fincaId } })

  const { data: vacasPrenadasData, loading: loadingVacasPrenadas } =
    useQuery(GET_VACAS_PREÑADAS, { variables: { fincaId } })

  const { data: proximosPartosData, loading: loadingProximosPartos, refetch: refetchProximosPartos } =
    useQuery(GET_PROXIMOS_PARTOS, { variables: { dias: 30, fincaId } })

  // Mutations
  const [crearInseminacionMutation] = useMutation(CREATE_INSEMINACION)
  const [crearDiagnosticoMutation] = useMutation(CREATE_DIAGNOSTICO_PRENEZ)
  const [crearReproduccionMutation] = useMutation(CREATE_REPRODUCCION)
  const [registrarPartoConCriasMutation] = useMutation(REGISTRAR_PARTO_CON_CRIAS)

  const crearInseminacion = async (variables) => {
    try {
      const { data } = await crearInseminacionMutation({
        variables: { fincaId, ...variables }
      })
      await refetchInseminaciones()
      return { success: true, data: data?.crearInseminacionArtificial }
    } catch (error) {
      console.error('Error al crear inseminación:', error)
      return { success: false, error: error.message }
    }
  }

  const crearDiagnostico = async (variables) => {
    try {
      const { data } = await crearDiagnosticoMutation({
        variables: { fincaId, ...variables }
      })
      return { success: true, data: data?.crearDiagnosticoPrenez }
    } catch (error) {
      console.error('Error al crear diagnóstico:', error)
      return { success: false, error: error.message }
    }
  }

  const crearReproduccion = async (variables) => {
    try {
      const { data } = await crearReproduccionMutation({
        variables: { fincaId, ...variables }
      })
      await refetchProximosPartos()
      return { success: true, data: data?.crearReproduccion }
    } catch (error) {
      console.error('Error al crear parto:', error)
      return { success: false, error: error.message }
    }
  }

  const registrarPartoConCrias = async (variables) => {
    try {
      const { data } = await registrarPartoConCriasMutation({
        variables: { fincaId, ...variables }
      })
      const result = data?.registrarPartoConCrias
      if (result?.success) {
        await Promise.all([refetchReproducciones(), refetchProximosPartos()])
      }
      return {
        success: result?.success || false,
        data: result,
        error: result?.message,
      }
    } catch (error) {
      console.error('Error al registrar parto con crías:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    // Data
    inseminaciones: inseminacionesData?.inseminaciones || [],
    montasNaturales: montasData?.montasNaturales || [],
    diagnosticos: diagnosticosData?.diagnosticosPrenez || [],
    reproducciones: reproduccionesData?.reproducciones || [],
    vacasPrenadas: vacasPrenadasData?.vacasPrenadas || [],
    proximosPartos: proximosPartosData?.proximosPartos || [],

    // Loading
    loading: loadingInseminaciones || loadingMontas || loadingDiagnosticos || loadingReproducciones,

    // Functions
    crearInseminacion,
    crearDiagnostico,
    crearReproduccion,
    registrarPartoConCrias,

    // Refetch
    refetchInseminaciones,
    refetchReproducciones,
    refetchProximosPartos,
  }
}
