// frontend/src/hooks/useCompras.js
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_PROVEEDORES,
  GET_NOTAS_COMPRA,
  GET_MEDICAMENTOS,
  GET_ALIMENTOS,
  GET_RAZAS,
  GET_CATEGORIAS,
  CREATE_PROVEEDOR,
  UPDATE_PROVEEDOR,
  DELETE_PROVEEDOR,
  CREATE_NOTA_COMPRA,
  UPDATE_NOTA_COMPRA,
  DELETE_NOTA_COMPRA,
  CREATE_DETALLE_COMPRA,
  CREATE_DETALLE_COMPRA_ALIMENTO,
  CREATE_DETALLE_COMPRA_ANIMAL,
  DELETE_DETALLE_COMPRA_ANIMAL,
} from '../graphql/compras'

export const useCompras = () => {
  const fincaId = localStorage.getItem('fincaId') || '1'

  // Queries
  const { data: proveedores, loading: loadingProveedores, refetch: refetchProveedores } = useQuery(GET_PROVEEDORES)
  const { data: notasCompra, loading: loadingNotas, refetch: refetchNotas } = useQuery(GET_NOTAS_COMPRA)
  const { data: medicamentos, loading: loadingMedicamentos } = useQuery(GET_MEDICAMENTOS)
  const { data: alimentos, loading: loadingAlimentos } = useQuery(GET_ALIMENTOS)
  const { data: razas, loading: loadingRazas } = useQuery(GET_RAZAS)
  const { data: categorias, loading: loadingCategorias } = useQuery(GET_CATEGORIAS)

  // Mutations - Proveedores
  const [createProveedor] = useMutation(CREATE_PROVEEDOR)
  const [updateProveedor] = useMutation(UPDATE_PROVEEDOR)
  const [deleteProveedor] = useMutation(DELETE_PROVEEDOR)

  // Mutations - Notas Compra
  const [createNotaCompra] = useMutation(CREATE_NOTA_COMPRA)
  const [updateNotaCompra] = useMutation(UPDATE_NOTA_COMPRA)
  const [deleteNotaCompra] = useMutation(DELETE_NOTA_COMPRA)

  // Mutations - Detalles
  const [createDetalleCompra] = useMutation(CREATE_DETALLE_COMPRA)
  const [createDetalleCompraAlimento] = useMutation(CREATE_DETALLE_COMPRA_ALIMENTO)
  const [createDetalleCompraAnimal] = useMutation(CREATE_DETALLE_COMPRA_ANIMAL)
  const [deleteDetalleCompraAnimal] = useMutation(DELETE_DETALLE_COMPRA_ANIMAL)

  // Funciones
  const crearProveedor = async (variables) => {
    try {
      const { data } = await createProveedor({ variables: { fincaId, ...variables } })
      await refetchProveedores()
      return { success: true, data: data?.crearProveedor }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarProveedor = async (id, variables) => {
    try {
      const { data } = await updateProveedor({ variables: { id, ...variables } })
      await refetchProveedores()
      return { success: true, data: data?.actualizarProveedor }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarProveedor = async (id) => {
    try {
      const { data } = await deleteProveedor({ variables: { id } })
      await refetchProveedores()
      return { success: true, data: data?.eliminarProveedor }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const crearNotaCompra = async (variables) => {
    try {
      const { data } = await createNotaCompra({ variables: { fincaId, ...variables } })
      await refetchNotas()
      return { success: true, data: data?.crearNotaCompra, id: data?.crearNotaCompra?.notaCompra?.id }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarNotaCompra = async (id, variables) => {
    try {
      const { data } = await updateNotaCompra({ variables: { id, ...variables } })
      await refetchNotas()
      return { success: true, data: data?.actualizarNotaCompra }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarNotaCompra = async (id) => {
    try {
      const { data } = await deleteNotaCompra({ variables: { id } })
      await refetchNotas()
      return { success: true, data: data?.eliminarNotaCompra }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const crearDetalleCompra = async (variables) => {
    try {
      const { data } = await createDetalleCompra({ variables })
      await refetchNotas()
      return { success: true, data: data?.crearDetalleCompra }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const crearDetalleCompraAlimento = async (variables) => {
    try {
      const { data } = await createDetalleCompraAlimento({ variables })
      await refetchNotas()
      return { success: true, data: data?.crearDetalleCompraAlimento }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const crearDetalleCompraAnimal = async (variables) => {
    try {
      const { data } = await createDetalleCompraAnimal({ variables })
      await refetchNotas()
      return { success: true, data: data?.crearDetalleCompraAnimal }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarDetalleCompraAnimal = async (id) => {
    try {
      const { data } = await deleteDetalleCompraAnimal({ variables: { id } })
      await refetchNotas()
      return { success: true, data: data?.eliminarDetalleCompraAnimal }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    // Data
    proveedores: proveedores?.proveedores || [],
    notasCompra: notasCompra?.notasCompra || [],
    medicamentos: medicamentos?.medicamentos || [],
    alimentos: alimentos?.alimentos || [],
    razas: razas?.razas || [],
    categorias: categorias?.categoriasAnimales || [],
    
    // Loading
    loading: loadingProveedores || loadingNotas || loadingMedicamentos || loadingAlimentos || loadingRazas || loadingCategorias,
    
    // Functions - Proveedores
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    
    // Functions - Notas Compra
    crearNotaCompra,
    actualizarNotaCompra,
    eliminarNotaCompra,
    
    // Functions - Detalles
    crearDetalleCompra,
    crearDetalleCompraAlimento,
    crearDetalleCompraAnimal,
    eliminarDetalleCompraAnimal,
    
    // Refetch
    refetchNotas,
    refetchProveedores,
  }
}