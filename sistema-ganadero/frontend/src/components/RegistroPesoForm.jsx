// frontend/src/components/RegistroPesoForm.jsx
import React, { useState } from 'react'
import { useAnimales } from '../hooks/useAnimales'
import { useProduccion } from '../hooks/useProduccion'

const RegistroPesoForm = ({ onSuccess }) => {
  const { animales } = useAnimales()
  const { crearRegistroPeso } = useProduccion()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    animalId: '',
    pesoKg: '',
    fechaPesaje: new Date().toISOString().split('T')[0],
    condicionCorporal: '',
    observacion: ''
  })
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await crearRegistroPeso({
      animalId: formData.animalId,
      pesoKg: parseFloat(formData.pesoKg),
      fechaPesaje: formData.fechaPesaje,
      condicionCorporal: formData.condicionCorporal ? parseFloat(formData.condicionCorporal) : null,
      observacion: formData.observacion
    })
    
    if (result.success) {
      alert('✅ Peso registrado exitosamente')
      setFormData({
        animalId: '',
        pesoKg: '',
        fechaPesaje: new Date().toISOString().split('T')[0],
        condicionCorporal: '',
        observacion: ''
      })
      if (onSuccess) onSuccess()
    } else {
      alert(`❌ Error: ${result.error}`)
    }
    setLoading(false)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-blue-800">⚖️ Registrar Peso de Animal</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Animal *</label>
        <select
          required
          value={formData.animalId}
          onChange={(e) => setFormData({...formData, animalId: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Seleccionar animal</option>
          {animales.map(a => (
            <option key={a.id} value={a.id}>
              {a.nroArete} - {a.nombre || 'Sin nombre'} ({a.raza?.nombre || 'Sin raza'})
            </option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Peso (kg) *</label>
          <input
            type="number"
            step="0.1"
            required
            value={formData.pesoKg}
            onChange={(e) => setFormData({...formData, pesoKg: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="0.0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha Pesaje *</label>
          <input
            type="date"
            required
            value={formData.fechaPesaje}
            onChange={(e) => setFormData({...formData, fechaPesaje: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Condición Corporal (1-5)</label>
        <input
          type="number"
          step="0.1"
          min="1"
          max="5"
          value={formData.condicionCorporal}
          onChange={(e) => setFormData({...formData, condicionCorporal: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Ej: 3.5"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Observaciones</label>
        <textarea
          value={formData.observacion}
          onChange={(e) => setFormData({...formData, observacion: e.target.value})}
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Ej: Animal en buen estado..."
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Registrando...' : 'Registrar Peso'}
      </button>
    </form>
  )
}

export default RegistroPesoForm