// frontend/src/components/VentaForm.jsx
import { useState } from 'react'

export default function VentaForm({ clientes, animales, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    clienteId: '',
    fechaVenta: new Date().toISOString().split('T')[0],
    observaciones: '',
  })

  const [detalles, setDetalles] = useState([])
  const [currentDetalle, setCurrentDetalle] = useState({
    animalId: '',
    pesoVentaKg: '',
    precioKg: '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleDetalleChange = (e) => {
    setCurrentDetalle({ ...currentDetalle, [e.target.name]: e.target.value })
  }

  const agregarDetalle = () => {
    if (currentDetalle.animalId && currentDetalle.pesoVentaKg && currentDetalle.precioKg) {
      const animal = animales.find(a => a.id === currentDetalle.animalId)
      const subtotal = parseFloat(currentDetalle.pesoVentaKg) * parseFloat(currentDetalle.precioKg)
      
      setDetalles([
        ...detalles,
        {
          ...currentDetalle,
          nombre: animal?.nombre || animal?.nroArete,
          subtotal: subtotal
        }
      ])
      setCurrentDetalle({ animalId: '', pesoVentaKg: '', precioKg: '' })
    }
  }

  const eliminarDetalle = (index) => {
    const nuevosDetalles = [...detalles]
    nuevosDetalles.splice(index, 1)
    setDetalles(nuevosDetalles)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData, detalles)
  }

  const total = detalles.reduce((sum, d) => sum + d.subtotal, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🛒 Nueva Venta</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos de la venta */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select
                  name="clienteId"
                  value={formData.clienteId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellidos || ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Venta</label>
                <input
                  type="date"
                  name="fechaVenta"
                  value={formData.fechaVenta}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Observaciones de la venta"
              />
            </div>

            {/* Detalles de la venta */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Animales Vendidos</h3>
              
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Animal</label>
                  <select
                    name="animalId"
                    value={currentDetalle.animalId}
                    onChange={handleDetalleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar animal</option>
                    {animales.map(a => (
                      <option key={a.id} value={a.id}>{a.nroArete} - {a.nombre || 'Sin nombre'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="pesoVentaKg"
                    value={currentDetalle.pesoVentaKg}
                    onChange={handleDetalleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Peso"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio/kg (Bs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="precioKg"
                    value={currentDetalle.precioKg}
                    onChange={handleDetalleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Precio"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={agregarDetalle}
                className="mb-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                + Agregar Animal
              </button>

              {/* Tabla de detalles */}
              {detalles.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold">Animal</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Peso (kg)</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Precio/kg</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Subtotal</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {detalles.map((det, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{det.nombre}</td>
                          <td className="px-4 py-2 text-sm">{det.pesoVentaKg}</td>
                          <td className="px-4 py-2 text-sm">Bs. {parseFloat(det.precioKg).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm">Bs. {det.subtotal.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm">
                            <button
                              type="button"
                              onClick={() => eliminarDetalle(idx)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan="3" className="px-4 py-2 text-right">Total:</td>
                        <td className="px-4 py-2">Bs. {total.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
              >
                Registrar Venta
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