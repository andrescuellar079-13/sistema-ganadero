// Constantes del módulo RRHH (Fase 1).
// Mantener sincronizado con backend/rrhh/models.py (TIPO_EMPLEADO_CHOICES, ESTADO_LABORAL_CHOICES).

// Tipo de empleado / rol operativo. Base para relacionar con otros módulos:
//  - VETERINARIO / ENCARGADO_SANIDAD → Sanidad / Vacunaciones
//  - ORDENADOR / ENCARGADO_PRODUCCION → Producción de leche
//  - ENCARGADO_COMPRAS → Compras / Inventario
//  - ADMINISTRADOR → Transferencias, Ventas y Finca
export const TIPOS_EMPLEADO = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'VAQUERO', label: 'Vaquero' },
  { value: 'VETERINARIO', label: 'Veterinario' },
  { value: 'ORDENADOR', label: 'Ordeñador' },
  { value: 'ENCARGADO_COMPRAS', label: 'Encargado de Compras' },
  { value: 'ENCARGADO_SANIDAD', label: 'Encargado de Sanidad' },
  { value: 'ENCARGADO_PRODUCCION', label: 'Encargado de Producción' },
  { value: 'OTRO', label: 'Otro' },
]

export const ESTADOS_LABORALES = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'LICENCIA', label: 'Licencia' },
  { value: 'SUSPENDIDO', label: 'Suspendido' },
  { value: 'RETIRADO', label: 'Retirado' },
]

export const tipoEmpleadoLabel = (value) =>
  TIPOS_EMPLEADO.find((t) => t.value === value)?.label || value || '—'

export const estadoLaboralLabel = (value) =>
  ESTADOS_LABORALES.find((e) => e.value === value)?.label || value || '—'
