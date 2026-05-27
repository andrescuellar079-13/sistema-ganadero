// frontend/src/components/TratamientoForm.jsx
import React, { useState } from 'react'
import { useAnimales } from '../hooks/useAnimales'
import { useCatalogos } from '../hooks/useCatalogos'
import { useSanidad } from '../hooks/useSanidad'

const TratamientoForm = ({ onSuccess }) => {
  const { animales } = useAnimales()
  const { medicamentos, veterinarios } = useCatalogos()
  const { crearTratamiento } = useSanidad()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    animalId: '',
    fecha: new Date().toISOString().split('T')[0],
    diagnostico: '',
    tipo: '',
    dosis: '',
    costoTotal: '',
    medicamentoId: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await crearTratamiento({
      animalId: formData.animalId,
      fecha: formData.fecha,
      diagnostico: formData.diagnostico,
      tipo: formData.tipo,
      dosis: formData.dosis,
      costoTotal: parseFloat(formData.costoTotal) || 0,
      medicamentoId: formData.medicamentoId || null
    })

    if (result.success) {
      alert('✅ Tratamiento registrado exitosamente')
      setFormData({
        animalId: '',
        fecha: new Date().toISOString().split('T')[0],
        diagnostico: '',
        tipo: '',
        dosis: '',
        costoTotal: '',
        medicamentoId: ''
      })
      if (onSuccess) onSuccess()
    } else {
      alert(`❌ Error: ${result.error}`)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-orange-800">🩺 Nuevo Tratamiento</h2>

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
          <label className="block text-sm font-medium text-gray-700">Costo Total (Bs)</label>
          <input
            type="number"
            step="0.01"
            value={formData.costoTotal}
            onChange={(e) => setFormData({ ...formData, costoTotal: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Diagnóstico *</label>
        <textarea
          required
          value={formData.diagnostico}
          onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
 rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Ej: Neumonía, Mastitis, Fiebre aftosa..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo</label>
          <select
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">Seleccionar</option>
            <option value="ANTIBIOTICO">💊 Antibiótico</option>
            <option value="ANTIINFLAMATORIO">💉 Antiinflamatorio</option>
            <option value="VITAMINICO">🍊 Vitamínico</option>
            <option value="OTRO">📋 Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Dosis</label>
          <input
            type="text"
            value={formData.dosis}
            onChange={(e) => setFormData({ ...formData, dosis: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Ej: 5 ml cada 12h"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Medicamento (opcional)</label>
        <select
          value={formData.medicamentoId}
          onChange={(e) => setFormData({ ...formData, medicamentoId: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Seleccionar medicamento</option>
          {medicamentos.filter(m => m.activo).map(m => (
            <option key={m.id} value={m.id}>{m.nombre} - {m.laboratorio || ''}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:bg-gray-400"
      >
        {loading ? 'Registrando...' : 'Registrar Tratamiento'}
      </button>
    </form>
  )
}

export default TratamientoForm