// frontend/src/hooks/useParcelas.js
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_PARCELAS,
  GET_ANIMALES_DISPONIBLES,
  CREATE_PARCELA,
  UPDATE_PARCELA,
  DELETE_PARCELA,
  MOVER_ANIMAL_A_PARCELA,
  SACAR_ANIMAL_DE_PARCELA,
} from '../graphql/parcelas'

export const useParcelas = () => {
  const fincaId = localStorage.getItem('fincaId') || '1'

  const { data: parcelas, loading: loadingParcelas, refetch: refetchParcelas } = useQuery(GET_PARCELAS, {
    variables: { fincaId }
  })

  const { data: animalesDisponibles, loading: loadingAnimales, refetch: refetchAnimales } = useQuery(GET_ANIMALES_DISPONIBLES, {
    variables: { fincaId }
  })

  const [crearParcelaMutation] = useMutation(CREATE_PARCELA)
  const [actualizarParcelaMutation] = useMutation(UPDATE_PARCELA)
  const [eliminarParcelaMutation] = useMutation(DELETE_PARCELA)
  const [moverAnimalMutation] = useMutation(MOVER_ANIMAL_A_PARCELA)
  const [sacarAnimalMutation] = useMutation(SACAR_ANIMAL_DE_PARCELA)

  const crearParcela = async (variables) => {
    try {
      const { data } = await crearParcelaMutation({
        variables: { fincaId, ...variables }
      })
      await refetchParcelas()
      return { success: true, data: data?.crearParcela }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarParcela = async (id, variables) => {
    try {
      const { data } = await actualizarParcelaMutation({
        variables: { id, ...variables }
      })
      await refetchParcelas()
      return { success: true, data: data?.actualizarParcela }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarParcela = async (id) => {
    try {
      const { data } = await eliminarParcelaMutation({
        variables: { id }
      })
      await refetchParcelas()
      return { success: true, data: data?.eliminarParcela }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const moverAnimalAParcela = async (variables) => {
    try {
      const { data } = await moverAnimalMutation({
        variables: { fincaId, ...variables }
      })
      await refetchParcelas()
      await refetchAnimales()
      return { success: true, data: data?.moverAnimalAParcela }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const sacarAnimalDeParcela = async (movimientoId, fechaSalida) => {
    try {
      const { data } = await sacarAnimalMutation({
        variables: { movimientoId, fechaSalida }
      })
      await refetchParcelas()
      await refetchAnimales()
      return { success: true, data: data?.sacarAnimalDeParcela }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    parcelas: parcelas?.parcelas || [],
    animalesDisponibles: animalesDisponibles?.animalesActivos || [],
    loading: loadingParcelas || loadingAnimales,
    crearParcela,
    actualizarParcela,
    eliminarParcela,
    moverAnimalAParcela,
    sacarAnimalDeParcela,
    refetchParcelas,
    refetchAnimales,
  }
}