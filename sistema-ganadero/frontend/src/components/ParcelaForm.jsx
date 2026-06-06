// frontend/src/components/ParcelaForm.jsx
import React, { useState } from 'react'

const ParcelaForm = ({ parcelaParaEditar, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: parcelaParaEditar?.nombre || '',
    tamano: parcelaParaEditar?.tamano || '',
    capacidadMaxima: parcelaParaEditar?.capacidadMaxima || '',
    tipoPastura: parcelaParaEditar?.tipoPastura || '',
    estado: parcelaParaEditar?.estado || 'LIBRE'
  })

  const tiposPastura = [
    { value: 'BRAQUIARIA', label: '🌾 Braquiaria' },
    { value: 'ELEFANTE', label: '🐘 Pasto Elefante' },
    { value: 'PANICUM', label: '🌿 Panicum' },
    { value: 'RYEGRASS', label: '🍃 Ryegrass' },
    { value: 'ALFALFA', label: '🌱 Alfalfa' },
    { value: 'MIXTO', label: '🔄 Mixto' },
    { value: 'OTRO', label: '📋 Otro' },
  ]

  const estados = [
    { value: 'LIBRE',    label: '✅ Libre'    },
    { value: 'DESCANSO', label: '😴 Descanso' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit({
      nombre: formData.nombre,
      tamano: parseFloat(formData.tamano) || 0,
      capacidadMaxima: parseInt(formData.capacidadMaxima) || 0,
      tipoPastura: formData.tipoPastura,
      estado: formData.estado
    })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6">
      <h2 className="text-xl font-bold text-green-800 mb-4">
        {parcelaParaEditar ? '✏️ Editar Parcela' : '📍 Nueva Parcela'}
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input
          type="text"
          required
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Ej: Potrero Norte"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño (ha)</label>
          <input
            type="number"
            step="0.01"
            value={formData.tamano}
            onChange={(e) => setFormData({ ...formData, tamano: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad Máxima</label>
          <input
            type="number"
            value={formData.capacidadMaxima}
            onChange={(e) => setFormData({ ...formData, capacidadMaxima: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pastura</label>
          <select
            value={formData.tipoPastura}
            onChange={(e) => setFormData({ ...formData, tipoPastura: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Seleccionar</option>
            {tiposPastura.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {estados.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Guardando...' : (parcelaParaEditar ? 'Actualizar' : 'Crear')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default ParcelaForm