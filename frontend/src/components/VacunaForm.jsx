import { useState, useEffect } from 'react'

function VacunaForm({ vacuna, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    fincaId: '1',
    nombre: '',
    descripcion: '',
    dosisRecomendada: '',
    viaAplicacion: 'SUBCUTANEA',
    intervaloDias: 365,
    edadMinimaMeses: 0,
    activo: true,
  })

  useEffect(() => {
    if (vacuna) {
      setFormData({
        fincaId: vacuna.fincaId || '1',
        nombre: vacuna.nombre || '',
        descripcion: vacuna.descripcion || '',
        dosisRecomendada: vacuna.dosisRecomendada || '',
        viaAplicacion: vacuna.viaAplicacion || 'SUBCUTANEA',
        intervaloDias: vacuna.intervaloDias || 365,
        edadMinimaMeses: vacuna.edadMinimaMeses || 0,
        activo: vacuna.activo !== undefined ? vacuna.activo : true,
      })
    }
  }, [vacuna])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let newValue
    if (type === 'checkbox') {
      newValue = checked
    } else if (type === 'number') {
      newValue = value === '' ? '' : parseInt(value, 10)
    } else {
      newValue = value
    }
    setFormData({ ...formData, [name]: newValue })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {vacuna ? '✏️ Editar Vacuna' : '➕ Nueva Vacuna'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosis Recomendada *</label>
                <input
                  type="text"
                  name="dosisRecomendada"
                  value={formData.dosisRecomendada}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: 2 ml"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vía de Aplicación *</label>
                <select
                  name="viaAplicacion"
                  value={formData.viaAplicacion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="INTRAMUSCULAR">Intramuscular</option>
                  <option value="SUBCUTANEA">Subcutánea</option>
                  <option value="INTRADERMICA">Intradérmica</option>
                  <option value="ORAL">Oral</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo (días)</label>
                <input
                  type="number"
                  name="intervaloDias"
                  value={formData.intervaloDias}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edad mínima (meses)</label>
                <input
                  type="number"
                  name="edadMinimaMeses"
                  value={formData.edadMinimaMeses}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Activo</label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
              >
                {vacuna ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-md hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VacunaForm