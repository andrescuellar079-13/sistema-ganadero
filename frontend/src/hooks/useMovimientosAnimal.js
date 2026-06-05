import { useQuery, useMutation } from '@apollo/client'
import {
  GET_MOVIMIENTOS_ANIMAL,
  CREATE_MOVIMIENTO_ANIMAL,
  UPDATE_MOVIMIENTO_ANIMAL,
  DELETE_MOVIMIENTO_ANIMAL,
} from '../graphql/animales'

export const useMovimientosAnimal = (animalId, limit = 100) => {
  const { data, loading, error, refetch } = useQuery(GET_MOVIMIENTOS_ANIMAL, {
    variables: { animalId, limit },
    skip: !animalId,
    fetchPolicy: 'cache-and-network',
  })

  const [crearMutation]      = useMutation(CREATE_MOVIMIENTO_ANIMAL)
  const [actualizarMutation] = useMutation(UPDATE_MOVIMIENTO_ANIMAL)
  const [eliminarMutation]   = useMutation(DELETE_MOVIMIENTO_ANIMAL)

  const crearMovimiento = async (input) => {
    try {
      const { data } = await crearMutation({ variables: input })
      const r = data?.crearMovimientoAnimal
      if (r?.success) refetch()
      return r || { success: false, message: 'Error desconocido' }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  const actualizarMovimiento = async (id, input) => {
    try {
      const { data } = await actualizarMutation({ variables: { id, ...input } })
      const r = data?.actualizarMovimientoAnimal
      if (r?.success) refetch()
      return r || { success: false, message: 'Error desconocido' }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  const eliminarMovimiento = async (id) => {
    try {
      const { data } = await eliminarMutation({ variables: { id } })
      const r = data?.eliminarMovimientoAnimal
      if (r?.success) refetch()
      return r || { success: false, message: 'Error desconocido' }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  return {
    movimientos: data?.movimientosAnimal || [],
    loading,
    error,
    refetch,
    crearMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
  }
}
