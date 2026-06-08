// frontend/src/hooks/useReproduccion.js
import { useQuery, useMutation } from '@apollo/client'
import {
  // Queries existentes
  GET_INSEMINACIONES,
  GET_MONTAS_NATURALES,
  GET_DIAGNOSTICOS_PRENEZ,
  GET_REPRODUCCIONES,
  GET_VACAS_PRENADAS,
  GET_PROXIMOS_PARTOS,
  // Nuevas Queries
  GET_CELOS,
  GET_PALPACIONES,
  GET_HEMBRAS_REPETIDORAS,
  GET_ABORTOS_DETALLADOS,
  GET_DESTETES,
  GET_DIAS_ABIERTOS,
  // Mutations existentes
  CREATE_INSEMINACION,
  CREATE_DIAGNOSTICO_PRENEZ,
  CREATE_REPRODUCCION,
  REGISTRAR_PARTO_CON_CRIAS,
  // Nuevas Mutations - Crear
  CREATE_CELO,
  CREATE_PALPACION,
  CREATE_HEMBRA_REPETIDORA,
  CREATE_ABORTO_DETALLADO,
  CREATE_DESTETE,
  // Nuevas Mutations - Actualizar y Eliminar
  UPDATE_CELO,
  DELETE_CELO,
  UPDATE_PALPACION,
  DELETE_PALPACION,
  UPDATE_DESTETE,
  DELETE_DESTETE,
} from '../graphql/reproduccion'

export const useReproduccion = () => {
  const fincaId = localStorage.getItem('fincaId') || '1'

  // ==========================================
  // QUERIES EXISTENTES
  // ==========================================
  
  const { data: inseminacionesData, loading: loadingInseminaciones, refetch: refetchInseminaciones } =
    useQuery(GET_INSEMINACIONES, { variables: { fincaId } })

  const { data: montasData, loading: loadingMontas } =
    useQuery(GET_MONTAS_NATURALES, { variables: { fincaId } })

  const { data: diagnosticosData, loading: loadingDiagnosticos } =
    useQuery(GET_DIAGNOSTICOS_PRENEZ, { variables: { fincaId } })

  const { data: reproduccionesData, loading: loadingReproducciones, refetch: refetchReproducciones } =
    useQuery(GET_REPRODUCCIONES, { variables: { fincaId } })

  const { data: vacasPrenadasData, loading: loadingVacasPrenadas } =
    useQuery(GET_VACAS_PRENADAS, { variables: { fincaId } })

  const { data: proximosPartosData, loading: loadingProximosPartos, refetch: refetchProximosPartos } =
    useQuery(GET_PROXIMOS_PARTOS, { variables: { dias: 30, fincaId } })

  // ==========================================
  // NUEVAS QUERIES
  // ==========================================
  
  const { data: celosData, loading: loadingCelos, refetch: refetchCelos } =
    useQuery(GET_CELOS, { variables: { fincaId } })

  const { data: palpacionesData, loading: loadingPalpaciones, refetch: refetchPalpaciones } =
    useQuery(GET_PALPACIONES, { variables: { fincaId } })

  const { data: hembrasRepetidorasData, loading: loadingHembrasRepetidoras, refetch: refetchHembrasRepetidoras } =
    useQuery(GET_HEMBRAS_REPETIDORAS, { variables: { fincaId } })

  const { data: abortosDetalladosData, loading: loadingAbortosDetallados, refetch: refetchAbortosDetallados } =
    useQuery(GET_ABORTOS_DETALLADOS, { variables: { fincaId } })

  const { data: destetesData, loading: loadingDestetes, refetch: refetchDestetes } =
    useQuery(GET_DESTETES, { variables: { fincaId } })

  // ==========================================
  // MUTATIONS EXISTENTES
  // ==========================================
  
  const [crearInseminacionMutation] = useMutation(CREATE_INSEMINACION)
  const [crearDiagnosticoMutation] = useMutation(CREATE_DIAGNOSTICO_PRENEZ)
  const [crearReproduccionMutation] = useMutation(CREATE_REPRODUCCION)
  const [registrarPartoConCriasMutation] = useMutation(REGISTRAR_PARTO_CON_CRIAS)

  // ==========================================
  // NUEVAS MUTATIONS - CREAR
  // ==========================================
  
  const [crearCeloMutation] = useMutation(CREATE_CELO)
  const [crearPalpacionMutation] = useMutation(CREATE_PALPACION)
  const [crearHembraRepetidoraMutation] = useMutation(CREATE_HEMBRA_REPETIDORA)
  const [crearAbortoDetalladoMutation] = useMutation(CREATE_ABORTO_DETALLADO)
  const [crearDesteteMutation] = useMutation(CREATE_DESTETE)

  // ==========================================
  // NUEVAS MUTATIONS - ACTUALIZAR Y ELIMINAR
  // ==========================================
  
  const [updateCeloMutation] = useMutation(UPDATE_CELO)
  const [deleteCeloMutation] = useMutation(DELETE_CELO)
  const [updatePalpacionMutation] = useMutation(UPDATE_PALPACION)
  const [deletePalpacionMutation] = useMutation(DELETE_PALPACION)
  const [updateDesteteMutation] = useMutation(UPDATE_DESTETE)
  const [deleteDesteteMutation] = useMutation(DELETE_DESTETE)

  // ==========================================
  // FUNCIONES EXISTENTES
  // ==========================================
  
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
      await refetchInseminaciones()
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
      await refetchReproducciones()
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

  // ==========================================
  // NUEVAS FUNCIONES - CREAR
  // ==========================================
  
  const crearCelo = async (variables) => {
    try {
      const { data } = await crearCeloMutation({
        variables: { fincaId, ...variables }
      })
      await refetchCelos()
      return { success: true, data: data?.crearCelo }
    } catch (error) {
      console.error('Error al registrar celo:', error)
      return { success: false, error: error.message }
    }
  }

  const crearPalpacion = async (variables) => {
    try {
      const { data } = await crearPalpacionMutation({
        variables: { fincaId, ...variables }
      })
      await refetchPalpaciones()
      await refetchInseminaciones()
      return { success: true, data: data?.crearPalpacion }
    } catch (error) {
      console.error('Error al registrar palpación:', error)
      return { success: false, error: error.message }
    }
  }

  const crearHembraRepetidora = async (variables) => {
    try {
      const { data } = await crearHembraRepetidoraMutation({
        variables: { ...variables }
      })
      await refetchHembrasRepetidoras()
      return { success: true, data: data?.crearHembraRepetidora }
    } catch (error) {
      console.error('Error al registrar hembra repetidora:', error)
      return { success: false, error: error.message }
    }
  }

  const crearAbortoDetallado = async (variables) => {
    try {
      const { data } = await crearAbortoDetalladoMutation({
        variables: { ...variables }
      })
      await refetchAbortosDetallados()
      await refetchReproducciones()
      return { success: true, data: data?.crearAbortoDetallado }
    } catch (error) {
      console.error('Error al registrar aborto detallado:', error)
      return { success: false, error: error.message }
    }
  }

  const crearDestete = async (variables) => {
    try {
      const { data } = await crearDesteteMutation({
        variables: { fincaId, ...variables }
      })
      await refetchDestetes()
      return { success: true, data: data?.crearDestete }
    } catch (error) {
      console.error('Error al registrar destete:', error)
      return { success: false, error: error.message }
    }
  }

  // ==========================================
  // NUEVAS FUNCIONES - ACTUALIZAR
  // ==========================================
  
  const actualizarCelo = async (id, variables) => {
    try {
      const { data } = await updateCeloMutation({
        variables: { id, ...variables }
      })
      if (data?.actualizarCelo?.success) {
        await refetchCelos()
        return { success: true, message: data.actualizarCelo.message }
      }
      return { success: false, message: data?.actualizarCelo?.message || 'Error al actualizar' }
    } catch (error) {
      console.error('Error al actualizar celo:', error)
      return { success: false, error: error.message }
    }
  }

  const actualizarPalpacion = async (id, variables) => {
    try {
      const { data } = await updatePalpacionMutation({
        variables: { id, ...variables }
      })
      if (data?.actualizarPalpacion?.success) {
        await refetchPalpaciones()
        return { success: true, message: data.actualizarPalpacion.message }
      }
      return { success: false, message: data?.actualizarPalpacion?.message || 'Error al actualizar' }
    } catch (error) {
      console.error('Error al actualizar palpación:', error)
      return { success: false, error: error.message }
    }
  }

  const actualizarDestete = async (id, variables) => {
    try {
      const { data } = await updateDesteteMutation({
        variables: { id, ...variables }
      })
      if (data?.actualizarDestete?.success) {
        await refetchDestetes()
        return { success: true, message: data.actualizarDestete.message }
      }
      return { success: false, message: data?.actualizarDestete?.message || 'Error al actualizar' }
    } catch (error) {
      console.error('Error al actualizar destete:', error)
      return { success: false, error: error.message }
    }
  }

  // ==========================================
  // NUEVAS FUNCIONES - ELIMINAR
  // ==========================================
  
  const eliminarCelo = async (id) => {
    try {
      const { data } = await deleteCeloMutation({ variables: { id } })
      if (data?.eliminarCelo?.success) {
        await refetchCelos()
        return { success: true, message: data.eliminarCelo.message }
      }
      return { success: false, message: data?.eliminarCelo?.message || 'Error al eliminar' }
    } catch (error) {
      console.error('Error al eliminar celo:', error)
      return { success: false, error: error.message }
    }
  }

  const eliminarPalpacion = async (id) => {
    try {
      const { data } = await deletePalpacionMutation({ variables: { id } })
      if (data?.eliminarPalpacion?.success) {
        await refetchPalpaciones()
        return { success: true, message: data.eliminarPalpacion.message }
      }
      return { success: false, message: data?.eliminarPalpacion?.message || 'Error al eliminar' }
    } catch (error) {
      console.error('Error al eliminar palpación:', error)
      return { success: false, error: error.message }
    }
  }

  const eliminarDestete = async (id) => {
    try {
      const { data } = await deleteDesteteMutation({ variables: { id } })
      if (data?.eliminarDestete?.success) {
        await refetchDestetes()
        return { success: true, message: data.eliminarDestete.message }
      }
      return { success: false, message: data?.eliminarDestete?.message || 'Error al eliminar' }
    } catch (error) {
      console.error('Error al eliminar destete:', error)
      return { success: false, error: error.message }
    }
  }

  const getDiasAbiertos = async (hembraId) => {
    try {
      const { data } = await useQuery(GET_DIAS_ABIERTOS, { 
        variables: { hembraId },
        fetchPolicy: 'network-only'
      })
      return data?.diasAbiertos || null
    } catch (error) {
      console.error('Error al obtener días abiertos:', error)
      return null
    }
  }

  // ==========================================
  // RETURN
  // ==========================================
  
  return {
    // Data existentes
    inseminaciones: inseminacionesData?.inseminaciones || [],
    montasNaturales: montasData?.montasNaturales || [],
    diagnosticos: diagnosticosData?.diagnosticosPrenez || [],
    reproducciones: reproduccionesData?.reproducciones || [],
    vacasPrenadas: vacasPrenadasData?.vacasPrenadas || [],
    proximosPartos: proximosPartosData?.proximosPartos || [],
    
    // Nuevos Data
    celos: celosData?.celos || [],
    palpaciones: palpacionesData?.palpaciones || [],
    hembrasRepetidoras: hembrasRepetidorasData?.hembrasRepetidoras || [],
    abortosDetallados: abortosDetalladosData?.abortosDetallados || [],
    destetes: destetesData?.destetes || [],

    // Loading
    loading: loadingInseminaciones || loadingMontas || loadingDiagnosticos || 
             loadingReproducciones || loadingCelos || loadingPalpaciones || 
             loadingHembrasRepetidoras || loadingAbortosDetallados || loadingDestetes,

    // Funciones existentes
    crearInseminacion,
    crearDiagnostico,
    crearReproduccion,
    registrarPartoConCrias,

    // Nuevas funciones - Crear
    crearCelo,
    crearPalpacion,
    crearHembraRepetidora,
    crearAbortoDetallado,
    crearDestete,
    
    // Nuevas funciones - Actualizar
    actualizarCelo,
    actualizarPalpacion,
    actualizarDestete,
    
    // Nuevas funciones - Eliminar
    eliminarCelo,
    eliminarPalpacion,
    eliminarDestete,
    
    getDiasAbiertos,

    // Refetch
    refetchInseminaciones,
    refetchReproducciones,
    refetchProximosPartos,
    refetchCelos,
    refetchPalpaciones,
    refetchHembrasRepetidoras,
    refetchAbortosDetallados,
    refetchDestetes,
  }
}