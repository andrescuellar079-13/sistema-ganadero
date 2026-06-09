// frontend/src/graphql/fincas.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES – FINCAS
// ==========================================

export const GET_FINCAS = gql`
  query GetFincas {
    fincas {
      id
      nombre
      propietario
      departamento
      municipio
      ubicacion
      telefono
      activo
      fechaCreacion
    }
  }
`

export const GET_FINCA = gql`
  query GetFinca($id: ID!) {
    finca(id: $id) {
      id
      nombre
      propietario
      departamento
      municipio
      ubicacion
      telefono
      activo
      fechaCreacion
    }
  }
`

export const GET_FINCA_ACTUAL = gql`
  query GetFincaActual {
    fincaActual {
      id
      nombre
      propietario
      departamento
      municipio
      ubicacion
      telefono
    }
  }
`

// Fincas a las que el usuario actual tiene acceso (para el selector de finca activa)
export const GET_MIS_FINCAS = gql`
  query GetMisFincas {
    misFincas {
      id
      nombre
      municipio
    }
  }
`

export const SELECCIONAR_FINCA_ACTIVA = gql`
  mutation SeleccionarFincaActiva($fincaId: ID!) {
    seleccionarFincaActiva(fincaId: $fincaId) {
      success
      message
      usuario { id finca { id nombre } }
    }
  }
`

// ==========================================
// MUTATIONS – FINCAS
// ==========================================

export const CREATE_FINCA = gql`
  mutation CrearFinca(
    $nombre: String!
    $propietario: String
    $departamento: String
    $municipio: String
    $ubicacion: String
    $telefono: String
  ) {
    crearFinca(
      nombre: $nombre
      propietario: $propietario
      departamento: $departamento
      municipio: $municipio
      ubicacion: $ubicacion
      telefono: $telefono
    ) {
      finca { id nombre }
      success
      message
    }
  }
`

export const UPDATE_FINCA = gql`
  mutation ActualizarFinca(
    $id: ID!
    $nombre: String
    $propietario: String
    $departamento: String
    $municipio: String
    $ubicacion: String
    $telefono: String
    $activo: Boolean
  ) {
    actualizarFinca(
      id: $id
      nombre: $nombre
      propietario: $propietario
      departamento: $departamento
      municipio: $municipio
      ubicacion: $ubicacion
      telefono: $telefono
      activo: $activo
    ) {
      finca { id nombre }
      success
      message
    }
  }
`

export const DELETE_FINCA = gql`
  mutation EliminarFinca($id: ID!) {
    eliminarFinca(id: $id) {
      success
      message
    }
  }
`

// ==========================================
// FRAGMENTS
// ==========================================

const TRANSFERENCIA_FIELDS = gql`
  fragment TransferenciaFields on TransferenciaFincaType {
    id
    fincaOrigen { id nombre }
    fincaDestino { id nombre }
    fechaTransferencia
    motivo
    motivoDisplay
    estado
    estadoDisplay
    observaciones
    responsable
    registradoPorNombre
    fechaRegistro
    fechaConfirmacion
    fechaEnvio
    fechaRecepcion
    motivoRechazo
    totalAnimales
    esOrigen
    esDestino
    puedeRecibir
    puedeCancelar
  }
`

const DETALLE_FIELDS = gql`
  fragment DetalleFields on DetalleTransferenciaType {
    id
    animal {
      id
      nroArete
      nombre
      sexo
      estado
      peso
      raza { id nombre }
      categoria { id nombre }
    }
    parcelaOrigen { id nombre }
    parcelaDestino { id nombre }
    estadoAnimalAntes
    estadoAnimalDespues
    pesoActualTransferencia
    observaciones
    recibido
  }
`

// ==========================================
// QUERIES – TRANSFERENCIAS
// ==========================================

export const GET_TRANSFERENCIAS = gql`
  ${TRANSFERENCIA_FIELDS}
  query GetTransferencias(
    $fincaId: ID
    $estado: String
    $motivo: String
    $fechaDesde: Date
    $fechaHasta: Date
    $buscar: String
    $pagina: Int
    $porPagina: Int
  ) {
    transferenciasFinca(
      fincaId: $fincaId
      estado: $estado
      motivo: $motivo
      fechaDesde: $fechaDesde
      fechaHasta: $fechaHasta
      buscar: $buscar
      pagina: $pagina
      porPagina: $porPagina
    ) {
      resultados { ...TransferenciaFields }
      total
      paginas
      paginaActual
      tieneSiguiente
      tieneAnterior
    }
  }
`

export const GET_TRANSFERENCIA_DETALLE = gql`
  ${TRANSFERENCIA_FIELDS}
  ${DETALLE_FIELDS}
  query GetTransferenciaDetalle($id: ID!) {
    transferenciaFinca(id: $id) {
      ...TransferenciaFields
      detalles { ...DetalleFields }
    }
  }
`

export const GET_ANIMALES_DISPONIBLES_TRANSFERENCIA = gql`
  query GetAnimalesDisponiblesTransferencia(
    $fincaId: ID!
    $buscar: String
    $categoriaId: ID
    $sexo: String
    $parcelaId: ID
  ) {
    animalesDisponiblesTransferencia(
      fincaId: $fincaId
      buscar: $buscar
      categoriaId: $categoriaId
      sexo: $sexo
      parcelaId: $parcelaId
    ) {
      id
      nroArete
      nombre
      sexo
      estado
      peso
      raza { id nombre }
      categoria { id nombre }
      movimientosParcela {
        parcela { id nombre }
        fechaSalida
      }
    }
  }
`

// ==========================================
// MUTATIONS – TRANSFERENCIAS
// ==========================================

export const CREATE_TRANSFERENCIA = gql`
  ${TRANSFERENCIA_FIELDS}
  mutation CrearTransferencia(
    $fincaOrigenId: ID!
    $fincaDestinoId: ID!
    $fechaTransferencia: Date!
    $motivo: String
    $observaciones: String
    $responsable: String
  ) {
    crearTransferencia(
      fincaOrigenId: $fincaOrigenId
      fincaDestinoId: $fincaDestinoId
      fechaTransferencia: $fechaTransferencia
      motivo: $motivo
      observaciones: $observaciones
      responsable: $responsable
    ) {
      transferencia { ...TransferenciaFields }
      success
      message
    }
  }
`

export const UPDATE_TRANSFERENCIA = gql`
  ${TRANSFERENCIA_FIELDS}
  mutation ActualizarTransferencia(
    $id: ID!
    $fincaOrigenId: ID
    $fincaDestinoId: ID
    $fechaTransferencia: Date
    $motivo: String
    $observaciones: String
    $responsable: String
  ) {
    actualizarTransferencia(
      id: $id
      fincaOrigenId: $fincaOrigenId
      fincaDestinoId: $fincaDestinoId
      fechaTransferencia: $fechaTransferencia
      motivo: $motivo
      observaciones: $observaciones
      responsable: $responsable
    ) {
      transferencia { ...TransferenciaFields }
      success
      message
    }
  }
`

export const AGREGAR_ANIMAL_TRANSFERENCIA = gql`
  ${DETALLE_FIELDS}
  mutation AgregarAnimalTransferencia(
    $transferenciaId: ID!
    $animalId: ID!
    $parcelaDestinoId: ID
    $pesoActual: Decimal
    $observaciones: String
  ) {
    agregarAnimalTransferencia(
      transferenciaId: $transferenciaId
      animalId: $animalId
      parcelaDestinoId: $parcelaDestinoId
      pesoActual: $pesoActual
      observaciones: $observaciones
    ) {
      detalle { ...DetalleFields }
      success
      message
    }
  }
`

export const ACTUALIZAR_DETALLE_TRANSFERENCIA = gql`
  ${DETALLE_FIELDS}
  mutation ActualizarDetalleTransferencia(
    $detalleId: ID!
    $parcelaDestinoId: ID
    $pesoActual: Decimal
    $observaciones: String
  ) {
    actualizarDetalleTransferencia(
      detalleId: $detalleId
      parcelaDestinoId: $parcelaDestinoId
      pesoActual: $pesoActual
      observaciones: $observaciones
    ) {
      detalle { ...DetalleFields }
      success
      message
    }
  }
`

export const QUITAR_ANIMAL_TRANSFERENCIA = gql`
  mutation QuitarAnimalTransferencia($detalleId: ID!) {
    quitarAnimalTransferencia(detalleId: $detalleId) {
      success
      message
    }
  }
`

export const CONFIRMAR_TRANSFERENCIA = gql`
  ${TRANSFERENCIA_FIELDS}
  mutation ConfirmarTransferencia($id: ID!) {
    confirmarTransferencia(id: $id) {
      transferencia { ...TransferenciaFields }
      success
      message
    }
  }
`

export const CANCELAR_TRANSFERENCIA = gql`
  ${TRANSFERENCIA_FIELDS}
  mutation CancelarTransferencia($id: ID!) {
    cancelarTransferencia(id: $id) {
      transferencia { ...TransferenciaFields }
      success
      message
    }
  }
`

export const MARCAR_TRANSFERENCIA_RECIBIDA = gql`
  ${TRANSFERENCIA_FIELDS}
  mutation MarcarTransferenciaRecibida($id: ID!) {
    marcarTransferenciaRecibida(id: $id) {
      transferencia { ...TransferenciaFields }
      success
      message
    }
  }
`

// --- Flujo de recepción multi-tenant ---

export const ENVIAR_TRANSFERENCIA = gql`
  ${TRANSFERENCIA_FIELDS}
  mutation EnviarTransferencia($id: ID!, $recepcionInmediata: Boolean) {
    enviarTransferencia(id: $id, recepcionInmediata: $recepcionInmediata) {
      transferencia { ...TransferenciaFields }
      success
      message
    }
  }
`

export const ACEPTAR_TRANSFERENCIA = gql`
  ${TRANSFERENCIA_FIELDS}
  mutation AceptarTransferencia($id: ID!) {
    aceptarTransferencia(id: $id) {
      transferencia { ...TransferenciaFields }
      success
      message
    }
  }
`

export const RECHAZAR_TRANSFERENCIA = gql`
  ${TRANSFERENCIA_FIELDS}
  mutation RechazarTransferencia($id: ID!, $motivoRechazo: String) {
    rechazarTransferencia(id: $id, motivoRechazo: $motivoRechazo) {
      transferencia { ...TransferenciaFields }
      success
      message
    }
  }
`
