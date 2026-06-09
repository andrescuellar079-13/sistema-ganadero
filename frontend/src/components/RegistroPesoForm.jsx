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
  
  // Estados en los que un animal ya no debe recibir pesajes
  const ESTADOS_NO_VALIDOS = ['VENDIDO', 'MUERTO', 'BAJA', 'MATADERO', 'DESCARTE']

  const handleSubmit = async (e) => {
    e.preventDefault()

    // --- Validaciones básicas ---
    if (!formData.animalId) {
      alert('❌ Debe seleccionar un animal')
      return
    }
    if (!formData.fechaPesaje) {
      alert('❌ La fecha de pesaje es obligatoria')
      return
    }
    const peso = parseFloat(formData.pesoKg)
    if (isNaN(peso) || peso < 0) {
      alert('❌ El peso no puede ser negativo')
      return
    }

    const animalSel = animales.find(a => String(a.id) === String(formData.animalId))
    if (animalSel && ESTADOS_NO_VALIDOS.includes(animalSel.estado)) {
      alert(`❌ No se puede registrar peso a un animal en estado ${animalSel.estado}`)
      return
    }

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
            min="0"
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