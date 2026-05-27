// frontend/src/components/ObservacionForm.jsx
import React, { useState } from 'react'
import { useAnimales } from '../hooks/useAnimales'
import { useSanidad } from '../hooks/useSanidad'

const ObservacionForm = ({ onSuccess }) => {
  const { animales } = useAnimales()
  const { crearObservacion } = useSanidad()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    animalId: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await crearObservacion({
      animalId: formData.animalId,
      fecha: formData.fecha,
      descripcion: formData.descripcion
    })

    if (result.success) {
      alert('✅ Observación registrada exitosamente')
      setFormData({
        animalId: '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: ''
      })
      if (onSuccess) onSuccess()
    } else {
      alert(`❌ Error: ${result.error}`)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-teal-800">📝 Nueva Observación Sanitaria</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">Animal *</label>
        <select
          required
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
        <label className="block text-sm font-medium text-gray-700">Observación *</label>
        <textarea
          required
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          rows="4"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Ej: El animal presenta decaimiento, falta de apetito, temperatura elevada..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 disabled:bg-gray-400"
      >
        {loading ? 'Registrando...' : 'Registrar Observación'}
      </button>
    </form>
  )
}

export default ObservacionForm