import { useState, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import { CREATE_MEDICAMENTO, UPDATE_MEDICAMENTO } from '../../graphql/catalogos'

export default function MedicamentoForm({ medicamento, onSuccess, onCancel }) {
  const [createMedicamento] = useMutation(CREATE_MEDICAMENTO)
  const [updateMedicamento] = useMutation(UPDATE_MEDICAMENTO)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    laboratorio: '',
    unidadMedida: 'ml',
    stockCantidad: '',
    precioCompra: '',
  })

  useEffect(() => {
    if (medicamento) {
      setFormData({
        nombre: medicamento.nombre || '',
        laboratorio: medicamento.laboratorio || '',
        unidadMedida: medicamento.unidadMedida || 'ml',
        stockCantidad: medicamento.stockCantidad || '',
        precioCompra: medicamento.precioCompra || '',
      })
    }
  }, [medicamento])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const variables = {
      fincaId: '1',
      nombre: formData.nombre,
      laboratorio: formData.laboratorio,
      unidadMedida: formData.unidadMedida,
      stockCantidad: parseFloat(formData.stockCantidad) || 0,
      precioCompra: parseFloat(formData.precioCompra) || 0,
    }

    try {
      let result
      if (medicamento) {
        result = await updateMedicamento({ variables: { id: medicamento.id, ...variables } })
        if (result.data?.actualizarMedicamento?.success) {
          alert('Medicamento actualizado correctamente')
          onSuccess()
        } else {
          alert(result.data?.actualizarMedicamento?.message || 'Error al actualizar')
        }
      } else {
        result = await createMedicamento({ variables })
        if (result.data?.crearMedicamento?.success) {
          alert('Medicamento creado correctamente')
          onSuccess()
        } else {
          alert(result.data?.crearMedicamento?.message || 'Error al crear')
        }
      }
    } catch (error) {
      console.error(error)
      alert('Error al guardar el medicamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {medicamento ? '✏️ Editar Medicamento' : '💊 Nuevo Medicamento'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
              <input
                type="text"
                name="laboratorio"
                value={formData.laboratorio}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  step="0.01"
                  name="stockCantidad"
                  value={formData.stockCantidad}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio Compra</label>
                <input
                  type="number"
                  step="0.01"
                  name="precioCompra"
                  value={formData.precioCompra}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-green-300"
              >
                {loading ? 'Guardando...' : (medicamento ? 'Actualizar' : 'Crear')}
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