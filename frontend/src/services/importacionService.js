// Cliente de los endpoints multipart de importación masiva.
// Usa fetch + el token JWT de localStorage (mismo que Apollo).
import { saveAs } from 'file-saver'
import { API_BASE_URL } from '../utils/constants'

const BASE = `${API_BASE_URL}/api/importaciones`

function authHeaders(extra = {}) {
  const token = localStorage.getItem('token')
  return {
    ...extra,
    ...(token ? { Authorization: `JWT ${token}` } : {}),
  }
}

async function parseJson(resp) {
  let data
  try {
    data = await resp.json()
  } catch {
    data = null
  }
  if (!resp.ok) {
    const mensaje = data?.mensaje || `Error ${resp.status}`
    return { ok: false, mensaje, ...(data || {}) }
  }
  return data
}

// Paso 2 — descargar la plantilla XLSX.
export async function descargarPlantilla() {
  const resp = await fetch(`${BASE}/plantilla/`, { headers: authHeaders() })
  if (!resp.ok) {
    const err = await parseJson(resp)
    throw new Error(err.mensaje || 'No se pudo descargar la plantilla.')
  }
  const blob = await resp.blob()
  saveAs(blob, 'plantilla_importacion_ganadera.xlsx')
}

// Subir archivo y previsualizar (validación + mapeo + catálogos nuevos).
export async function previsualizar({
  fincaId, archivo, modo, modoEstricto,
  crearRazas = false, crearCategorias = false, crearParcelas = false,
}) {
  const form = new FormData()
  form.append('finca_id', String(fincaId))
  form.append('modo', modo)
  form.append('modo_estricto', modoEstricto ? 'true' : 'false')
  form.append('crear_razas', crearRazas ? 'true' : 'false')
  form.append('crear_categorias', crearCategorias ? 'true' : 'false')
  form.append('crear_parcelas', crearParcelas ? 'true' : 'false')
  form.append('archivo', archivo)

  const resp = await fetch(`${BASE}/previsualizar/`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  return parseJson(resp)
}

// Paso 6 — confirmar e importar.
export async function confirmar(importacionId) {
  const resp = await fetch(`${BASE}/confirmar/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ importacion_id: importacionId }),
  })
  return parseJson(resp)
}

// Cancelar una previsualización no confirmada.
export async function cancelar(importacionId) {
  const resp = await fetch(`${BASE}/cancelar/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ importacion_id: importacionId }),
  })
  return parseJson(resp)
}

// Descargar el reporte de errores XLSX de una importación.
export async function descargarReporteErrores(importacionId) {
  const resp = await fetch(`${BASE}/${importacionId}/errores/`, {
    headers: authHeaders(),
  })
  if (!resp.ok) {
    const err = await parseJson(resp)
    throw new Error(err.mensaje || 'No se pudo descargar el reporte.')
  }
  const blob = await resp.blob()
  saveAs(blob, `errores_importacion_${importacionId}.xlsx`)
}

export const MODOS = [
  { value: 'SOLO_CREAR', label: 'Solo crear nuevos',
    descripcion: 'Agrega registros nuevos. Rechaza aretes que ya existen.' },
  { value: 'ACTUALIZAR_EXISTENTES', label: 'Actualizar existentes',
    descripcion: 'Actualiza animales que ya existen. Ignora los que no existen.' },
  { value: 'CREAR_O_ACTUALIZAR', label: 'Crear o actualizar',
    descripcion: 'Crea los nuevos y actualiza los existentes.' },
]
