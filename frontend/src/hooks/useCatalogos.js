// frontend/src/hooks/useCatalogos.js
import { useQuery, useMutation } from '@apollo/client'
import {
  // Queries
  GET_TIPOS_MEDICAMENTO,
  GET_MEDICAMENTOS,
  GET_ALIMENTOS,
  GET_RAZAS,
  GET_CATEGORIAS_ANIMALES,
  GET_VETERINARIOS,
  GET_REPRODUCTORES,
  // Mutations
  CREATE_MEDICAMENTO,
  UPDATE_MEDICAMENTO,
  DELETE_MEDICAMENTO,
  CREATE_ALIMENTO,
  UPDATE_ALIMENTO,
  DELETE_ALIMENTO,
  CREATE_RAZA,
  UPDATE_RAZA,
  DELETE_RAZA,
  CREATE_CATEGORIA_ANIMAL,
  UPDATE_CATEGORIA_ANIMAL,
  DELETE_CATEGORIA_ANIMAL,
  CREATE_VETERINARIO,
  UPDATE_VETERINARIO,
  DELETE_VETERINARIO,
  CREATE_REPRODUCTOR,
  UPDATE_REPRODUCTOR,
  DELETE_REPRODUCTOR,
} from '../graphql/catalogos'

export const useCatalogos = () => {
  // ==========================================
  // QUERIES
  // ==========================================
  
  const { data: tiposMedicamento, loading: loadingTiposMedicamento, refetch: refetchTiposMedicamento } = useQuery(GET_TIPOS_MEDICAMENTO)
  const { data: medicamentos, loading: loadingMedicamentos, refetch: refetchMedicamentos } = useQuery(GET_MEDICAMENTOS)
  const { data: alimentos, loading: loadingAlimentos, refetch: refetchAlimentos } = useQuery(GET_ALIMENTOS)
  const { data: razas, loading: loadingRazas, refetch: refetchRazas } = useQuery(GET_RAZAS)
  const { data: categoriasAnimales, loading: loadingCategorias, refetch: refetchCategorias } = useQuery(GET_CATEGORIAS_ANIMALES)
  const { data: veterinarios, loading: loadingVeterinarios, refetch: refetchVeterinarios } = useQuery(GET_VETERINARIOS)
  const { data: reproductores, loading: loadingReproductores, refetch: refetchReproductores } = useQuery(GET_REPRODUCTORES)

  // ==========================================
  // MUTATIONS - Medicamentos
  // ==========================================
  
  const [crearMedicamentoMutation] = useMutation(CREATE_MEDICAMENTO)
  const [actualizarMedicamentoMutation] = useMutation(UPDATE_MEDICAMENTO)
  const [eliminarMedicamentoMutation] = useMutation(DELETE_MEDICAMENTO)

  const crearMedicamento = async (variables) => {
    try {
      const fincaId = localStorage.getItem('fincaId')
      const { data } = await crearMedicamentoMutation({
        variables: { fincaId, ...variables }
      })
      await refetchMedicamentos()
      return { success: true, data: data?.crearMedicamento }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarMedicamento = async (id, variables) => {
    try {
      const { data } = await actualizarMedicamentoMutation({
        variables: { id, ...variables }
      })
      await refetchMedicamentos()
      return { success: true, data: data?.actualizarMedicamento }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarMedicamento = async (id) => {
    try {
      const { data } = await eliminarMedicamentoMutation({
        variables: { id }
      })
      await refetchMedicamentos()
      return { success: true, message: data?.eliminarMedicamento?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // ==========================================
  // MUTATIONS - Alimentos
  // ==========================================
  
  const [crearAlimentoMutation] = useMutation(CREATE_ALIMENTO)
  const [actualizarAlimentoMutation] = useMutation(UPDATE_ALIMENTO)
  const [eliminarAlimentoMutation] = useMutation(DELETE_ALIMENTO)

  const crearAlimento = async (variables) => {
    try {
      const fincaId = localStorage.getItem('fincaId')
      const { data } = await crearAlimentoMutation({
        variables: { fincaId, ...variables }
      })
      await refetchAlimentos()
      return { success: true, data: data?.crearAlimento }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarAlimento = async (id, variables) => {
    try {
      const { data } = await actualizarAlimentoMutation({
        variables: { id, ...variables }
      })
      await refetchAlimentos()
      return { success: true, data: data?.actualizarAlimento }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarAlimento = async (id) => {
    try {
      const { data } = await eliminarAlimentoMutation({
        variables: { id }
      })
      await refetchAlimentos()
      return { success: true, message: data?.eliminarAlimento?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // ==========================================
  // MUTATIONS - Razas
  // ==========================================
  
  const [crearRazaMutation] = useMutation(CREATE_RAZA)
  const [actualizarRazaMutation] = useMutation(UPDATE_RAZA)
  const [eliminarRazaMutation] = useMutation(DELETE_RAZA)

  const crearRaza = async (variables) => {
    try {
      const { data } = await crearRazaMutation({ variables })
      await refetchRazas()
      return { success: true, data: data?.crearRaza }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarRaza = async (id, variables) => {
    try {
      const { data } = await actualizarRazaMutation({
        variables: { id, ...variables }
      })
      await refetchRazas()
      return { success: true, data: data?.actualizarRaza }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarRaza = async (id) => {
    try {
      const { data } = await eliminarRazaMutation({
        variables: { id }
      })
      await refetchRazas()
      return { success: true, message: data?.eliminarRaza?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // ==========================================
  // MUTATIONS - Categorias
  // ==========================================
  
  const [crearCategoriaAnimalMutation] = useMutation(CREATE_CATEGORIA_ANIMAL)
  const [actualizarCategoriaAnimalMutation] = useMutation(UPDATE_CATEGORIA_ANIMAL)
  const [eliminarCategoriaAnimalMutation] = useMutation(DELETE_CATEGORIA_ANIMAL)

  const crearCategoriaAnimal = async (variables) => {
    try {
      const { data } = await crearCategoriaAnimalMutation({ variables })
      await refetchCategorias()
      return { success: true, data: data?.crearCategoriaAnimal }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarCategoriaAnimal = async (id, variables) => {
    try {
      const { data } = await actualizarCategoriaAnimalMutation({
        variables: { id, ...variables }
      })
      await refetchCategorias()
      return { success: true, data: data?.actualizarCategoriaAnimal }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarCategoriaAnimal = async (id) => {
    try {
      const { data } = await eliminarCategoriaAnimalMutation({
        variables: { id }
      })
      await refetchCategorias()
      return { success: true, message: data?.eliminarCategoriaAnimal?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // ==========================================
  // MUTATIONS - Veterinarios
  // ==========================================
  
  const [crearVeterinarioMutation] = useMutation(CREATE_VETERINARIO)
  const [actualizarVeterinarioMutation] = useMutation(UPDATE_VETERINARIO)
  const [eliminarVeterinarioMutation] = useMutation(DELETE_VETERINARIO)

  const crearVeterinario = async (variables) => {
    try {
      const fincaId = localStorage.getItem('fincaId')
      const { data } = await crearVeterinarioMutation({
        variables: { fincaId, ...variables }
      })
      await refetchVeterinarios()
      return { success: true, data: data?.crearVeterinario }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarVeterinario = async (id, variables) => {
    try {
      const { data } = await actualizarVeterinarioMutation({
        variables: { id, ...variables }
      })
      await refetchVeterinarios()
      return { success: true, data: data?.actualizarVeterinario }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarVeterinario = async (id) => {
    try {
      const { data } = await eliminarVeterinarioMutation({
        variables: { id }
      })
      await refetchVeterinarios()
      return { success: true, message: data?.eliminarVeterinario?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // ==========================================
  // MUTATIONS - Reproductores
  // ==========================================
  
  const [crearReproductorMutation] = useMutation(CREATE_REPRODUCTOR)
  const [actualizarReproductorMutation] = useMutation(UPDATE_REPRODUCTOR)
  const [eliminarReproductorMutation] = useMutation(DELETE_REPRODUCTOR)

  const crearReproductor = async (variables) => {
    try {
      const fincaId = localStorage.getItem('fincaId')
      const { data } = await crearReproductorMutation({
        variables: { fincaId, ...variables }
      })
      await refetchReproductores()
      return { success: true, data: data?.crearReproductor }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const actualizarReproductor = async (id, variables) => {
    try {
      const { data } = await actualizarReproductorMutation({
        variables: { id, ...variables }
      })
      await refetchReproductores()
      return { success: true, data: data?.actualizarReproductor }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const eliminarReproductor = async (id) => {
    try {
      const { data } = await eliminarReproductorMutation({
        variables: { id }
      })
      await refetchReproductores()
      return { success: true, message: data?.eliminarReproductor?.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    // Data
    tiposMedicamento: tiposMedicamento?.tiposMedicamento || [],
    medicamentos: medicamentos?.medicamentos || [],
    alimentos: alimentos?.alimentos || [],
    razas: razas?.razas || [],
    categoriasAnimales: categoriasAnimales?.categoriasAnimales || [],
    veterinarios: veterinarios?.veterinarios || [],
    reproductores: reproductores?.reproductores || [],
    
    // Loading
    loading: loadingTiposMedicamento || loadingMedicamentos || loadingAlimentos || 
             loadingRazas || loadingCategorias || loadingVeterinarios || loadingReproductores,
    
    // Refetch
    refetchMedicamentos,
    refetchAlimentos,
    refetchRazas,
    refetchCategorias,
    refetchVeterinarios,
    refetchReproductores,
    
    // Mutations - Medicamentos
    crearMedicamento,
    actualizarMedicamento,
    eliminarMedicamento,
    
    // Mutations - Alimentos
    crearAlimento,
    actualizarAlimento,
    eliminarAlimento,
    
    // Mutations - Razas
    crearRaza,
    actualizarRaza,
    eliminarRaza,
    
    // Mutations - Categorias
    crearCategoriaAnimal,
    actualizarCategoriaAnimal,
    eliminarCategoriaAnimal,
    
    // Mutations - Veterinarios
    crearVeterinario,
    actualizarVeterinario,
    eliminarVeterinario,
    
    // Mutations - Reproductores
    crearReproductor,
    actualizarReproductor,
    eliminarReproductor,
  }
}