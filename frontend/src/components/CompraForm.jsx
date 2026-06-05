import { useState, useEffect } from 'react'

export default function CompraForm({ notaCompra, proveedores, medicamentos, alimentos, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    proveedorId: '',
    tipoCompra: 'MEDICAMENTO',
    fechaCompra: new Date().toISOString().split('T')[0],
    observaciones: '',
  })

  const [detalles, setDetalles] = useState([])
  const [currentDetalle, setCurrentDetalle] = useState({
    productoId: '',
    cantidad: '',
    precioUnitario: '',
  })

  useEffect(() => {
    if (notaCompra) {
      setFormData({
        proveedorId: notaCompra.proveedor?.id || '',
        tipoCompra: notaCompra.tipoCompra || 'MEDICAMENTO',
        fechaCompra: notaCompra.fechaCompra || '',
        observaciones: notaCompra.observaciones || '',
      })
    }
  }, [notaCompra])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleDetalleChange = (e) => {
    setCurrentDetalle({ ...currentDetalle, [e.target.name]: e.target.value })
  }

  const agregarDetalle = () => {
    if (currentDetalle.productoId && currentDetalle.cantidad && currentDetalle.precioUnitario) {
      const producto = formData.tipoCompra === 'MEDICAMENTO' 
        ? medicamentos.find(m => m.id === currentDetalle.productoId)
        : alimentos.find(a => a.id === currentDetalle.productoId)
      
      setDetalles([
        ...detalles,
        {
          ...currentDetalle,
          nombre: producto?.nombre || '',
          subtotal: parseFloat(currentDetalle.cantidad) * parseFloat(currentDetalle.precioUnitario)
        }
      ])
      setCurrentDetalle({ productoId: '', cantidad: '', precioUnitario: '' })
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

  const productosDisponibles = formData.tipoCompra === 'MEDICAMENTO' ? medicamentos : alimentos

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {notaCompra ? '✏️ Editar Compra' : '🛒 Nueva Compra'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos de la compra */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <select
                  name="proveedorId"
                  value={formData.proveedorId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellidos || ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Compra</label>
                <select
                  name="tipoCompra"
                  value={formData.tipoCompra}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="MEDICAMENTO">💊 Medicamentos</option>
                  <option value="ALIMENTO">🌾 Alimentos</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Compra</label>
                <input
                  type="date"
                  name="fechaCompra"
                  value={formData.fechaCompra}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <input
                  type="text"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Observaciones"
                />
              </div>
            </div>

            {/* Detalles de compra */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Detalles de la Compra</h3>
              
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                  <select
                    name="productoId"
                    value={currentDetalle.productoId}
                    onChange={handleDetalleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar</option>
                    {productosDisponibles.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cantidad"
                    value={currentDetalle.cantidad}
                    onChange={handleDetalleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Cantidad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario</label>
                  <input
                    type="number"
                    step="0.01"
                    name="precioUnitario"
                    value={currentDetalle.precioUnitario}
                    onChange={handleDetalleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Precio"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={agregarDetalle}
                className="mb-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                + Agregar Producto
              </button>

              {/* Tabla de detalles */}
              {detalles.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold">Producto</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Precio Unit.</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Subtotal</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {detalles.map((det, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{det.nombre}</td>
                          <td className="px-4 py-2 text-sm">{det.cantidad}</td>
                          <td className="px-4 py-2 text-sm">₲ {parseFloat(det.precioUnitario).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm">₲ {det.subtotal.toLocaleString()}</td>
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
                        <td className="px-4 py-2">₲ {detalles.reduce((sum, d) => sum + d.subtotal, 0).toLocaleString()}</td>
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
                {notaCompra ? 'Actualizar' : 'Registrar Compra'}
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