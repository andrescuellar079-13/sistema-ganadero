import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  MODOS, previsualizar, confirmar, descargarPlantilla,
} from './importacionService'
import { API_BASE_URL } from '../utils/constants'

describe('importacionService', () => {
  beforeEach(() => {
    globalThis.localStorage = {
      store: { token: 'tok123' },
      getItem(k) { return this.store[k] ?? null },
    }
  })

  it('deriva API_BASE_URL sin el sufijo /graphql/', () => {
    expect(API_BASE_URL.endsWith('/graphql')).toBe(false)
    expect(API_BASE_URL.endsWith('/graphql/')).toBe(false)
  })

  it('expone los tres modos de importación', () => {
    expect(MODOS.map((m) => m.value)).toEqual([
      'SOLO_CREAR', 'ACTUALIZAR_EXISTENTES', 'CREAR_O_ACTUALIZAR',
    ])
  })

  it('previsualizar envía multipart con token JWT y campos correctos', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, importacion_id: 7, filas_validas: 3 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const archivo = { name: 'datos.xlsx' }
    const r = await previsualizar({
      fincaId: 5, archivo, modo: 'SOLO_CREAR', modoEstricto: true,
    })

    expect(r.ok).toBe(true)
    expect(r.importacion_id).toBe(7)
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/importaciones/previsualizar/')
    expect(opts.method).toBe('POST')
    expect(opts.headers.Authorization).toBe('JWT tok123')
    expect(opts.body).toBeInstanceOf(FormData)
    expect(opts.body.get('finca_id')).toBe('5')
    expect(opts.body.get('modo')).toBe('SOLO_CREAR')
    expect(opts.body.get('modo_estricto')).toBe('true')
  })

  it('confirmar manda JSON con el id y devuelve el error del backend en fallos', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 400,
      json: async () => ({ ok: false, mensaje: 'Modo estricto: cancelado.' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const r = await confirmar(9)
    expect(r.ok).toBe(false)
    expect(r.mensaje).toBe('Modo estricto: cancelado.')
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/importaciones/confirmar/')
    expect(JSON.parse(opts.body)).toEqual({ importacion_id: 9 })
    expect(opts.headers['Content-Type']).toBe('application/json')
  })

  it('descargarPlantilla lanza si el backend responde error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 401,
      json: async () => ({ ok: false, mensaje: 'No autenticado.' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    await expect(descargarPlantilla()).rejects.toThrow('No autenticado.')
  })
})
