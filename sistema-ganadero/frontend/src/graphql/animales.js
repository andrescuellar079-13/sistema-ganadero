import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_ANIMALES = gql`
  query GetAnimales {
    allAnimales {
      id
      nroArete
      nombre
      sexo
      fechaNacimiento
      estado
      peso
      raza {
        id
        nombre
      }
      categoria {
        id
        nombre
      }
    }
  }
`

export const GET_ANIMALES_PAGINADOS = gql`
  query GetAnimalesPaginados(
    $fincaId: ID
    $pagina: Int
    $porPagina: Int
    $buscar: String
    $estado: String
    $ordenar: String
    $razaId: ID
    $categoriaId: ID
  ) {
    animalesPaginados(
      fincaId: $fincaId
      pagina: $pagina
      porPagina: $porPagina
      buscar: $buscar
      estado: $estado
      ordenar: $ordenar
      razaId: $razaId
      categoriaId: $categoriaId
    ) {
      total
      paginas
      paginaActual
      tieneSiguiente
      tieneAnterior
      animales {
        id
        nroArete
        nombre
        sexo
        fechaNacimiento
        estado
        peso
        origen
        fechaRegistro
        raza { id nombre }
        categoria { id nombre }
      }
    }
  }
`

export const GET_ANIMAL_DETALLE = gql`
  query GetAnimalDetalle($id: ID!) {
    animalDetalle(id: $id) {
      id
      nroArete
      nombre
      sexo
      estado
      origen
      fechaNacimiento
      fechaIngreso
      edadIngresoMeses
      peso
      pesoNacimiento
      tipoProduccion
      color
      observaciones
      raza { id nombre }
      categoria { id nombre }
      padre {
        id nroArete nombre sexo estado
        raza { nombre }
        categoria { nombre }
      }
      madre {
        id nroArete nombre sexo estado
        raza { nombre }
        categoria { nombre }
      }
      descendencia {
        id nroArete nombre sexo fechaNacimiento estado
      }
      registrosPeso {
        id fechaPesaje pesoKg condicionCorporal observacion
      }
      lactancias {
        id numeroLactancia fechaInicio fechaSecado totalLitros promedioDiario estado
      }
      produccionesLeche {
        id fecha turno litros
      }
      inseminaciones {
        id fecha resultado fechaProbableParto numeroServicio
        reproductor { id codigo nombre tipoOrigen }
      }
      diagnosticosPrenez {
        id fecha resultadoPrenez diasGestacion metodo fechaConfirmacion fechaProbableParto
      }
      partos {
        id fechaPartoReal tipoParto numCrias estado
        crias { id nroArete nombre sexo }
      }
      vacunaciones {
        id fechaAplicacion dosisAplicada fechaProxima
        vacuna { nombre }
        veterinario { nombre apellidos }
      }
      tratamientos {
        id fechaInicio fechaFin diagnostico enTratamiento
        medicamento { nombre }
        veterinario { nombre apellidos }
      }
      movimientosParcela {
        id fechaIngreso fechaSalida
        parcela { id nombre estado }
      }
      ventas {
        id precioUnitario pesoVentaKg subTotal
        notaVenta {
          fechaVenta guiaSalida
          cliente { nombre apellidos }
        }
      }
      bajas {
        id fechaBaja tipo causa descripcion pesoEstimadoKg
      }
    }
  }
`

export const GET_ANIMALES_MACHOS = gql`
  query GetAnimalesMachos($fincaId: ID!, $excluirId: ID) {
    animalesMachosParaPadre(fincaId: $fincaId, excluirId: $excluirId) {
      id
      nroArete
      nombre
      estado
    }
  }
`

export const GET_ANIMALES_HEMBRAS = gql`
  query GetAnimalesHembras($fincaId: ID!, $excluirId: ID) {
    animalesHembrasParaMadre(fincaId: $fincaId, excluirId: $excluirId) {
      id
      nroArete
      nombre
      estado
    }
  }
`

export const GET_RAZAS = gql`
  query GetRazas {
    razas {
      id
      nombre
    }
  }
`

export const GET_CATEGORIAS = gql`
  query GetCategorias {
    categoriasAnimales {
      id
      nombre
    }
  }
`

// ==========================================
// MUTATIONS
// ==========================================

export const CREATE_ANIMAL = gql`
  mutation CrearAnimal(
    $fincaId: ID!
    $nroArete: String!
    $nombre: String
    $sexo: String!
    $razaId: ID
    $categoriaId: ID
    $estado: String
    $fechaNacimiento: Date
    $fechaIngreso: Date
    $edadIngresoMeses: Int
    $peso: Decimal
    $pesoNacimiento: Decimal
    $tipoProduccion: String
    $origen: String
    $observaciones: String
    $padreId: ID
    $madreId: ID
  ) {
    crearAnimal(
      fincaId: $fincaId
      nroArete: $nroArete
      nombre: $nombre
      sexo: $sexo
      razaId: $razaId
      categoriaId: $categoriaId
      fechaNacimiento: $fechaNacimiento
      fechaIngreso: $fechaIngreso
      edadIngresoMeses: $edadIngresoMeses
      peso: $peso
      pesoNacimiento: $pesoNacimiento
      tipoProduccion: $tipoProduccion
      origen: $origen
      observaciones: $observaciones
      padreId: $padreId
      madreId: $madreId
    ) {
      animal {
        id
        nroArete
        nombre
      }
      success
      message
    }
  }
`

export const UPDATE_ANIMAL = gql`
  mutation ActualizarAnimal(
    $id: ID!
    $nombre: String
    $sexo: String
    $razaId: ID
    $categoriaId: ID
    $estado: String
    $fechaNacimiento: Date
    $fechaIngreso: Date
    $edadIngresoMeses: Int
    $peso: Decimal
    $pesoNacimiento: Decimal
    $tipoProduccion: String
    $origen: String
    $observaciones: String
    $padreId: ID
    $madreId: ID
  ) {
    actualizarAnimal(
      id: $id
      nombre: $nombre
      sexo: $sexo
      razaId: $razaId
      categoriaId: $categoriaId
      estado: $estado
      fechaNacimiento: $fechaNacimiento
      fechaIngreso: $fechaIngreso
      edadIngresoMeses: $edadIngresoMeses
      peso: $peso
      pesoNacimiento: $pesoNacimiento
      tipoProduccion: $tipoProduccion
      origen: $origen
      observaciones: $observaciones
      padreId: $padreId
      madreId: $madreId
    ) {
      animal {
        id
        nroArete
        nombre
        estado
        peso
      }
      success
      message
    }
  }
`

export const DELETE_ANIMAL = gql`
  mutation EliminarAnimal($id: ID!) {
    eliminarAnimal(id: $id) {
      success
      message
    }
  }
`
