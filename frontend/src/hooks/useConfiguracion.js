// frontend/src/hooks/useConfiguracion.js
import { useQuery, useMutation } from '@apollo/client'
import { 
  GET_CONFIGURACION, 
  ACTUALIZAR_CONFIGURACION, 
  GET_LOGS_ACTIVIDAD,
  REGISTRAR_LOG 
} from '../graphql/configuracion'

export const useConfiguracion = () => {
  const { data, loading, refetch } = useQuery(GET_CONFIGURACION)
  
  const [actualizarConfiguracionMutation] = useMutation(ACTUALIZAR_CONFIGURACION)
  const [registrarLogMutation] = useMutation(REGISTRAR_LOG)

  const configuracion = data?.configuracionSistema || null

  const actualizarConfiguracion = async (variables) => {
    try {
      const { data } = await actualizarConfiguracionMutation({ variables })
      await refetch()
      return { 
        success: data?.actualizarConfiguracionSistema?.success, 
        message: data?.actualizarConfiguracionSistema?.message 
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const registrarLog = async (accion, modulo, descripcion) => {
    try {
      const { data } = await registrarLogMutation({ 
        variables: { accion, modulo, descripcion } 
      })
      return { 
        success: data?.registrarLogActividad?.success, 
        message: data?.registrarLogActividad?.message 
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const getLogs = (limit = 50, offset = 0) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery(GET_LOGS_ACTIVIDAD, { variables: { limit, offset } })
  }

  return {
    configuracion,
    loading,
    actualizarConfiguracion,
    registrarLog,
    getLogs,
    refetch,
  }
}