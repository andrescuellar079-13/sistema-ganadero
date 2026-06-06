// frontend/src/components/ProduccionLecheForm.jsx
import React, { useState } from 'react'
import { useAnimales } from '../hooks/useAnimales'
import { useProduccion } from '../hooks/useProduccion'

const ProduccionLecheForm = ({ onSuccess }) => {
  const { animales } = useAnimales()
  const { lactanciasActivas, crearProduccion } = useProduccion()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vacaId: '',
    turno: 'MAÑANA',
    litros: '',
    observaciones: ''
  })
  
  // Vacas con lactancia activa
  const vacasEnLactancia = lactanciasActivas.map(l => l.vaca)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await crearProduccion({
      vacaId: formData.vacaId,
      turno: formData.turno,
      litros: parseFloat(formData.litros),
      observaciones: formData.observaciones
    })
    
    if (result.success) {
      alert('✅ Producción registrada exitosamente')
      setFormData({
        vacaId: '',
        turno: 'MAÑANA',
        litros: '',
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
      <h2 className="text-xl font-bold text-blue-800">🥛 Registrar Producción de Leche</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Vaca *</label>
        <select
          required
          value={formData.vacaId}
          onChange={(e) => setFormData({...formData, vacaId: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Seleccionar vaca</option>
          {vacasEnLactancia.map(v => (
            <option key={v.id} value={v.id}>
              {v.nroArete} - {v.nombre || 'Sin nombre'}
            </option>
          ))}
        </select>
        {vacasEnLactancia.length === 0 && (
          <p className="text-xs text-red-500 mt-1">⚠️ No hay vacas con lactancia activa</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Turno *</label>
          <select
            required
            value={formData.turno}
            onChange={(e) => setFormData({...formData, turno: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="MAÑANA">🌅 Mañana</option>
            <option value="TARDE">🌞 Tarde</option>
            <option value="NOCHE">🌙 Noche</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Litros *</label>
          <input
            type="number"
            step="0.1"
            required
            value={formData.litros}
            onChange={(e) => setFormData({...formData, litros: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="0.0"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Observaciones</label>
        <textarea
          value={formData.observaciones}
          onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Ej: Vaca con buena producción, sin novedades..."
        />
      </div>
      
      <button
        type="submit"
        disabled={loading || vacasEnLactancia.length === 0}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Registrando...' : 'Registrar Producción'}
      </button>
    </form>
  )
}

export default ProduccionLecheForm