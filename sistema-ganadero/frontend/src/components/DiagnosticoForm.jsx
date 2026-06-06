// frontend/src/components/DiagnosticoForm.jsx
import React, { useState } from 'react'
import { useAnimales } from '../hooks/useAnimales'
import { useCatalogos } from '../hooks/useCatalogos'
import { useSanidad } from '../hooks/useSanidad'

const DiagnosticoForm = ({ onSuccess }) => {
  const { animales } = useAnimales()
  const { veterinarios } = useCatalogos()
  const { crearDiagnostico } = useSanidad()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    animalId: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    veterinarioId: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await crearDiagnostico({
      animalId: formData.animalId,
      fecha: formData.fecha,
      descripcion: formData.descripcion,
      veterinarioId: formData.veterinarioId || null
    })

    if (result.success) {
      alert('✅ Diagnóstico registrado exitosamente')
      setFormData({
        animalId: '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        veterinarioId: ''
      })
      if (onSuccess) onSuccess()
    } else {
      alert(`❌ Error: ${result.error}`)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-purple-800">📋 Nuevo Diagnóstico Clínico</h2>

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
          <label className="block text-sm font-medium text-gray-700">Veterinario</label>
          <select
            value={formData.veterinarioId}
            onChange={(e) => setFormData({ ...formData, veterinarioId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">Seleccionar</option>
            {veterinarios.filter(v => v.activo).map(v => (
              <option key={v.id} value={v.id}>{v.nombre} {v.apellidos}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción del Diagnóstico *</label>
        <textarea
          required
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          rows="4"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Describa el diagnóstico, síntomas, hallazgos..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
      >
        {loading ? 'Registrando...' : 'Registrar Diagnóstico'}
      </button>
    </form>
  )
}

export default DiagnosticoForm