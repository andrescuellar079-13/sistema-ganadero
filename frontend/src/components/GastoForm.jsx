// frontend/src/components/GastoForm.jsx
import React, { useState } from 'react'
import { useAnimales } from '../hooks/useAnimales'
import { useParcelas } from '../hooks/useParcelas'
import { useAlertas } from '../hooks/useAlertas'

const EMPTY = {
  fecha: new Date().toISOString().split('T')[0],
  tipoGasto: 'OTRO',
  descripcion: '',
  cantidad: 1,
  precioUnitario: '',
  animalId: '',
  centroCosto: '',
  metodoPago: '',
  parcelaId: '',
  proveedor: '',
  comprobante: '',
  observaciones: '',
}

const GastoForm = ({ onSuccess }) => {
  const { animales } = useAnimales()
  const { parcelas } = useParcelas()
  const { crearGasto } = useAlertas()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(EMPTY)

  const tiposGasto = [
    { value: 'SANIDAD', label: '🩺 Sanidad' },
    { value: 'REPRODUCCION', label: '🐄 Reproducción' },
    { value: 'ALIMENTO', label: '🍖 Alimento' },
    { value: 'MANO_DE_OBRA', label: '👨‍🌾 Mano de obra' },
    { value: 'TRANSPORTE', label: '🚚 Transporte' },
    { value: 'MANTENIMIENTO', label: '🔧 Mantenimiento' },
    { value: 'COMBUSTIBLE', label: '⛽ Combustible' },
    { value: 'OTRO', label: '📋 Otro' },
  ]

  const centrosCosto = [
    { value: 'SANIDAD', label: 'Sanidad' },
    { value: 'REPRODUCCION', label: 'Reproducción' },
    { value: 'ALIMENTACION', label: 'Alimentación' },
    { value: 'MANO_DE_OBRA', label: 'Mano de obra' },
    { value: 'PARCELA', label: 'Parcela' },
    { value: 'FINCA', label: 'Finca' },
    { value: 'COMERCIO', label: 'Comercio' },
    { value: 'OTRO', label: 'Otro' },
  ]

  const metodosPago = [
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TRANSFERENCIA', label: 'Transferencia' },
    { value: 'CREDITO', label: 'Crédito' },
    { value: 'OTRO', label: 'Otro' },
  ]

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await crearGasto({
      fecha: formData.fecha,
      tipoGasto: formData.tipoGasto,
      descripcion: formData.descripcion,
      cantidad: parseFloat(formData.cantidad),
      precioUnitario: parseFloat(formData.precioUnitario),
      animalId: formData.animalId || null,
      centroCosto: formData.centroCosto || null,
      metodoPago: formData.metodoPago || null,
      parcelaId: formData.parcelaId || null,
      proveedor: formData.proveedor || null,
      comprobante: formData.comprobante || null,
      observaciones: formData.observaciones || null,
    })

    if (result.success) {
      alert('✅ Gasto registrado exitosamente')
      setFormData(EMPTY)
      if (onSuccess) onSuccess()
    } else {
      alert(`❌ Error: ${result.error}`)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-red-800">💰 Nuevo Gasto</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha *</label>
          <input
            type="date"
            required
            value={formData.fecha}
            onChange={set('fecha')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de Gasto *</label>
          <select
            required
            value={formData.tipoGasto}
            onChange={set('tipoGasto')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            {tiposGasto.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción *</label>
        <textarea
          required
          value={formData.descripcion}
          onChange={set('descripcion')}
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Ej: Compra de vacunas, Consulta veterinaria, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cantidad</label>
          <input
            type="number"
            step="1"
            value={formData.cantidad}
            onChange={set('cantidad')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Precio Unitario (Bs) *</label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.precioUnitario}
            onChange={set('precioUnitario')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>

      {/* Campos opcionales adicionales */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Centro de costo</label>
          <select
            value={formData.centroCosto}
            onChange={set('centroCosto')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">— Sin asignar —</option>
            {centrosCosto.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Método de pago</label>
          <select
            value={formData.metodoPago}
            onChange={set('metodoPago')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">— Sin asignar —</option>
            {metodosPago.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Proveedor (opcional)</label>
          <input
            type="text"
            value={formData.proveedor}
            onChange={set('proveedor')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Nombre del proveedor"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">N° comprobante (opcional)</label>
          <input
            type="text"
            value={formData.comprobante}
            onChange={set('comprobante')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Factura / recibo"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Animal (opcional)</label>
          <select
            value={formData.animalId}
            onChange={set('animalId')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">Seleccionar animal</option>
            {animales.map(a => (
              <option key={a.id} value={a.id}>{a.nroArete} - {a.nombre || 'Sin nombre'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Parcela (opcional)</label>
          <select
            value={formData.parcelaId}
            onChange={set('parcelaId')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">Seleccionar parcela</option>
            {parcelas.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Observaciones (opcional)</label>
        <textarea
          value={formData.observaciones}
          onChange={set('observaciones')}
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400"
      >
        {loading ? 'Registrando...' : 'Registrar Gasto'}
      </button>
    </form>
  )
}

export default GastoForm
