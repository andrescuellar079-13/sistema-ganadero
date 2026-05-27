// frontend/src/components/FincaForm.jsx
import React, { useState } from 'react'

const FincaForm = ({ fincaParaEditar, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: fincaParaEditar?.nombre || '',
    propietario: fincaParaEditar?.propietario || '',
    departamento: fincaParaEditar?.departamento || '',
    municipio: fincaParaEditar?.municipio || '',
    ubicacion: fincaParaEditar?.ubicacion || '',
    telefono: fincaParaEditar?.telefono || ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(formData)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6">
      <h2 className="text-xl font-bold text-green-800 mb-4">
        {fincaParaEditar ? '✏️ Editar Finca' : '📍 Nueva Finca'}
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input
          type="text"
          name="nombre"
          required
          value={formData.nombre}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Ej: Ganadería San José"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Propietario</label>
        <input
          type="text"
          name="propietario"
          value={formData.propietario}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Nombre del propietario"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
          <input
            type="text"
            name="departamento"
            value={formData.departamento}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Ej: San Pedro"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Municipio/Distrito</label>
          <input
            type="text"
            name="municipio"
            value={formData.municipio}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Ej: San Estanislao"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación/Dirección</label>
        <textarea
          name="ubicacion"
          value={formData.ubicacion}
          onChange={handleChange}
          rows="2"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Dirección completa de la finca"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
        <input
          type="tel"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Ej: (0981) 123-456"
        />
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Guardando...' : (fincaParaEditar ? 'Actualizar' : 'Crear')}
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

export default FincaForm