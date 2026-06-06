import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_ALIMENTOS, CREATE_ALIMENTO, UPDATE_ALIMENTO, DELETE_ALIMENTO } from '../../graphql/catalogos'
import LoadingSpinner from '../LoadingSpinner'
import ErrorMessage from '../ErrorMessage'

export default function AlimentosList() {
  const { data, loading, error, refetch } = useQuery(GET_ALIMENTOS)
  const [createAlimento] = useMutation(CREATE_ALIMENTO)
  const [updateAlimento] = useMutation(UPDATE_ALIMENTO)
  const [deleteAlimento] = useMutation(DELETE_ALIMENTO)
  
  const [showForm, setShowForm] = useState(false)
  const [editingAlimento, setEditingAlimento] = useState(null)
  const [message, setMessage] = useState(null)
  const [showConfirm, setShowConfirm] = useState(null)
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [stockMin, setStockMin] = useState('')
  const [stockMax, setStockMax] = useState('')

  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    unidadMedida: 'KG',
    stockCantidad: '',
    precioReferencia: '',
    fechaVencimiento: '',
    activo: true
  })

  const alimentos = data?.alimentos || []

  // Filtrar alimentos
  const alimentosFiltrados = useMemo(() => {
    let filtered = [...alimentos]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(a => a.nombre?.toLowerCase().includes(term))
    }
    
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter(a => estadoFilter === 'activo' ? a.activo : !a.activo)
    }
    
    if (stockMin) {
      filtered = filtered.filter(a => (a.stockCantidad || 0) >= parseFloat(stockMin))
    }
    if (stockMax) {
      filtered = filtered.filter(a => (a.stockCantidad || 0) <= parseFloat(stockMax))
    }
    
    return filtered
  }, [alimentos, searchTerm, estadoFilter, stockMin, stockMax])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setEstadoFilter('todos')
    setStockMin('')
    setStockMax('')
  }

  // Abrir formulario para crear
  const openCreateForm = () => {
    setEditingAlimento(null)
    setFormData({
      nombre: '',
      unidadMedida: 'KG',
      stockCantidad: '',
      precioReferencia: '',
      fechaVencimiento: '',
      activo: true
    })
    setShowForm(true)
  }

  // Abrir formulario para editar
  const openEditForm = (alimento) => {
    setEditingAlimento(alimento)
    setFormData({
      nombre: alimento.nombre || '',
      unidadMedida: alimento.unidadMedida || 'KG',
      stockCantidad: alimento.stockCantidad || '',
      precioReferencia: alimento.precioReferencia || '',
      fechaVencimiento: alimento.fechaVencimiento || '',
      activo: alimento.activo
    })
    setShowForm(true)
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const variables = {
      fincaId: '1',
      nombre: formData.nombre,
      contenidoNeto: 0,
      unidadMedida: formData.unidadMedida,
      fechaVencimiento: formData.fechaVencimiento || null,
      stockCantidad: parseFloat(formData.stockCantidad) || 0,
      precioReferencia: parseFloat(formData.precioReferencia) || 0,
    }

    try {
      const result = await createAlimento({ variables })
      if (result.data?.crearAlimento?.success) {
        setMessage({ type: 'success', text: result.data.crearAlimento.message })
        refetch()
        setShowForm(false)
      } else {
        setMessage({ type: 'error', text: result.data?.crearAlimento?.message || 'Error al crear' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    const variables = {
      id: editingAlimento.id,
      nombre: formData.nombre,
      stockCantidad: parseFloat(formData.stockCantidad) || 0,
      precioReferencia: parseFloat(formData.precioReferencia) || 0,
      activo: formData.activo,
    }

    try {
      const result = await updateAlimento({ variables })
      if (result.data?.actualizarAlimento?.success) {
        setMessage({ type: 'success', text: result.data.actualizarAlimento.message })
        refetch()
        setShowForm(false)
        setEditingAlimento(null)
      } else {
        setMessage({ type: 'error', text: result.data?.actualizarAlimento?.message || 'Error al actualizar' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handleDelete = async (id) => {
    try {
      const result = await deleteAlimento({ variables: { id } })
      if (result.data?.eliminarAlimento?.success) {
        setMessage({ type: 'success', text: result.data.eliminarAlimento.message })
        refetch()
      } else {
        setMessage({ type: 'error', text: result.data?.eliminarAlimento?.message || 'Error al eliminar' })
      }
      setShowConfirm(null)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const hayFiltrosActivos = searchTerm || estadoFilter !== 'todos' || stockMin || stockMax

  return (
    <div>
      {/* Barra de búsqueda y filtros */}
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
            </button>
            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
            <input
              type="number"
              placeholder="Stock mínimo"
              value={stockMin}
              onChange={(e) => setStockMin(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Stock máximo"
              value={stockMax}
              onChange={(e) => setStockMax(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
        )}

        {hayFiltrosActivos && (
          <div className="mt-3 text-sm text-gray-500">
            {alimentosFiltrados.length} de {alimentos.length} alimentos encontrados
          </div>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={openCreateForm}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          + Nuevo Alimento
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {alimentosFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {hayFiltrosActivos ? 'No hay alimentos que coincidan con la búsqueda' : 'No hay alimentos registrados'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Precio Ref.</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {alimentosFiltrados.map((alimento) => (
                <tr key={alimento.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{alimento.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{alimento.stockCantidad} {alimento.unidadMedida}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">₲ {parseFloat(alimento.precioReferencia || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${alimento.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {alimento.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(alimento)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setShowConfirm(alimento.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Creación/Edición */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingAlimento ? '✏️ Editar Alimento' : '➕ Nuevo Alimento'}
              </h2>
              <form onSubmit={editingAlimento ? handleUpdate : handleCreate}>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Unidad Medida</label>
                  <select
                    name="unidadMedida"
                    value={formData.unidadMedida}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="KG">Kilogramo (kg)</option>
                    <option value="G">Gramo (g)</option>
                    <option value="L">Litro (L)</option>
                    <option value="TON">Tonelada (ton)</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    name="stockCantidad"
                    value={formData.stockCantidad}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Precio Referencia (Gs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="precioReferencia"
                    value={formData.precioReferencia}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Fecha Vencimiento</label>
                  <input
                    type="date"
                    name="fechaVencimiento"
                    value={formData.fechaVencimiento}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                {editingAlimento && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Estado</label>
                    <select
                      name="activo"
                      value={formData.activo ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
                    {editingAlimento ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingAlimento(null)
                    }}
                    className="flex-1 bg-gray-300 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-4">¿Eliminar alimento?</h3>
            <p className="text-gray-600 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(showConfirm)} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700">
                Sí, eliminar
              </button>
              <button onClick={() => setShowConfirm(null)} className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}