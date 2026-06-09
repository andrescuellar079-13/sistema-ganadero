// frontend/src/graphql/catalogos.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_TIPOS_MEDICAMENTO = gql`
  query GetTiposMedicamento {
    tiposMedicamento {
      id
      nombre
      descripcion
    }
  }
`

export const GET_MEDICAMENTOS = gql`
  query GetMedicamentos {
    medicamentos {
      id
      nombre
      descripcion
      laboratorio
      principioActivo
      presentacion
      unidadMedida
      stockCantidad
      stockMinimo
      contenidoNeto
      fechaVencimiento
      precioCompra
      dosisRecomendada
      viaAplicacion
      diasRetiroCarne
      diasRetiroLeche
      intervaloDias
      activo
      tipo {
        id
        nombre
      }
    }
  }
`

export const GET_ALIMENTOS = gql`
  query GetAlimentos {
    alimentos {
      id
      nombre
      tipoAlimento
      contenidoNeto
      unidadMedida
      fechaVencimiento
      stockCantidad
      stockMinimo
      precioReferencia
      costoPorKg
      materiaSecaPorcentaje
      proteinaPorcentaje
      fibraPorcentaje
      energia
      usoRecomendado
      activo
    }
  }
`

export const GET_RAZAS = gql`
  query GetRazas {
    razas {
      id
      nombre
      orientacion
      origen
      descripcion
      activo
    }
  }
`

export const GET_CATEGORIAS_ANIMALES = gql`
  query GetCategoriasAnimales {
    categoriasAnimales {
      id
      nombre
      descripcion
      sexoAplica
      edadMinMeses
      edadMaxMeses
      pesoMinKg
      pesoMaxKg
      tipoProduccion
      permiteLactancia
      permiteReproduccion
      orden
      activo
    }
  }
`

export const GET_VETERINARIOS = gql`
  query GetVeterinarios {
    veterinarios {
      id
      nombre
      apellidos
      ci
      especialidad
      telefono
      email
      matriculaProfesional
      tipoServicio
      costoVisita
      direccion
      observaciones
      activo
    }
  }
`

export const GET_REPRODUCTORES = gql`
  query GetReproductores {
    reproductores {
      id
      codigo
      nombre
      tipoOrigen
      tipoReproductor
      codigoPajuela
      laboratorio
      stockPajuelas
      costoPajuela
      facilidadParto
      valorGenetico
      observaciones
      activo
      raza {
        id
        nombre
      }
      animalInterno {
        id
        nombre
        nroArete
      }
    }
  }
`

export const GET_VACUNAS = gql`
  query GetVacunas {
    vacunas {
      id
      nombre
      descripcion
      enfermedadPreviene
      laboratorio
      dosisRecomendada
      viaAplicacion
      intervaloDias
      edadMinimaMeses
      requiereRefuerzo
      diasAnticipacionAlerta
      sexoAplicable
      tipoProduccionAplicable
      stockCantidad
      stockMinimo
      lote
      fechaVencimiento
      observacionesTecnicas
      activo
      isStockBajo
      isVencida
      createdAt
      updatedAt
    }
  }
`

// ==========================================
// MUTATIONS - MEDICAMENTOS
// ==========================================

export const CREATE_MEDICAMENTO = gql`
  mutation CrearMedicamento(
    $fincaId: ID!
    $tipoId: ID
    $nombre: String!
    $descripcion: String
    $laboratorio: String
    $principioActivo: String
    $presentacion: String
    $unidadMedida: String
    $stockCantidad: Decimal
    $stockMinimo: Decimal
    $contenidoNeto: Decimal
    $fechaVencimiento: Date
    $precioCompra: Decimal
    $dosisRecomendada: String
    $viaAplicacion: String
    $diasRetiroCarne: Int
    $diasRetiroLeche: Int
    $intervaloDias: Int
    $activo: Boolean
  ) {
    crearMedicamento(
      fincaId: $fincaId
      tipoId: $tipoId
      nombre: $nombre
      descripcion: $descripcion
      laboratorio: $laboratorio
      principioActivo: $principioActivo
      presentacion: $presentacion
      unidadMedida: $unidadMedida
      stockCantidad: $stockCantidad
      stockMinimo: $stockMinimo
      contenidoNeto: $contenidoNeto
      fechaVencimiento: $fechaVencimiento
      precioCompra: $precioCompra
      dosisRecomendada: $dosisRecomendada
      viaAplicacion: $viaAplicacion
      diasRetiroCarne: $diasRetiroCarne
      diasRetiroLeche: $diasRetiroLeche
      intervaloDias: $intervaloDias
      activo: $activo
    ) {
      medicamento {
        id
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_MEDICAMENTO = gql`
  mutation ActualizarMedicamento(
    $id: ID!
    $tipoId: ID
    $nombre: String
    $descripcion: String
    $laboratorio: String
    $principioActivo: String
    $presentacion: String
    $unidadMedida: String
    $stockCantidad: Decimal
    $stockMinimo: Decimal
    $contenidoNeto: Decimal
    $fechaVencimiento: Date
    $precioCompra: Decimal
    $dosisRecomendada: String
    $viaAplicacion: String
    $diasRetiroCarne: Int
    $diasRetiroLeche: Int
    $intervaloDias: Int
    $activo: Boolean
  ) {
    actualizarMedicamento(
      id: $id
      tipoId: $tipoId
      nombre: $nombre
      descripcion: $descripcion
      laboratorio: $laboratorio
      principioActivo: $principioActivo
      presentacion: $presentacion
      unidadMedida: $unidadMedida
      stockCantidad: $stockCantidad
      stockMinimo: $stockMinimo
      contenidoNeto: $contenidoNeto
      fechaVencimiento: $fechaVencimiento
      precioCompra: $precioCompra
      dosisRecomendada: $dosisRecomendada
      viaAplicacion: $viaAplicacion
      diasRetiroCarne: $diasRetiroCarne
      diasRetiroLeche: $diasRetiroLeche
      intervaloDias: $intervaloDias
      activo: $activo
    ) {
      medicamento {
        id
        nombre
      }
      success
      message
    }
  }
`

export const DELETE_MEDICAMENTO = gql`
  mutation EliminarMedicamento($id: ID!) {
    eliminarMedicamento(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - ALIMENTOS
// ==========================================

export const CREATE_ALIMENTO = gql`
  mutation CrearAlimento(
    $fincaId: ID!
    $nombre: String!
    $tipoAlimento: String
    $contenidoNeto: Decimal
    $unidadMedida: String
    $fechaVencimiento: Date
    $stockCantidad: Decimal
    $stockMinimo: Decimal
    $precioReferencia: Decimal
    $costoPorKg: Decimal
    $materiaSecaPorcentaje: Decimal
    $proteinaPorcentaje: Decimal
    $fibraPorcentaje: Decimal
    $energia: String
    $usoRecomendado: String
    $activo: Boolean
  ) {
    crearAlimento(
      fincaId: $fincaId
      nombre: $nombre
      tipoAlimento: $tipoAlimento
      contenidoNeto: $contenidoNeto
      unidadMedida: $unidadMedida
      fechaVencimiento: $fechaVencimiento
      stockCantidad: $stockCantidad
      stockMinimo: $stockMinimo
      precioReferencia: $precioReferencia
      costoPorKg: $costoPorKg
      materiaSecaPorcentaje: $materiaSecaPorcentaje
      proteinaPorcentaje: $proteinaPorcentaje
      fibraPorcentaje: $fibraPorcentaje
      energia: $energia
      usoRecomendado: $usoRecomendado
      activo: $activo
    ) {
      alimento {
        id
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_ALIMENTO = gql`
  mutation ActualizarAlimento(
    $id: ID!
    $nombre: String
    $tipoAlimento: String
    $contenidoNeto: Decimal
    $unidadMedida: String
    $fechaVencimiento: Date
    $stockCantidad: Decimal
    $stockMinimo: Decimal
    $precioReferencia: Decimal
    $costoPorKg: Decimal
    $materiaSecaPorcentaje: Decimal
    $proteinaPorcentaje: Decimal
    $fibraPorcentaje: Decimal
    $energia: String
    $usoRecomendado: String
    $activo: Boolean
  ) {
    actualizarAlimento(
      id: $id
      nombre: $nombre
      tipoAlimento: $tipoAlimento
      contenidoNeto: $contenidoNeto
      unidadMedida: $unidadMedida
      fechaVencimiento: $fechaVencimiento
      stockCantidad: $stockCantidad
      stockMinimo: $stockMinimo
      precioReferencia: $precioReferencia
      costoPorKg: $costoPorKg
      materiaSecaPorcentaje: $materiaSecaPorcentaje
      proteinaPorcentaje: $proteinaPorcentaje
      fibraPorcentaje: $fibraPorcentaje
      energia: $energia
      usoRecomendado: $usoRecomendado
      activo: $activo
    ) {
      alimento {
        id
        nombre
        activo
      }
      success
      message
    }
  }
`

export const DELETE_ALIMENTO = gql`
  mutation EliminarAlimento($id: ID!) {
    eliminarAlimento(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - RAZAS
// ==========================================

export const CREATE_RAZA = gql`
  mutation CrearRaza(
    $nombre: String!
    $orientacion: String
    $origen: String
    $descripcion: String
  ) {
    crearRaza(
      nombre: $nombre
      orientacion: $orientacion
      origen: $origen
      descripcion: $descripcion
    ) {
      raza {
        id
        nombre
        orientacion
        origen
      }
      success
      message
    }
  }
`

export const UPDATE_RAZA = gql`
  mutation ActualizarRaza(
    $id: ID!
    $nombre: String
    $orientacion: String
    $origen: String
    $activo: Boolean
  ) {
    actualizarRaza(
      id: $id
      nombre: $nombre
      orientacion: $orientacion
      origen: $origen
      activo: $activo
    ) {
      raza {
        id
        nombre
        orientacion
        origen
        activo
      }
      success
      message
    }
  }
`

export const DELETE_RAZA = gql`
  mutation EliminarRaza($id: ID!) {
    eliminarRaza(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - CATEGORIAS ANIMALES
// ==========================================

export const CREATE_CATEGORIA_ANIMAL = gql`
  mutation CrearCategoriaAnimal(
    $nombre: String!
    $descripcion: String
    $sexoAplica: String
    $edadMinMeses: Int
    $edadMaxMeses: Int
    $pesoMinKg: Decimal
    $pesoMaxKg: Decimal
    $tipoProduccion: String
    $permiteLactancia: Boolean
    $permiteReproduccion: Boolean
    $orden: Int
  ) {
    crearCategoriaAnimal(
      nombre: $nombre
      descripcion: $descripcion
      sexoAplica: $sexoAplica
      edadMinMeses: $edadMinMeses
      edadMaxMeses: $edadMaxMeses
      pesoMinKg: $pesoMinKg
      pesoMaxKg: $pesoMaxKg
      tipoProduccion: $tipoProduccion
      permiteLactancia: $permiteLactancia
      permiteReproduccion: $permiteReproduccion
      orden: $orden
    ) {
      categoria {
        id
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_CATEGORIA_ANIMAL = gql`
  mutation ActualizarCategoriaAnimal(
    $id: ID!
    $nombre: String
    $descripcion: String
    $sexoAplica: String
    $edadMinMeses: Int
    $edadMaxMeses: Int
    $pesoMinKg: Decimal
    $pesoMaxKg: Decimal
    $tipoProduccion: String
    $permiteLactancia: Boolean
    $permiteReproduccion: Boolean
    $orden: Int
    $activo: Boolean
  ) {
    actualizarCategoriaAnimal(
      id: $id
      nombre: $nombre
      descripcion: $descripcion
      sexoAplica: $sexoAplica
      edadMinMeses: $edadMinMeses
      edadMaxMeses: $edadMaxMeses
      pesoMinKg: $pesoMinKg
      pesoMaxKg: $pesoMaxKg
      tipoProduccion: $tipoProduccion
      permiteLactancia: $permiteLactancia
      permiteReproduccion: $permiteReproduccion
      orden: $orden
      activo: $activo
    ) {
      categoria {
        id
        nombre
        activo
      }
      success
      message
    }
  }
`

export const DELETE_CATEGORIA_ANIMAL = gql`
  mutation EliminarCategoriaAnimal($id: ID!) {
    eliminarCategoriaAnimal(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - VETERINARIOS
// ==========================================

export const CREATE_VETERINARIO = gql`
  mutation CrearVeterinario(
    $fincaId: ID!
    $nombre: String!
    $apellidos: String
    $ci: String
    $especialidad: String
    $telefono: String
    $email: String
    $matriculaProfesional: String
    $tipoServicio: String
    $costoVisita: Decimal
    $direccion: String
    $observaciones: String
  ) {
    crearVeterinario(
      fincaId: $fincaId
      nombre: $nombre
      apellidos: $apellidos
      ci: $ci
      especialidad: $especialidad
      telefono: $telefono
      email: $email
      matriculaProfesional: $matriculaProfesional
      tipoServicio: $tipoServicio
      costoVisita: $costoVisita
      direccion: $direccion
      observaciones: $observaciones
    ) {
      veterinario {
        id
        nombre
        apellidos
      }
      success
      message
    }
  }
`

export const UPDATE_VETERINARIO = gql`
  mutation ActualizarVeterinario(
    $id: ID!
    $nombre: String
    $apellidos: String
    $ci: String
    $telefono: String
    $email: String
    $especialidad: String
    $matriculaProfesional: String
    $tipoServicio: String
    $costoVisita: Decimal
    $direccion: String
    $observaciones: String
    $activo: Boolean
  ) {
    actualizarVeterinario(
      id: $id
      nombre: $nombre
      apellidos: $apellidos
      ci: $ci
      telefono: $telefono
      email: $email
      especialidad: $especialidad
      matriculaProfesional: $matriculaProfesional
      tipoServicio: $tipoServicio
      costoVisita: $costoVisita
      direccion: $direccion
      observaciones: $observaciones
      activo: $activo
    ) {
      veterinario {
        id
        nombre
        apellidos
        activo
      }
      success
      message
    }
  }
`

export const DELETE_VETERINARIO = gql`
  mutation EliminarVeterinario($id: ID!) {
    eliminarVeterinario(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - REPRODUCTORES
// ==========================================

export const CREATE_REPRODUCTOR = gql`
  mutation CrearReproductor(
    $fincaId: ID!
    $razaId: ID
    $animalInternoId: ID
    $codigo: String!
    $nombre: String
    $tipoOrigen: String!
    $tipoReproductor: String
    $codigoPajuela: String
    $laboratorio: String
    $stockPajuelas: Int
    $costoPajuela: Decimal
    $facilidadParto: Decimal
    $valorGenetico: Decimal
    $observaciones: String
  ) {
    crearReproductor(
      fincaId: $fincaId
      razaId: $razaId
      animalInternoId: $animalInternoId
      codigo: $codigo
      nombre: $nombre
      tipoOrigen: $tipoOrigen
      tipoReproductor: $tipoReproductor
      codigoPajuela: $codigoPajuela
      laboratorio: $laboratorio
      stockPajuelas: $stockPajuelas
      costoPajuela: $costoPajuela
      facilidadParto: $facilidadParto
      valorGenetico: $valorGenetico
      observaciones: $observaciones
    ) {
      reproductor {
        id
        codigo
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_REPRODUCTOR = gql`
  mutation ActualizarReproductor(
    $id: ID!
    $razaId: ID
    $animalInternoId: ID
    $nombre: String
    $tipoOrigen: String
    $tipoReproductor: String
    $codigoPajuela: String
    $laboratorio: String
    $stockPajuelas: Int
    $costoPajuela: Decimal
    $facilidadParto: Decimal
    $valorGenetico: Decimal
    $observaciones: String
    $activo: Boolean
  ) {
    actualizarReproductor(
      id: $id
      razaId: $razaId
      animalInternoId: $animalInternoId
      nombre: $nombre
      tipoOrigen: $tipoOrigen
      tipoReproductor: $tipoReproductor
      codigoPajuela: $codigoPajuela
      laboratorio: $laboratorio
      stockPajuelas: $stockPajuelas
      costoPajuela: $costoPajuela
      facilidadParto: $facilidadParto
      valorGenetico: $valorGenetico
      observaciones: $observaciones
      activo: $activo
    ) {
      reproductor {
        id
        nombre
        activo
      }
      success
      message
    }
  }
`

export const DELETE_REPRODUCTOR = gql`
  mutation EliminarReproductor($id: ID!) {
    eliminarReproductor(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// MUTATIONS - VACUNAS
// ==========================================

export const CREATE_VACUNA = gql`
  mutation CrearVacuna(
    $fincaId: ID!
    $nombre: String!
    $descripcion: String
    $enfermedadPreviene: String
    $laboratorio: String
    $dosisRecomendada: String!
    $viaAplicacion: String!
    $intervaloDias: Int
    $edadMinimaMeses: Int
    $requiereRefuerzo: Boolean
    $diasAnticipacionAlerta: Int
    $sexoAplicable: String
    $tipoProduccionAplicable: String
    $stockCantidad: Decimal
    $stockMinimo: Decimal
    $lote: String
    $fechaVencimiento: Date
    $observacionesTecnicas: String
  ) {
    crearVacuna(
      fincaId: $fincaId
      nombre: $nombre
      descripcion: $descripcion
      enfermedadPreviene: $enfermedadPreviene
      laboratorio: $laboratorio
      dosisRecomendada: $dosisRecomendada
      viaAplicacion: $viaAplicacion
      intervaloDias: $intervaloDias
      edadMinimaMeses: $edadMinimaMeses
      requiereRefuerzo: $requiereRefuerzo
      diasAnticipacionAlerta: $diasAnticipacionAlerta
      sexoAplicable: $sexoAplicable
      tipoProduccionAplicable: $tipoProduccionAplicable
      stockCantidad: $stockCantidad
      stockMinimo: $stockMinimo
      lote: $lote
      fechaVencimiento: $fechaVencimiento
      observacionesTecnicas: $observacionesTecnicas
    ) {
      vacuna {
        id
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_VACUNA = gql`
  mutation ActualizarVacuna(
    $id: ID!
    $nombre: String
    $descripcion: String
    $enfermedadPreviene: String
    $laboratorio: String
    $dosisRecomendada: String
    $viaAplicacion: String
    $intervaloDias: Int
    $edadMinimaMeses: Int
    $requiereRefuerzo: Boolean
    $diasAnticipacionAlerta: Int
    $sexoAplicable: String
    $tipoProduccionAplicable: String
    $stockCantidad: Decimal
    $stockMinimo: Decimal
    $lote: String
    $fechaVencimiento: Date
    $observacionesTecnicas: String
    $activo: Boolean
  ) {
    actualizarVacuna(
      id: $id
      nombre: $nombre
      descripcion: $descripcion
      enfermedadPreviene: $enfermedadPreviene
      laboratorio: $laboratorio
      dosisRecomendada: $dosisRecomendada
      viaAplicacion: $viaAplicacion
      intervaloDias: $intervaloDias
      edadMinimaMeses: $edadMinimaMeses
      requiereRefuerzo: $requiereRefuerzo
      diasAnticipacionAlerta: $diasAnticipacionAlerta
      sexoAplicable: $sexoAplicable
      tipoProduccionAplicable: $tipoProduccionAplicable
      stockCantidad: $stockCantidad
      stockMinimo: $stockMinimo
      lote: $lote
      fechaVencimiento: $fechaVencimiento
      observacionesTecnicas: $observacionesTecnicas
      activo: $activo
    ) {
      vacuna {
        id
        nombre
        activo
      }
      success
      message
    }
  }
`

export const DELETE_VACUNA = gql`
  mutation EliminarVacuna($id: ID!) {
    eliminarVacuna(id: $id) {
      success
      message
    }
  }
`
