// frontend/src/graphql/animales.js
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

// Query para usar en Sanidad (con fincaId)
export const GET_ANIMALES_SANIDAD = gql`
  query GetAnimalesSanidad($fincaId: ID!) {
    animales(fincaId: $fincaId) {
      id
      nroArete
      nombre
      sexo
      estado
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
    $sexo: String
    $tipoProduccion: String
    $origen: String
    $pesoMin: Decimal
    $pesoMax: Decimal
    $fechaNacimientoDesde: Date
    $fechaNacimientoHasta: Date
    $fechaIngresoDesde: Date
    $fechaIngresoHasta: Date
    $fechaRegistroDesde: Date
    $fechaRegistroHasta: Date
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
      sexo: $sexo
      tipoProduccion: $tipoProduccion
      origen: $origen
      pesoMin: $pesoMin
      pesoMax: $pesoMax
      fechaNacimientoDesde: $fechaNacimientoDesde
      fechaNacimientoHasta: $fechaNacimientoHasta
      fechaIngresoDesde: $fechaIngresoDesde
      fechaIngresoHasta: $fechaIngresoHasta
      fechaRegistroDesde: $fechaRegistroDesde
      fechaRegistroHasta: $fechaRegistroHasta
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
        fechaIngreso
        estado
        peso
        origen
        tipoProduccion
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
      edadMeses
      gananciaDiariaActual
      estadoReproductivo
      proximoParto
      diasAbiertos
      cantidadDescendencia
      promedioPesoHijos
      promedioProduccionHijos
      raza { id nombre }
      categoria { id nombre }
      parcelaActual { id nombre estado }
      ultimoPesaje {
        id fechaPesaje pesoKg gananciaDiaria condicionCorporal
      }
      engordeActivo {
        id fechaInicio pesoInicial pesoObjetivo tipoEngorde loteGrupo estado
        pesoActual diasEnEngorde gananciaDiaria pesoFaltante ultimoPesajeFecha
      }
      alertasActivas {
        id tipo mensaje fechaAlerta prioridad estado moduloOrigen
        fechaVencimiento accionRecomendada diasRestantes vencida
      }
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
      engordes {
        id fechaInicio pesoInicial pesoObjetivo tipoEngorde loteGrupo estado
        pesoActual diasEnEngorde gananciaDiaria pesoFaltante ultimoPesajeFecha
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
      celos {
        id fechaInicio fechaFin tipo intensidad detectadoPor duracionHoras observaciones
      }
      montas {
        id fecha resultado fechaProbableParto numeroServicio duracionDias
        reproductor { id codigo nombre tipoOrigen }
      }
      palpaciones {
        id fecha resultado diasGestacionEstimados observaciones
        veterinario { nombre apellidos }
      }
      destetes {
        id fechaDestete tipo edadDesteteDias pesoCria estadoCria
        cria { id nroArete nombre sexo }
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
      diagnosticosSanitarios {
        id fecha descripcion resultado
        veterinario { nombre apellidos }
        enfermedad { nombre }
      }
      examenes {
        id tipoExamen laboratorio fechaToma fechaResultado resultado esNormal observaciones
      }
      mastitis {
        id fecha cuartoAfectado tipo bacteria recuentoCelsSomaticas seCuro fechaCuracion
      }
      desparasitaciones {
        id fecha tipoParasiticida producto dosis fechaProxima
        veterinario { nombre apellidos }
      }
      tiemposRetiro {
        id tipoRetiro fechaInicio fechaFin diasRetiro activo diasRestantes estaEnRetiro
        tratamiento { id diagnostico }
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

export const EXPORTAR_ANIMALES = gql`
  query ExportarAnimales(
    $fincaId: ID!
    $tipoReporte: String
    $estado: String
    $sexo: String
    $razaId: ID
    $categoriaId: ID
    $tipoProduccion: String
    $origen: String
    $parcelaId: ID
    $fechaNacimientoDesde: Date
    $fechaNacimientoHasta: Date
    $fechaIngresoDesde: Date
    $fechaIngresoHasta: Date
    $fechaVentaDesde: Date
    $fechaVentaHasta: Date
    $fechaBajaDesde: Date
    $fechaBajaHasta: Date
    $limite: Int
    $orden: String
  ) {
    exportarAnimales(
      fincaId: $fincaId
      tipoReporte: $tipoReporte
      estado: $estado
      sexo: $sexo
      razaId: $razaId
      categoriaId: $categoriaId
      tipoProduccion: $tipoProduccion
      origen: $origen
      parcelaId: $parcelaId
      fechaNacimientoDesde: $fechaNacimientoDesde
      fechaNacimientoHasta: $fechaNacimientoHasta
      fechaIngresoDesde: $fechaIngresoDesde
      fechaIngresoHasta: $fechaIngresoHasta
      fechaVentaDesde: $fechaVentaDesde
      fechaVentaHasta: $fechaVentaHasta
      fechaBajaDesde: $fechaBajaDesde
      fechaBajaHasta: $fechaBajaHasta
      limite: $limite
      orden: $orden
    ) {
      total
      mensaje
      items {
        nroArete
        nombre
        sexo
        razaNombre
        categoriaNombre
        peso
        fechaNacimiento
        edadMeses
        tipoProduccion
        origen
        estado
        parcelaActual
        fechaIngreso
        padreArete
        madreArete
        observaciones
        fechaVenta
        clienteNombre
        pesoVenta
        precioUnitario
        subTotal
        guiaSalida
        fechaBaja
        tipoBaja
        causaBaja
        pesoEstimadoBaja
        descripcionBaja
      }
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

// ==========================================
// MOVIMIENTOS DE ANIMAL
// ==========================================

export const GET_MOVIMIENTOS_ANIMAL = gql`
  query GetMovimientosAnimal($animalId: ID!, $limit: Int) {
    movimientosAnimal(animalId: $animalId, limit: $limit) {
      id
      fechaMovimiento
      motivo
      motivoDisplay
      observaciones
      fechaRegistro
      registradoPorNombre
      parcelaOrigen { id nombre estado }
      parcelaDestino { id nombre estado }
    }
  }
`

export const GET_MOVIMIENTOS_FINCA = gql`
  query GetMovimientosFinca(
    $fincaId: ID!
    $animalId: ID
    $desde: Date
    $hasta: Date
    $motivo: String
  ) {
    movimientosFinca(
      fincaId: $fincaId
      animalId: $animalId
      desde: $desde
      hasta: $hasta
      motivo: $motivo
    ) {
      id
      fechaMovimiento
      motivo
      motivoDisplay
      observaciones
      fechaRegistro
      registradoPorNombre
      animal { id nroArete nombre }
      parcelaOrigen { id nombre }
      parcelaDestino { id nombre }
    }
  }
`

export const GET_PARCELAS_FINCA = gql`
  query GetParcelasFinca($fincaId: ID!) {
    parcelas(fincaId: $fincaId) {
      id
      nombre
      estado
    }
  }
`

export const CREATE_MOVIMIENTO_ANIMAL = gql`
  mutation CrearMovimientoAnimal(
    $fincaId: ID!
    $animalId: ID!
    $fechaMovimiento: Date!
    $parcelaOrigenId: ID
    $parcelaDestinoId: ID
    $motivo: String
    $observaciones: String
  ) {
    crearMovimientoAnimal(
      fincaId: $fincaId
      animalId: $animalId
      fechaMovimiento: $fechaMovimiento
      parcelaOrigenId: $parcelaOrigenId
      parcelaDestinoId: $parcelaDestinoId
      motivo: $motivo
      observaciones: $observaciones
    ) {
      movimiento { id fechaMovimiento motivoDisplay }
      success
      message
    }
  }
`

export const UPDATE_MOVIMIENTO_ANIMAL = gql`
  mutation ActualizarMovimientoAnimal(
    $id: ID!
    $fechaMovimiento: Date
    $parcelaOrigenId: ID
    $parcelaDestinoId: ID
    $motivo: String
    $observaciones: String
  ) {
    actualizarMovimientoAnimal(
      id: $id
      fechaMovimiento: $fechaMovimiento
      parcelaOrigenId: $parcelaOrigenId
      parcelaDestinoId: $parcelaDestinoId
      motivo: $motivo
      observaciones: $observaciones
    ) {
      movimiento { id fechaMovimiento motivoDisplay }
      success
      message
    }
  }
`

export const DELETE_MOVIMIENTO_ANIMAL = gql`
  mutation EliminarMovimientoAnimal($id: ID!) {
    eliminarMovimientoAnimal(id: $id) {
      success
      message
    }
  }
`