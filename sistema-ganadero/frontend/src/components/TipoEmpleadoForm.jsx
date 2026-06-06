// frontend/src/components/TipoEmpleadoForm.jsx
import React, { useState } from 'react'
import { useRrhh } from '../hooks/useRrhh'

const TipoEmpleadoForm = ({ onSuccess, tipoParaEditar, onCancel }) => {
  const { crearTipo, actualizarTipo } = useRrhh()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: tipoParaEditar?.nombre || '',
    descripcion: tipoParaEditar?.descripcion || '',
    salarioBase: tipoParaEditar?.salarioBase || '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    let result
    if (tipoParaEditar) {
      result = await actualizarTipo(tipoParaEditar.id, {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        salarioBase: parseFloat(formData.salarioBase) || 0,
        activo: true
      })
    } else {
      result = await crearTipo({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        salarioBase: parseFloat(formData.salarioBase) || 0
      })
    }

    if (result.success) {
      alert(tipoParaEditar ? '✅ Tipo actualizado' : '✅ Tipo creado')
      if (onSuccess) onSuccess()
    } else {
      alert(`❌ Error: ${result.error}`)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-blue-800">
        {tipoParaEditar ? '✏️ Editar Tipo de Empleado' : '+ Nuevo Tipo de Empleado'}
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre *</label>
        <input
          type="text"
          required
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Ej: Veterinario, Peón, Administrador"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Descripción del cargo"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Salario Base (Bs)</label>
        <input
          type="number"
          step="0.01"
          value={formData.salarioBase}
          onChange={(e) => setFormData({ ...formData, salarioBase: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          {loading ? 'Guardando...' : (tipoParaEditar ? 'Actualizar' : 'Crear')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export default TipoEmpleadoForm