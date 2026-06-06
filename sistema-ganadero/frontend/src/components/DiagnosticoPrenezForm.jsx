// frontend/src/components/DiagnosticoPrenezForm.jsx
import React, { useState } from 'react'
import { useAnimales } from '../hooks/useAnimales'
import { useReproduccion } from '../hooks/useReproduccion'

const DiagnosticoPrenezForm = ({ onSuccess }) => {
  const { animales } = useAnimales()
  const { crearDiagnostico } = useReproduccion()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    hembraId: '',
    fecha: new Date().toISOString().split('T')[0],
    resultadoPrenez: '',
    diasGestacion: '',
    metodo: 'PALPACION'
  })
  
  const hembras = animales.filter(a => a.sexo === 'HEMBRA')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await crearDiagnostico({
      hembraId: formData.hembraId,
      fecha: formData.fecha,
      resultadoPrenez: formData.resultadoPrenez,
      diasGestacion: formData.diasGestacion ? parseInt(formData.diasGestacion) : 0,
      metodo: formData.metodo
    })
    
    if (result.success) {
      alert(`✅ Diagnóstico registrado: ${formData.resultadoPrenez === 'POSITIVO' ? '🎉 PREÑADA' : '📋 VACÍA'}`)
      setFormData({
        hembraId: '',
        fecha: new Date().toISOString().split('T')[0],
        resultadoPrenez: '',
        diasGestacion: '',
        metodo: 'PALPACION'
      })
      if (onSuccess) onSuccess()
    } else {
      alert(`❌ Error: ${result.error}`)
    }
    setLoading(false)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-green-800">🔬 Diagnóstico de Preñez</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Hembra *</label>
        <select
          required
          value={formData.hembraId}
          onChange={(e) => setFormData({...formData, hembraId: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Seleccionar hembra</option>
          {hembras.map(h => (
            <option key={h.id} value={h.id}>
              {h.nroArete} - {h.nombre || 'Sin nombre'}
            </option>
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
            onChange={(e) => setFormData({...formData, fecha: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Método</label>
          <select
            value={formData.metodo}
            onChange={(e) => setFormData({...formData, metodo: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="PALPACION">Palpación Rectal</option>
            <option value="ECOGRAFIA">Ecografía</option>
            <option value="QUIMICO">Químico (Biológicos)</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Resultado *</label>
        <div className="mt-2 space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="POSITIVO"
              checked={formData.resultadoPrenez === 'POSITIVO'}
              onChange={(e) => setFormData({...formData, resultadoPrenez: e.target.value})}
              className="text-green-600"
            />
            <span className="ml-2 text-green-700">✅ POSITIVO (Preñada)</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="NEGATIVO"
              checked={formData.resultadoPrenez === 'NEGATIVO'}
              onChange={(e) => setFormData({...formData, resultadoPrenez: e.target.value})}
              className="text-red-600"
            />
            <span className="ml-2 text-red-700">❌ NEGATIVO (Vacía)</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="SOSPECHOSO"
              checked={formData.resultadoPrenez === 'SOSPECHOSO'}
              onChange={(e) => setFormData({...formData, resultadoPrenez: e.target.value})}
              className="text-yellow-600"
            />
            <span className="ml-2 text-yellow-700">⚠️ SOSPECHOSO</span>
          </label>
        </div>
      </div>
      
      {formData.resultadoPrenez === 'POSITIVO' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Días de Gestación Estimados</label>
          <input
            type="number"
            min="30"
            max="283"
            value={formData.diasGestacion}
            onChange={(e) => setFormData({...formData, diasGestacion: e.target.value})}
            placeholder="Ej: 90 días"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Si conoce los días de gestación, ayuda a calcular la FPP más precisa
          </p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading || !formData.resultadoPrenez}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Registrando...' : 'Registrar Diagnóstico'}
      </button>
    </form>
  )
}

export default DiagnosticoPrenezForm