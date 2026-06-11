// frontend/src/graphql/configuracion.js
import { gql } from '@apollo/client'

// ==========================================
// QUERIES
// ==========================================

export const GET_CONFIGURACION = gql`
  query GetConfiguracion {
    configuracionSistema {
      id
      nombreSistema
      tema
      idioma
      moneda
      simboloMoneda
      formatoFecha
      intentosLogin
      tiempoBloqueoMin
      jwtExpirationHoras
      jwtRefreshExpirationDias
      requerir2fa
      complejidadContrasena
      caducidadContrasenaDias
      registroAcciones
      emailSmtpHost
      emailSmtpPort
      emailSmtpUser
      emailUseTls
      emailFrom
      piePaginaReportes
      formatoPorDefecto
      maxRegistrosReporte
      backupAutomatico
      frecuenciaBackup
      horaBackup
      retencionBackupDias
      moduloSanidad
      moduloReproduccion
      moduloProduccion
      moduloRrhh
      moduloCompras
      moduloVentas
      moduloAlertas
      moduloProveedores
      moduloClientes
      moduloBajas
      diasGestacion
      diasLactancia
      edadDesteteDias
      pesoMinDesteteKg
    }
  }
`

export const GET_LOGS_ACTIVIDAD = gql`
  query GetLogsActividad($limit: Int, $offset: Int) {
    logsActividad(limit: $limit, offset: $offset) {
      id
      usuario {
        id
        username
        email
      }
      accion
      modulo
      descripcion
      ip
      userAgent
      fecha
    }
  }
`

// ==========================================
// MUTATIONS
// ==========================================

export const ACTUALIZAR_CONFIGURACION = gql`
  mutation ActualizarConfiguracion(
    $nombreSistema: String
    $tema: String
    $idioma: String
    $moneda: String
    $simboloMoneda: String
    $formatoFecha: String
    $intentosLogin: Int
    $tiempoBloqueoMin: Int
    $jwtExpirationHoras: Int
    $jwtRefreshExpirationDias: Int
    $requerir2fa: Boolean
    $complejidadContrasena: String
    $caducidadContrasenaDias: Int
    $registroAcciones: Boolean
    $emailSmtpHost: String
    $emailSmtpPort: Int
    $emailSmtpUser: String
    $emailSmtpPassword: String
    $emailUseTls: Boolean
    $emailFrom: String
    $piePaginaReportes: String
    $formatoPorDefecto: String
    $maxRegistrosReporte: Int
    $backupAutomatico: Boolean
    $frecuenciaBackup: String
    $horaBackup: Time
    $retencionBackupDias: Int
    $moduloSanidad: Boolean
    $moduloReproduccion: Boolean
    $moduloProduccion: Boolean
    $moduloRrhh: Boolean
    $moduloCompras: Boolean
    $moduloVentas: Boolean
    $moduloAlertas: Boolean
    $moduloProveedores: Boolean
    $moduloClientes: Boolean
    $moduloBajas: Boolean
    $diasGestacion: Int
    $diasLactancia: Int
    $edadDesteteDias: Int
    $pesoMinDesteteKg: Decimal
  ) {
    actualizarConfiguracionSistema(
      nombreSistema: $nombreSistema
      tema: $tema
      idioma: $idioma
      moneda: $moneda
      simboloMoneda: $simboloMoneda
      formatoFecha: $formatoFecha
      intentosLogin: $intentosLogin
      tiempoBloqueoMin: $tiempoBloqueoMin
      jwtExpirationHoras: $jwtExpirationHoras
      jwtRefreshExpirationDias: $jwtRefreshExpirationDias
      requerir2fa: $requerir2fa
      complejidadContrasena: $complejidadContrasena
      caducidadContrasenaDias: $caducidadContrasenaDias
      registroAcciones: $registroAcciones
      emailSmtpHost: $emailSmtpHost
      emailSmtpPort: $emailSmtpPort
      emailSmtpUser: $emailSmtpUser
      emailSmtpPassword: $emailSmtpPassword
      emailUseTls: $emailUseTls
      emailFrom: $emailFrom
      piePaginaReportes: $piePaginaReportes
      formatoPorDefecto: $formatoPorDefecto
      maxRegistrosReporte: $maxRegistrosReporte
      backupAutomatico: $backupAutomatico
      frecuenciaBackup: $frecuenciaBackup
      horaBackup: $horaBackup
      retencionBackupDias: $retencionBackupDias
      moduloSanidad: $moduloSanidad
      moduloReproduccion: $moduloReproduccion
      moduloProduccion: $moduloProduccion
      moduloRrhh: $moduloRrhh
      moduloCompras: $moduloCompras
      moduloVentas: $moduloVentas
      moduloAlertas: $moduloAlertas
      moduloProveedores: $moduloProveedores
      moduloClientes: $moduloClientes
      moduloBajas: $moduloBajas
      diasGestacion: $diasGestacion
      diasLactancia: $diasLactancia
      edadDesteteDias: $edadDesteteDias
      pesoMinDesteteKg: $pesoMinDesteteKg
    ) {
      configuracion {
        id
        nombreSistema
      }
      success
      message
    }
  }
`

export const REGISTRAR_LOG = gql`
  mutation RegistrarLogActividad($accion: String!, $modulo: String!, $descripcion: String!) {
    registrarLogActividad(accion: $accion, modulo: $modulo, descripcion: $descripcion) {
      success
      message
    }
  }
`