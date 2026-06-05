// frontend/src/components/VentaForm.jsx
import { useState, useMemo, useEffect } from 'react'

export default function VentaForm({ 
  clientes, 
  animales, 
  onSubmit, 
  onCancel,
  initialData = null,
  isEditing = false,
  onDelete = null
}) {
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

  const [editandoDetalle, setEditandoDetalle] = useState(null)
  const [searchCliente, setSearchCliente] = useState('')
  const [searchAnimal, setSearchAnimal] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Cargar datos cuando hay initialData (modo edición)
  useEffect(() => {
    if (initialData) {
      setFormData({
        clienteId: initialData.clienteId || '',
        fechaVenta: initialData.fechaVenta || new Date().toISOString().split('T')[0],
        observaciones: initialData.observaciones || '',
      })
      setDetalles(initialData.detalles || [])
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === 'clienteId' && value) {
      setSearchCliente('')
    }
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
          subtotal: subtotal,
        }
      ])
      setCurrentDetalle({ animalId: '', pesoVentaKg: '', precioKg: '' })
      setSearchAnimal('')
    }
  }

  const actualizarDetalle = () => {
    if (editandoDetalle !== null) {
      const animal = animales.find(a => a.id === currentDetalle.animalId)
      const subtotal = parseFloat(currentDetalle.pesoVentaKg) * parseFloat(currentDetalle.precioKg)
      
      const nuevosDetalles = [...detalles]
      nuevosDetalles[editandoDetalle] = {
        ...currentDetalle,
        nombre: animal?.nombre || animal?.nroArete,
        subtotal: subtotal
      }
      setDetalles(nuevosDetalles)
      setEditandoDetalle(null)
      setCurrentDetalle({ animalId: '', pesoVentaKg: '', precioKg: '' })
      setSearchAnimal('')
    }
  }

  const editarDetalle = (index) => {
    const detalle = detalles[index]
    setEditandoDetalle(index)
    setCurrentDetalle({
      animalId: detalle.animalId,
      pesoVentaKg: detalle.pesoVentaKg,
      precioKg: detalle.precioKg,
    })
    document.getElementById('form-editar-animal')?.scrollIntoView({ behavior: 'smooth' })
  }

  const eliminarDetalle = (index) => {
    const nuevosDetalles = [...detalles]
    nuevosDetalles.splice(index, 1)
    setDetalles(nuevosDetalles)
    if (editandoDetalle === index) {
      setEditandoDetalle(null)
      setCurrentDetalle({ animalId: '', pesoVentaKg: '', precioKg: '' })
    }
  }

  const cancelarEdicion = () => {
    setEditandoDetalle(null)
    setCurrentDetalle({ animalId: '', pesoVentaKg: '', precioKg: '' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData, detalles)
  }

  const handleDeleteVenta = () => {
    if (onDelete) {
      onDelete()
    }
    setShowDeleteConfirm(false)
  }

  const clientesFiltrados = useMemo(() => {
    if (!searchCliente) return clientes || []
    
    const term = searchCliente.toLowerCase()
    return (clientes || []).filter(c => 
      c.nombre?.toLowerCase().includes(term) ||
      c.apellidos?.toLowerCase().includes(term) ||
      c.ci?.toLowerCase().includes(term) ||
      c.telefono?.toLowerCase().includes(term)
    )
  }, [clientes, searchCliente])

  const animalesFiltrados = useMemo(() => {
    if (!searchAnimal) return animales || []
    
    const term = searchAnimal.toLowerCase()
    const animalesAgregadosIds = detalles.map(d => d.animalId)
    
    return (animales || []).filter(a => 
      !animalesAgregadosIds.includes(a.id) && (
        a.nroArete?.toLowerCase().includes(term) ||
        a.nombre?.toLowerCase().includes(term)
      )
    )
  }, [animales, searchAnimal, detalles])

  const total = detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0)

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditing ? '✏️ Editar Venta' : '🛒 Nueva Venta'}
              </h2>
              
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                >
                  🗑️ Eliminar Venta
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  
                  {!formData.clienteId && (
                    <div className="mb-2">
                      <input
                        type="text"
                        placeholder="🔍 Buscar cliente por nombre, apellido, CI o teléfono..."
                        value={searchCliente}
                        onChange={(e) => setSearchCliente(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                      {searchCliente && clientesFiltrados.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">No se encontraron clientes</p>
                      )}
                    </div>
                  )}
                  
                  <select
                    name="clienteId"
                    value={formData.clienteId || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    size={Math.min(clientesFiltrados.length + 1, 6)}
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientesFiltrados.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellidos || ''} - {c.ci || 'Sin CI'} - {c.telefono || 'Sin teléfono'}
                      </option>
                    ))}
                  </select>
                  
                  {formData.clienteId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, clienteId: '' })
                        setSearchCliente('')
                      }}
                      className="text-xs text-red-500 mt-1 hover:text-red-700"
                    >
                      ✕ Cambiar cliente
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Venta</label>
                  <input
                    type="date"
                    name="fechaVenta"
                    value={formData.fechaVenta || ''}
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
                  value={formData.observaciones || ''}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Observaciones de la venta"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Animales Vendidos</h3>
                
                <div id="form-editar-animal" className="mb-4 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-3">
                    {editandoDetalle !== null ? '✏️ Editar Animal' : '➕ Agregar Animal'}
                  </h4>
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="🔍 Buscar animal por arete o nombre..."
                      value={searchAnimal}
                      onChange={(e) => setSearchAnimal(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                    {searchAnimal && animalesFiltrados.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">No se encontraron animales disponibles</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Animal</label>
                      <select
                        name="animalId"
                        value={currentDetalle.animalId || ''}
                        onChange={handleDetalleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Seleccionar animal</option>
                        {animalesFiltrados.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.nroArete} - {a.nombre || 'Sin nombre'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="pesoVentaKg"
                        value={currentDetalle.pesoVentaKg || ''}
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
                        value={currentDetalle.precioKg || ''}
                        onChange={handleDetalleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Precio"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    {editandoDetalle !== null ? (
                      <>
                        <button
                          type="button"
                          onClick={actualizarDetalle}
                          disabled={!currentDetalle.animalId || !currentDetalle.pesoVentaKg || !currentDetalle.precioKg}
                          className={`flex-1 px-4 py-2 rounded-md transition ${
                            !currentDetalle.animalId || !currentDetalle.pesoVentaKg || !currentDetalle.precioKg
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          💾 Actualizar Animal
                        </button>
                        <button
                          type="button"
                          onClick={cancelarEdicion}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={agregarDetalle}
                        disabled={!currentDetalle.animalId || !currentDetalle.pesoVentaKg || !currentDetalle.precioKg}
                        className={`w-full px-4 py-2 rounded-md transition ${
                          !currentDetalle.animalId || !currentDetalle.pesoVentaKg || !currentDetalle.precioKg
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        + Agregar Animal
                      </button>
                    )}
                  </div>
                </div>

                {detalles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">📋 Animales en esta venta:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {detalles.map((det, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border hover:shadow-md transition">
                          <div>
                            <span className="font-medium">{det.nombre}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {det.pesoVentaKg} kg × Bs. {parseFloat(det.precioKg).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-green-600">
                              Bs. {det.subtotal.toLocaleString()}
                            </span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => editarDetalle(idx)}
                                className="text-blue-500 hover:text-blue-700 transition"
                                title="Editar animal"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => eliminarDetalle(idx)}
                                className="text-red-500 hover:text-red-700 transition"
                                title="Eliminar animal"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end pt-2 border-t">
                        <span className="font-bold text-lg">💰 Total: Bs. {total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!formData.clienteId || detalles.length === 0}
                  className={`flex-1 py-2 rounded-md transition ${
                    !formData.clienteId || detalles.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isEditing ? '💾 Actualizar Venta' : '✅ Registrar Venta'} 
                  ({detalles.length} animales - Bs. {total.toLocaleString()})
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que deseas eliminar esta venta?
                <br />
                <span className="text-sm text-red-500 font-medium">
                  Esta acción eliminará la venta y todos sus detalles. No se puede deshacer.
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteVenta}
                  className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition"
                >
                  Sí, Eliminar Venta
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-md hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}