import { useQuery, useMutation } from '@apollo/client'
import {
  GET_ANIMALES,
  CREATE_ANIMAL,
  UPDATE_ANIMAL,
  DELETE_ANIMAL,
  GET_RAZAS,
  GET_CATEGORIAS,
} from '../graphql/animales'

export const useAnimales = () => {
  const { data, loading, error, refetch } = useQuery(GET_ANIMALES)
  const { data: razasData, loading: loadingRazas } = useQuery(GET_RAZAS)
  const { data: categoriasData, loading: loadingCategorias } = useQuery(GET_CATEGORIAS)

  const [createAnimal] = useMutation(CREATE_ANIMAL)
  const [updateAnimal] = useMutation(UPDATE_ANIMAL)
  const [deleteAnimal] = useMutation(DELETE_ANIMAL)

  const crearAnimal = async (input) => {
    try {
      const variables = {
        fincaId: String(input.fincaId || 1),
        nroArete: input.nroArete,
        nombre: input.nombre || null,
        sexo: input.sexo,
        razaId: input.razaId ? String(input.razaId) : null,
        categoriaId: input.categoriaId ? String(input.categoriaId) : null,
        estado: input.estado || null,
        fechaNacimiento: input.fechaNacimiento || null,
        fechaIngreso: input.fechaIngreso || null,
        edadIngresoMeses: input.edadIngresoMeses ? parseInt(input.edadIngresoMeses) : null,
        peso: input.peso ? parseFloat(input.peso) : null,
        pesoNacimiento: input.pesoNacimiento ? parseFloat(input.pesoNacimiento) : null,
        tipoProduccion: input.tipoProduccion || null,
        origen: input.origen || null,
        observaciones: input.observaciones || null,
        padreId: input.padreId ? String(input.padreId) : null,
        madreId: input.madreId ? String(input.madreId) : null,
      }

      const result = await createAnimal({ variables })

      if (result.data?.crearAnimal?.success) {
        refetch()
        return { success: true, message: result.data.crearAnimal.message }
      }
      return { success: false, message: result.data?.crearAnimal?.message || 'Error al crear' }
    } catch (error) {
      console.error('Error creating animal:', error)
      return { success: false, message: error.message }
    }
  }

  const actualizarAnimal = async (id, input) => {
    try {
      const variables = { id }

      if (input.nombre !== undefined) variables.nombre = input.nombre
      if (input.sexo) variables.sexo = input.sexo
      if (input.razaId !== undefined) variables.razaId = input.razaId ? String(input.razaId) : null
      if (input.categoriaId !== undefined) variables.categoriaId = input.categoriaId ? String(input.categoriaId) : null
      if (input.estado) variables.estado = input.estado
      if (input.fechaNacimiento !== undefined) variables.fechaNacimiento = input.fechaNacimiento || null
      if (input.fechaIngreso !== undefined) variables.fechaIngreso = input.fechaIngreso || null
      if (input.edadIngresoMeses !== undefined) variables.edadIngresoMeses = input.edadIngresoMeses ? parseInt(input.edadIngresoMeses) : null
      if (input.peso !== undefined) variables.peso = input.peso ? parseFloat(input.peso) : null
      if (input.pesoNacimiento !== undefined) variables.pesoNacimiento = input.pesoNacimiento ? parseFloat(input.pesoNacimiento) : null
      if (input.tipoProduccion) variables.tipoProduccion = input.tipoProduccion
      if (input.origen) variables.origen = input.origen
      if (input.observaciones !== undefined) variables.observaciones = input.observaciones
      // padre/madre: se incluyen si están presentes en input (null = limpiar)
      if ('padreId' in input) variables.padreId = input.padreId ? String(input.padreId) : null
      if ('madreId' in input) variables.madreId = input.madreId ? String(input.madreId) : null

      const result = await updateAnimal({ variables })
      if (result.data?.actualizarAnimal?.success) {
        refetch()
        return { success: true, message: result.data.actualizarAnimal.message }
      }
      return { success: false, message: result.data?.actualizarAnimal?.message || 'Error al actualizar' }
    } catch (error) {
      console.error('Error updating animal:', error)
      return { success: false, message: error.message }
    }
  }

  const eliminarAnimal = async (id) => {
    try {
      const result = await deleteAnimal({ variables: { id } })
      if (result.data?.eliminarAnimal?.success) {
        refetch()
        return { success: true, message: result.data.eliminarAnimal.message }
      }
      return { success: false, message: result.data?.eliminarAnimal?.message || 'Error al eliminar' }
    } catch (error) {
      console.error('Error deleting animal:', error)
      return { success: false, message: error.message }
    }
  }

  return {
    animales: data?.allAnimales || [],
    razas: razasData?.razas || [],
    categorias: categoriasData?.categoriasAnimales || [],
    loading: loading || loadingRazas || loadingCategorias,
    error,
    crearAnimal,
    actualizarAnimal,
    eliminarAnimal,
    refetch,
  }
}
