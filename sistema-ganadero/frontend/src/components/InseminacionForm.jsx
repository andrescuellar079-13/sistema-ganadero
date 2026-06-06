// frontend/src/components/InseminacionForm.jsx
import React, { useState } from 'react'
import { useAnimales } from '../hooks/useAnimales'
import { useCatalogos } from '../hooks/useCatalogos'  // ✅ Ahora existe
import { useReproduccion } from '../hooks/useReproduccion'

const InseminacionForm = ({ onSuccess }) => {
  const { animales } = useAnimales()
  const { reproductores } = useCatalogos()  // ✅ Obtiene reproductores del hook
  const { crearInseminacion } = useReproduccion()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    hembraId: '',
    reproductorId: '',
    fecha: new Date().toISOString().split('T')[0],
    numeroServicio: 1,
    numeroPajuela: '',
    tecnicoInseminador: '',
    observaciones: ''
  })
  
  // Filtrar solo hembras activas
  const hembras = animales?.filter(a => a.sexo === 'HEMBRA' && a.estado === 'ACTIVO') || []
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await crearInseminacion({
      hembraId: formData.hembraId,
      reproductorId: formData.reproductorId || null,
      fecha: formData.fecha,
      numeroServicio: formData.numeroServicio,
      numeroPajuela: formData.numeroPajuela,
      tecnicoInseminador: formData.tecnicoInseminador,
      observaciones: formData.observaciones
    })
    
    if (result.success) {
      alert('✅ Inseminación registrada exitosamente')
      setFormData({
        hembraId: '',
        reproductorId: '',
        fecha: new Date().toISOString().split('T')[0],
        numeroServicio: 1,
        numeroPajuela: '',
        tecnicoInseminador: '',
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
      <h2 className="text-xl font-bold text-green-800">🐄 Nueva Inseminación Artificial</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Hembra *</label>
        <select
          required
          value={formData.hembraId}
          onChange={(e) => setFormData({...formData, hembraId: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        >
          <option value="">Seleccionar hembra</option>
          {hembras.map(h => (
            <option key={h.id} value={h.id}>
              {h.nroArete} - {h.nombre || 'Sin nombre'}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Reproductor (Toro)</label>
        <select
          value={formData.reproductorId}
          onChange={(e) => setFormData({...formData, reproductorId: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Seleccionar reproductor</option>
          {reproductores?.filter(r => r.activo !== false).map(r => (
            <option key={r.id} value={r.id}>
              {r.codigo} - {r.nombre || 'Sin nombre'} {r.raza?.nombre && `(${r.raza.nombre})`}
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
          <label className="block text-sm font-medium text-gray-700">N° Servicio</label>
          <input
            type="number"
            min="1"
            value={formData.numeroServicio}
            onChange={(e) => setFormData({...formData, numeroServicio: parseInt(e.target.value)})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">N° Pajuela</label>
          <input
            type="text"
            value={formData.numeroPajuela}
            onChange={(e) => setFormData({...formData, numeroPajuela: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Ej: AX-12345"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Técnico Inseminador</label>
          <input
            type="text"
            value={formData.tecnicoInseminador}
            onChange={(e) => setFormData({...formData, tecnicoInseminador: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Nombre del técnico"
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
          placeholder="Observaciones adicionales..."
        />
      </div>
      
      <button
        type="submit"
        disabled={loading || !formData.hembraId}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
      >
        {loading ? 'Registrando...' : 'Registrar Inseminación'}
      </button>
    </form>
  )
}

export default InseminacionForm