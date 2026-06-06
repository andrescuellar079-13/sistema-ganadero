// frontend/src/components/GastoForm.jsx
import React, { useState } from 'react'
import { useAnimales } from '../hooks/useAnimales'
import { useAlertas } from '../hooks/useAlertas'

const GastoForm = ({ onSuccess }) => {
  const { animales } = useAnimales()
  const { crearGasto } = useAlertas()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipoGasto: 'OTRO',
    descripcion: '',
    cantidad: 1,
    precioUnitario: '',
    animalId: ''
  })

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await crearGasto({
      fecha: formData.fecha,
      tipoGasto: formData.tipoGasto,
      descripcion: formData.descripcion,
      cantidad: parseFloat(formData.cantidad),
      precioUnitario: parseFloat(formData.precioUnitario),
      animalId: formData.animalId || null
    })

    if (result.success) {
      alert('✅ Gasto registrado exitosamente')
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        tipoGasto: 'OTRO',
        descripcion: '',
        cantidad: 1,
        precioUnitario: '',
        animalId: ''
      })
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
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de Gasto *</label>
          <select
            required
            value={formData.tipoGasto}
            onChange={(e) => setFormData({ ...formData, tipoGasto: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, precioUnitario: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Animal (opcional)</label>
        <select
          value={formData.animalId}
          onChange={(e) => setFormData({ ...formData, animalId: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Seleccionar animal</option>
          {animales.map(a => (
            <option key={a.id} value={a.id}>{a.nroArete} - {a.nombre || 'Sin nombre'}</option>
          ))}
        </select>
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