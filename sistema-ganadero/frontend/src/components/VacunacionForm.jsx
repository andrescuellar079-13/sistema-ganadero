import { useState, useEffect } from 'react'

export default function VacunacionForm({ vacunacion, vacunas, animales, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    fincaId: localStorage.getItem('fincaId') || '1',
    animalId: '',
    vacunaId: '',
    fechaAplicacion: new Date().toISOString().split('T')[0],
    campana: '',
    lote: '',
    dosisAplicada: '',
    viaAplicacion: 'SUBCUTANEA',
    observaciones: '',
  })

  useEffect(() => {
    if (vacunacion) {
      setFormData({
        fincaId: localStorage.getItem('fincaId') || '1',
        animalId: vacunacion.animal?.id || '',
        vacunaId: vacunacion.vacuna?.id || '',
        fechaAplicacion: vacunacion.fechaAplicacion || '',
        campana: vacunacion.campana || '',
        lote: vacunacion.lote || '',
        dosisAplicada: vacunacion.dosisAplicada || '',
        viaAplicacion: vacunacion.viaAplicacion || 'SUBCUTANEA',
        observaciones: vacunacion.observaciones || '',
      })
    }
  }, [vacunacion])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
            {vacunacion ? '✏️ Editar Vacunación' : '💉 Registrar Vacunación'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Animal *</label>
                <select
                  name="animalId"
                  value={formData.animalId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar Animal</option>
                  {animales.map(animal => (
                    <option key={animal.id} value={animal.id}>
                      {animal.nroArete} - {animal.nombre || 'Sin nombre'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vacuna *</label>
                <select
                  name="vacunaId"
                  value={formData.vacunaId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar Vacuna</option>
                  {vacunas.map(vacuna => (
                    <option key={vacuna.id} value={vacuna.id}>{vacuna.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Aplicación *</label>
                <input
                  type="date"
                  name="fechaAplicacion"
                  value={formData.fechaAplicacion}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vía de Aplicación</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaña</label>
                <input
                  type="text"
                  name="campana"
                  value={formData.campana}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ej: Campaña 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                <input
                  type="text"
                  name="lote"
                  value={formData.lote}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ej: LOTE-001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosis Aplicada</label>
              <input
                type="text"
                name="dosisAplicada"
                value={formData.dosisAplicada}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Ej: 2 ml"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Información adicional..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
              >
                {vacunacion ? 'Actualizar' : 'Registrar'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-md hover:bg-gray-400"
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