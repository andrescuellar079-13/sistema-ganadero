// frontend/src/components/LactanciaForm.jsx
import React, { useState } from 'react'
import { useAnimales } from '../hooks/useAnimales'
import { useReproduccion } from '../hooks/useReproduccion'
import { useProduccion } from '../hooks/useProduccion'

const LactanciaForm = ({ onSuccess }) => {
  const { animales } = useAnimales()
  const { reproducciones } = useReproduccion()
  const { crearLactancia } = useProduccion()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vacaId: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    numeroLactancia: 1,
    reproduccionId: '',
    observaciones: ''
  })
  
  // Solo hembras activas que no tienen lactancia activa
  const vacasDisponibles = animales.filter(a => 
    a.sexo === 'HEMBRA' && a.estado === 'ACTIVO'
  )
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await crearLactancia({
      vacaId: formData.vacaId,
      fechaInicio: formData.fechaInicio,
      numeroLactancia: parseInt(formData.numeroLactancia),
      reproduccionId: formData.reproduccionId || null,
      observaciones: formData.observaciones
    })
    
    if (result.success) {
      alert('✅ Lactancia iniciada exitosamente')
      setFormData({
        vacaId: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        numeroLactancia: 1,
        reproduccionId: '',
        observaciones: ''
      })
      if (onSuccess) onSuccess()
    } else {
      alert(`❌ Error: ${result.error}`)
    }
    setLoading(false)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-blue-800">🐄 Iniciar Nueva Lactancia</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Vaca *</label>
        <select
          required
          value={formData.vacaId}
          onChange={(e) => setFormData({...formData, vacaId: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Seleccionar vaca</option>
          {vacasDisponibles.map(v => (
            <option key={v.id} value={v.id}>
              {v.nroArete} - {v.nombre || 'Sin nombre'} ({v.raza?.nombre || 'Sin raza'})
            </option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha Inicio *</label>
          <input
            type="date"
            required
            value={formData.fechaInicio}
            onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">N° Lactancia</label>
          <input
            type="number"
            min="1"
            value={formData.numeroLactancia}
            onChange={(e) => setFormData({...formData, numeroLactancia: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Parto Asociado (opcional)</label>
        <select
          value={formData.reproduccionId}
          onChange={(e) => setFormData({...formData, reproduccionId: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Seleccionar parto</option>
          {reproducciones?.filter(r => r.madre?.id === formData.vacaId).map(r => (
            <option key={r.id} value={r.id}>
              Parto: {new Date(r.fechaPartoReal).toLocaleDateString()} - {r.numCrias} cria(s)
            </option>
          ))}
        </select>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Iniciando...' : 'Iniciar Lactancia'}
      </button>
    </form>
  )
}

export default LactanciaForm