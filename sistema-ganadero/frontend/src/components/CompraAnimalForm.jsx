// frontend/src/components/CompraAnimalForm.jsx
import { useState } from 'react'

export default function CompraAnimalForm({ onSubmit, onCancel, razas, categorias }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nroArete: '',
    nombre: '',
    sexo: 'MACHO',
    razaId: '',
    categoriaId: '',
    peso: '',
    precioUnitario: '',
    fechaNacimiento: '',
    observaciones: '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit({
      nroArete: formData.nroArete,
      nombre: formData.nombre,
      sexo: formData.sexo,
      razaId: formData.razaId || null,
      categoriaId: formData.categoriaId || null,
      peso: parseFloat(formData.peso) || 0,
      precioUnitario: parseFloat(formData.precioUnitario),
      fechaNacimiento: formData.fechaNacimiento || null,
      observaciones: formData.observaciones,
    })
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-3">🐄 Agregar Animal</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Arete *</label>
          <input
            type="text"
            name="nroArete"
            required
            value={formData.nroArete}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-sm border rounded-md"
            placeholder="Ej: TEST001"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-sm border rounded-md"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Sexo *</label>
          <select
            name="sexo"
            required
            value={formData.sexo}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-sm border rounded-md"
          >
            <option value="MACHO">🐂 Macho</option>
            <option value="HEMBRA">🐄 Hembra</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Raza</label>
          <select
            name="razaId"
            value={formData.razaId}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-sm border rounded-md"
          >
            <option value="">Seleccionar</option>
            {razas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
          <select
            name="categoriaId"
            value={formData.categoriaId}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-sm border rounded-md"
          >
            <option value="">Seleccionar</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Peso (kg)</label>
          <input
            type="number"
            step="0.1"
            name="peso"
            value={formData.peso}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-sm border rounded-md"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Precio Unitario (Bs.) *</label>
          <input
            type="number"
            step="0.01"
            name="precioUnitario"
            required
            value={formData.precioUnitario}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-sm border rounded-md"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Nacimiento</label>
          <input
            type="date"
            name="fechaNacimiento"
            value={formData.fechaNacimiento}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-sm border rounded-md"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows="2"
            className="w-full px-2 py-1.5 text-sm border rounded-md"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-1.5 rounded-md text-sm hover:bg-blue-700"
        >
          {loading ? 'Agregando...' : '+ Agregar Animal'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}