// frontend/src/components/MoverAnimalForm.jsx
import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_PARCELAS_DISPONIBLES_PARA_MOVIMIENTO } from '../graphql/parcelas'

const MoverAnimalForm = ({ animal, fincaId, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    animalId: animal.id,
    parcelaId: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    observaciones: ''
  })

  const { data, loading: loadingParcelas } = useQuery(GET_PARCELAS_DISPONIBLES_PARA_MOVIMIENTO, {
    variables: { fincaId, animalId: animal.id },
    fetchPolicy: 'network-only',
    skip: !fincaId || !animal.id,
  })

  const parcelasDisponibles = data?.parcelasDisponiblesParaMovimiento || []

  const estadoLabel = (estado) => {
    if (estado === 'LIBRE') return 'Libre'
    if (estado === 'OCUPADO') return 'Ocupado'
    return estado
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.parcelaId) {
      alert('Seleccione una parcela')
      return
    }
    setLoading(true)
    await onSubmit({
      animalId: formData.animalId,
      parcelaId: formData.parcelaId,
      fechaIngreso: formData.fechaIngreso,
      observaciones: formData.observaciones
    })
    setLoading(false)
  }

  const canSubmit = !loading && !!formData.parcelaId && !!formData.fechaIngreso

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6">
      <h2 className="text-xl font-bold text-blue-800 mb-4">📍 Mover Animal a Parcela</h2>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Animal seleccionado:</p>
        <p className="font-bold text-lg">{animal.nombre || animal.nroArete}</p>
        <p className="text-sm text-gray-500">Arete: {animal.nroArete} | Sexo: {animal.sexo === 'MACHO' ? 'Macho' : 'Hembra'}</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Parcela Destino *</label>
        <select
          required
          value={formData.parcelaId}
          onChange={(e) => setFormData({ ...formData, parcelaId: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loadingParcelas}
        >
          <option value="">{loadingParcelas ? 'Cargando parcelas...' : 'Seleccionar parcela'}</option>
          {parcelasDisponibles.map(p => (
            <option key={p.id} value={p.id}>
              {p.nombre} - {estadoLabel(p.estado)} - {p.ocupacionActual}/{p.capacidadMaxima > 0 ? p.capacidadMaxima : '∞'} animales
            </option>
          ))}
        </select>
        {!loadingParcelas && parcelasDisponibles.length === 0 && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
            <p className="text-amber-700 text-sm font-medium">No hay parcelas disponibles para mover este animal</p>
            <p className="text-amber-600 text-xs mt-1">Solo se muestran parcelas libres u ocupadas con capacidad disponible. Las parcelas en descanso o llenas no están disponibles.</p>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso *</label>
        <input
          type="date"
          required
          value={formData.fechaIngreso}
          onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
        <textarea
          value={formData.observaciones}
          onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          rows="2"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Motivo del movimiento, condición del animal, etc."
        />
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Moviendo...' : 'Mover a Parcela'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default MoverAnimalForm
