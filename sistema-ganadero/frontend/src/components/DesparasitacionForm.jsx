// frontend/src/components/DesparasitacionForm.jsx
import React, { useState } from 'react'
import { useAnimales } from '../hooks/useAnimales'
import { useCatalogos } from '../hooks/useCatalogos'
import { useSanidad } from '../hooks/useSanidad'

const DesparasitacionForm = ({ onSuccess }) => {
  const { animales } = useAnimales()
  const { veterinarios } = useCatalogos()
  const { crearDesparasitacion } = useSanidad()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    animalId: '',
    fecha: new Date().toISOString().split('T')[0],
    tipoParasiticida: 'INTERNO',
    producto: '',
    dosis: '',
    pesoAplicacion: '',
    lote: '',
    fechaProxima: '',
    observaciones: '',
    veterinarioId: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await crearDesparasitacion({
      animalId: formData.animalId,
      fecha: formData.fecha,
      tipoParasiticida: formData.tipoParasiticida,
      producto: formData.producto,
      dosis: formData.dosis,
      pesoAplicacion: formData.pesoAplicacion ? parseFloat(formData.pesoAplicacion) : null,
      lote: formData.lote,
      fechaProxima: formData.fechaProxima || null,
      observaciones: formData.observaciones,
      veterinarioId: formData.veterinarioId || null
    })

    if (result.success) {
      alert('✅ Desparasitación registrada exitosamente')
      setFormData({
        animalId: '',
        fecha: new Date().toISOString().split('T')[0],
        tipoParasiticida: 'INTERNO',
        producto: '',
        dosis: '',
        pesoAplicacion: '',
        lote: '',
        fechaProxima: '',
        observaciones: '',
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
      <h2 className="text-xl font-bold text-green-800">🪱 Nueva Desparasitación</h2>

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
          <label className="block text-sm font-medium text-gray-700">Peso Aplicación (kg)</label>
          <input
            type="number"
            step="0.1"
            value={formData.pesoAplicacion}
            onChange={(e) => setFormData({ ...formData, pesoAplicacion: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo Parasiticida *</label>
          <select
            required
            value={formData.tipoParasiticida}
            onChange={(e) => setFormData({ ...formData, tipoParasiticida: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="INTERNO">🪱 Interno</option>
            <option value="EXTERNO">🐛 Externo (garrapatas, piojos)</option>
            <option value="AMBOS">🔄 Ambos</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Producto *</label>
          <input
            type="text"
            required
            value={formData.producto}
            onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Ej: Ivermectina, Dectomax"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Dosis *</label>
          <input
            type="text"
            required
            value={formData.dosis}
            onChange={(e) => setFormData({ ...formData, dosis: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Ej: 1 ml/50 kg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Lote</label>
          <input
            type="text"
            value={formData.lote}
            onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Próxima Desparasitación</label>
          <input
            type="date"
            value={formData.fechaProxima}
            onChange={(e) => setFormData({ ...formData, fechaProxima: e.target.value })}
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
        <label className="block text-sm font-medium text-gray-700">Observaciones</label>
        <textarea
          value={formData.observaciones}
          onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
      >
        {loading ? 'Registrando...' : 'Registrar Desparasitación'}
      </button>
    </form>
  )
}

export default DesparasitacionForm