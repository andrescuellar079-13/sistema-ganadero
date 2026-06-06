// frontend/src/hooks/useTransferencias.js
import { useQuery, useMutation, useLazyQuery } from '@apollo/client'
import {
  GET_TRANSFERENCIAS,
  GET_TRANSFERENCIA_DETALLE,
  GET_ANIMALES_DISPONIBLES_TRANSFERENCIA,
  CREATE_TRANSFERENCIA,
  UPDATE_TRANSFERENCIA,
  AGREGAR_ANIMAL_TRANSFERENCIA,
  ACTUALIZAR_DETALLE_TRANSFERENCIA,
  QUITAR_ANIMAL_TRANSFERENCIA,
  CONFIRMAR_TRANSFERENCIA,
  CANCELAR_TRANSFERENCIA,
  MARCAR_TRANSFERENCIA_RECIBIDA,
} from '../graphql/fincas'

export const useTransferencias = (filtros = {}) => {
  const { data, loading, error, refetch } = useQuery(GET_TRANSFERENCIAS, {
    variables: filtros,
    fetchPolicy: 'cache-and-network',
  })

  const [crearMut]    = useMutation(CREATE_TRANSFERENCIA)
  const [actualizarMut] = useMutation(UPDATE_TRANSFERENCIA)
  const [confirmarMut]  = useMutation(CONFIRMAR_TRANSFERENCIA)
  const [cancelarMut]   = useMutation(CANCELAR_TRANSFERENCIA)
  const [recibirMut]    = useMutation(MARCAR_TRANSFERENCIA_RECIBIDA)
  const [agregarAnimalMut]   = useMutation(AGREGAR_ANIMAL_TRANSFERENCIA)
  const [quitarAnimalMut]    = useMutation(QUITAR_ANIMAL_TRANSFERENCIA)
  const [actualizarDetalleMut] = useMutation(ACTUALIZAR_DETALLE_TRANSFERENCIA)

  const wrap = async (fn, refetchAfter = true) => {
    try {
      const result = await fn()
      const key = Object.keys(result.data)[0]
      const payload = result.data[key]
      if (refetchAfter) await refetch()
      return { success: payload.success, message: payload.message, data: payload }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  const crearTransferencia = (vars) =>
    wrap(() => crearMut({ variables: vars }))

  const actualizarTransferencia = (id, vars) =>
    wrap(() => actualizarMut({ variables: { id, ...vars } }))

  const confirmarTransferencia = (id) =>
    wrap(() => confirmarMut({ variables: { id } }))

  const cancelarTransferencia = (id) =>
    wrap(() => cancelarMut({ variables: { id } }))

  const marcarRecibida = (id) =>
    wrap(() => recibirMut({ variables: { id } }))

  const agregarAnimal = (vars) =>
    wrap(() => agregarAnimalMut({ variables: vars }))

  const quitarAnimal = (detalleId) =>
    wrap(() => quitarAnimalMut({ variables: { detalleId } }))

  const actualizarDetalle = (detalleId, vars) =>
    wrap(() => actualizarDetalleMut({ variables: { detalleId, ...vars } }))

  return {
    transferencias: data?.transferenciasFinca?.resultados || [],
    paginacion: {
      total: data?.transferenciasFinca?.total || 0,
      paginas: data?.transferenciasFinca?.paginas || 1,
      paginaActual: data?.transferenciasFinca?.paginaActual || 1,
      tieneSiguiente: data?.transferenciasFinca?.tieneSiguiente || false,
      tieneAnterior: data?.transferenciasFinca?.tieneAnterior || false,
    },
    loading,
    error,
    refetch,
    crearTransferencia,
    actualizarTransferencia,
    confirmarTransferencia,
    cancelarTransferencia,
    marcarRecibida,
    agregarAnimal,
    quitarAnimal,
    actualizarDetalle,
  }
}

export const useTransferenciaDetalle = (id) => {
  const { data, loading, error, refetch } = useQuery(GET_TRANSFERENCIA_DETALLE, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  })
  return {
    transferencia: data?.transferenciaFinca || null,
    loading,
    error,
    refetch,
  }
}

export const useAnimalesDisponiblesTransferencia = () => {
  const [buscar, { data, loading }] = useLazyQuery(
    GET_ANIMALES_DISPONIBLES_TRANSFERENCIA,
    { fetchPolicy: 'network-only' }
  )

  const buscarAnimales = (vars) => buscar({ variables: vars })

  return {
    animales: data?.animalesDisponiblesTransferencia || [],
    loading,
    buscarAnimales,
  }
}
