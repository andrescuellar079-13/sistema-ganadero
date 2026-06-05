import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_CATEGORIAS_ANIMALES,
  CREATE_CATEGORIA_ANIMAL,
  UPDATE_CATEGORIA_ANIMAL,
  DELETE_CATEGORIA_ANIMAL,
} from '../../graphql/catalogos'
import LoadingSpinner from '../LoadingSpinner'
import ErrorMessage from '../ErrorMessage'

const SEXO_OPCIONES = [
  { value: 'AMBOS', label: 'Ambos' },
  { value: 'MACHO', label: 'Macho' },
  { value: 'HEMBRA', label: 'Hembra' },
]

const PRODUCCION_OPCIONES = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'CARNE', label: 'Carne' },
  { value: 'LECHE', label: 'Leche' },
  { value: 'DOBLE_PROPOSITO', label: 'Doble propósito' },
]

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
  orden: 0,
  activo: true,
  sexoAplica: 'AMBOS',
  edadMinMeses: '',
  edadMaxMeses: '',
  pesoMinKg: '',
  pesoMaxKg: '',
  tipoProduccion: 'TODOS',
  permiteLactancia: false,
  permiteReproduccion: false,
}

const sexoLabel = (v) => SEXO_OPCIONES.find(o => o.value === v)?.label || v
const produccionLabel = (v) => PRODUCCION_OPCIONES.find(o => o.value === v)?.label || v

export default function CategoriasList() {
  const { data, loading, error, refetch } = useQuery(GET_CATEGORIAS_ANIMALES)
  const [createCategoria] = useMutation(CREATE_CATEGORIA_ANIMAL)
  const [updateCategoria] = useMutation(UPDATE_CATEGORIA_ANIMAL)
  const [deleteCategoria] = useMutation(DELETE_CATEGORIA_ANIMAL)

  const [showForm, setShowForm] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [formErrors, setFormErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [showConfirm, setShowConfirm] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [sexoFilter, setSexoFilter] = useState('todos')
  const [produccionFilter, setProduccionFilter] = useState('todos')
  const [lactanciaFilter, setLactanciaFilter] = useState('todos')
  const [reproduccionFilter, setReproduccionFilter] = useState('todos')

  const categorias = data?.categoriasAnimales || []

  const categoriasFiltradas = useMemo(() => {
    let filtered = [...categorias]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(c =>
        c.nombre?.toLowerCase().includes(term) ||
        c.descripcion?.toLowerCase().includes(term)
      )
    }
    if (estadoFilter !== 'todos') filtered = filtered.filter(c => estadoFilter === 'activo' ? c.activo : !c.activo)
    if (sexoFilter !== 'todos') filtered = filtered.filter(c => c.sexoAplica === sexoFilter)
    if (produccionFilter !== 'todos') filtered = filtered.filter(c => c.tipoProduccion === produccionFilter)
    if (lactanciaFilter !== 'todos') filtered = filtered.filter(c => lactanciaFilter === 'si' ? c.permiteLactancia : !c.permiteLactancia)
    if (reproduccionFilter !== 'todos') filtered = filtered.filter(c => reproduccionFilter === 'si' ? c.permiteReproduccion : !c.permiteReproduccion)
    return filtered
  }, [categorias, searchTerm, estadoFilter, sexoFilter, produccionFilter, lactanciaFilter, reproduccionFilter])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setEstadoFilter('todos')
    setSexoFilter('todos')
    setProduccionFilter('todos')
    setLactanciaFilter('todos')
    setReproduccionFilter('todos')
  }

  const mostrarMensaje = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }))
  }

  const validar = () => {
    const errors = {}
    if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio'
    const eMin = form.edadMinMeses !== '' ? parseInt(form.edadMinMeses) : null
    const eMax = form.edadMaxMeses !== '' ? parseInt(form.edadMaxMeses) : null
    if (eMin !== null && eMin < 0) errors.edadMinMeses = 'No puede ser negativo'
    if (eMax !== null && eMax < 0) errors.edadMaxMeses = 'No puede ser negativo'
    if (eMin !== null && eMax !== null && eMin > eMax) errors.edadMaxMeses = 'Debe ser mayor o igual a la edad mínima'
    const pMin = form.pesoMinKg !== '' ? parseFloat(form.pesoMinKg) : null
    const pMax = form.pesoMaxKg !== '' ? parseFloat(form.pesoMaxKg) : null
    if (pMin !== null && pMin < 0) errors.pesoMinKg = 'No puede ser negativo'
    if (pMax !== null && pMax < 0) errors.pesoMaxKg = 'No puede ser negativo'
    if (pMin !== null && pMax !== null && pMin > pMax) errors.pesoMaxKg = 'Debe ser mayor o igual al peso mínimo'
    return errors
  }

  const abrirCrear = () => {
    setEditingCategoria(null)
    setForm(FORM_INICIAL)
    setFormErrors({})
    setShowForm(true)
  }

  const abrirEditar = (cat) => {
    setEditingCategoria(cat)
    setForm({
      nombre: cat.nombre || '',
      descripcion: cat.descripcion || '',
      orden: cat.orden ?? 0,
      activo: cat.activo,
      sexoAplica: cat.sexoAplica || 'AMBOS',
      edadMinMeses: cat.edadMinMeses ?? '',
      edadMaxMeses: cat.edadMaxMeses ?? '',
      pesoMinKg: cat.pesoMinKg ?? '',
      pesoMaxKg: cat.pesoMaxKg ?? '',
      tipoProduccion: cat.tipoProduccion || 'TODOS',
      permiteLactancia: cat.permiteLactancia ?? false,
      permiteReproduccion: cat.permiteReproduccion ?? false,
    })
    setFormErrors({})
    setShowForm(true)
  }

  const buildVariables = () => ({
    nombre: form.nombre.trim(),
    descripcion: form.descripcion || null,
    sexoAplica: form.sexoAplica,
    edadMinMeses: form.edadMinMeses !== '' ? parseInt(form.edadMinMeses) : null,
    edadMaxMeses: form.edadMaxMeses !== '' ? parseInt(form.edadMaxMeses) : null,
    pesoMinKg: form.pesoMinKg !== '' ? parseFloat(form.pesoMinKg) : null,
    pesoMaxKg: form.pesoMaxKg !== '' ? parseFloat(form.pesoMaxKg) : null,
    tipoProduccion: form.tipoProduccion,
    permiteLactancia: form.permiteLactancia,
    permiteReproduccion: form.permiteReproduccion,
    orden: parseInt(form.orden) || 0,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validar()
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    try {
      if (editingCategoria) {
        const result = await updateCategoria({
          variables: { id: editingCategoria.id, ...buildVariables(), activo: form.activo }
        })
        if (result.data?.actualizarCategoriaAnimal?.success) {
          mostrarMensaje('success', result.data.actualizarCategoriaAnimal.message)
          refetch(); setShowForm(false); setEditingCategoria(null)
        } else {
          mostrarMensaje('error', result.data?.actualizarCategoriaAnimal?.message || 'Error al actualizar')
        }
      } else {
        const result = await createCategoria({ variables: buildVariables() })
        if (result.data?.crearCategoriaAnimal?.success) {
          mostrarMensaje('success', result.data.crearCategoriaAnimal.message)
          refetch(); setShowForm(false)
        } else {
          mostrarMensaje('error', result.data?.crearCategoriaAnimal?.message || 'Error al crear')
        }
      }
    } catch (err) {
      mostrarMensaje('error', err.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      const result = await deleteCategoria({ variables: { id } })
      if (result.data?.eliminarCategoriaAnimal?.success) {
        mostrarMensaje('success', result.data.eliminarCategoriaAnimal.message)
        refetch()
      } else {
        mostrarMensaje('error', result.data?.eliminarCategoriaAnimal?.message || 'Error al eliminar')
      }
      setShowConfirm(null)
    } catch (err) {
      mostrarMensaje('error', err.message)
    }
  }

  const toggleActivo = async (cat) => {
    try {
      const result = await updateCategoria({ variables: { id: cat.id, activo: !cat.activo } })
      if (result.data?.actualizarCategoriaAnimal?.success) {
        mostrarMensaje('success', `Categoría ${!cat.activo ? 'activada' : 'inactivada'} correctamente`)
        refetch()
      } else {
        mostrarMensaje('error', result.data?.actualizarCategoriaAnimal?.message || 'Error')
      }
    } catch (err) {
      mostrarMensaje('error', err.message)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const hayFiltros = searchTerm || estadoFilter !== 'todos' || sexoFilter !== 'todos' || produccionFilter !== 'todos' || lactanciaFilter !== 'todos' || reproduccionFilter !== 'todos'

  return (
    <div>
      {/* Barra búsqueda y filtros */}
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition ${showFilters ? 'bg-green-50 border-green-400 text-green-700' : 'hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
            </button>
            {hayFiltros && (
              <button onClick={limpiarFiltros} className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
                Limpiar
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
            <select value={sexoFilter} onChange={(e) => setSexoFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="todos">Todos los sexos</option>
              {SEXO_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={produccionFilter} onChange={(e) => setProduccionFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="todos">Todos los tipos</option>
              {PRODUCCION_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={lactanciaFilter} onChange={(e) => setLactanciaFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="todos">Lactancia: todos</option>
              <option value="si">Permite lactancia</option>
              <option value="no">Sin lactancia</option>
            </select>
            <select value={reproduccionFilter} onChange={(e) => setReproduccionFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="todos">Reproducción: todos</option>
              <option value="si">Permite reproducción</option>
              <option value="no">Sin reproducción</option>
            </select>
          </div>
        )}

        {hayFiltros && (
          <div className="mt-3 text-sm text-gray-500">
            {categoriasFiltradas.length} de {categorias.length} categorías encontradas
          </div>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={abrirCrear} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">
          + Nueva Categoría
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {categoriasFiltradas.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{hayFiltros ? 'No hay categorías que coincidan con la búsqueda' : 'No hay categorías registradas'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Sexo aplica</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Rango de edad</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Rango de peso</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo producción</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">Lactancia</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">Reproducción</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categoriasFiltradas.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{cat.nombre}</div>
                    {cat.descripcion && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{cat.descripcion}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{sexoLabel(cat.sexoAplica)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(cat.edadMinMeses != null || cat.edadMaxMeses != null)
                      ? `${cat.edadMinMeses ?? 0} – ${cat.edadMaxMeses != null ? cat.edadMaxMeses : '∞'} m`
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(cat.pesoMinKg != null || cat.pesoMaxKg != null)
                      ? `${cat.pesoMinKg ?? 0} – ${cat.pesoMaxKg != null ? cat.pesoMaxKg : '∞'} kg`
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                      {produccionLabel(cat.tipoProduccion)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {cat.permiteLactancia
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Sí</span>
                      : <span className="text-gray-400 text-xs">No</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {cat.permiteReproduccion
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Sí</span>
                      : <span className="text-gray-400 text-xs">No</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {cat.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirEditar(cat)}
                        className="text-yellow-600 hover:text-yellow-800 text-xs font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActivo(cat)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        {cat.activo ? 'Inactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => setShowConfirm(cat.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
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

      {/* Modal crear/editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-5 text-gray-800">
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* A. Datos básicos */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 pb-1 border-b">
                    A. Datos básicos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 ${formErrors.nombre ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Ej: Ternero, Vaca, Toro, Novillo..."
                      />
                      {formErrors.nombre && <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <textarea
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                        placeholder="Descripción opcional de la categoría..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Orden (en listados)</label>
                      <input
                        type="number"
                        name="orden"
                        value={form.orden}
                        onChange={handleChange}
                        min={0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    {editingCategoria && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                          name="activo"
                          value={String(form.activo)}
                          onChange={(e) => setForm(prev => ({ ...prev, activo: e.target.value === 'true' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                        >
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* B. Reglas de clasificación */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 pb-1 border-b">
                    B. Reglas de clasificación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sexo que aplica</label>
                      <select
                        name="sexoAplica"
                        value={form.sexoAplica}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      >
                        {SEXO_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de producción</label>
                      <select
                        name="tipoProduccion"
                        value={form.tipoProduccion}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      >
                        {PRODUCCION_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Edad mínima (meses)</label>
                      <input
                        type="number"
                        name="edadMinMeses"
                        value={form.edadMinMeses}
                        onChange={handleChange}
                        min={0}
                        placeholder="0"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 ${formErrors.edadMinMeses ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {formErrors.edadMinMeses && <p className="text-red-500 text-xs mt-1">{formErrors.edadMinMeses}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Edad máxima (meses)</label>
                      <input
                        type="number"
                        name="edadMaxMeses"
                        value={form.edadMaxMeses}
                        onChange={handleChange}
                        min={0}
                        placeholder="Sin límite"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 ${formErrors.edadMaxMeses ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {formErrors.edadMaxMeses && <p className="text-red-500 text-xs mt-1">{formErrors.edadMaxMeses}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Peso mínimo (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="pesoMinKg"
                        value={form.pesoMinKg}
                        onChange={handleChange}
                        min={0}
                        placeholder="0"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 ${formErrors.pesoMinKg ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {formErrors.pesoMinKg && <p className="text-red-500 text-xs mt-1">{formErrors.pesoMinKg}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Peso máximo (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="pesoMaxKg"
                        value={form.pesoMaxKg}
                        onChange={handleChange}
                        min={0}
                        placeholder="Sin límite"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 ${formErrors.pesoMaxKg ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {formErrors.pesoMaxKg && <p className="text-red-500 text-xs mt-1">{formErrors.pesoMaxKg}</p>}
                    </div>
                  </div>
                </div>

                {/* C. Permisos ganaderos */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 pb-1 border-b">
                    C. Permisos ganaderos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        name="permiteLactancia"
                        checked={form.permiteLactancia}
                        onChange={handleChange}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Permite lactancia</span>
                        <p className="text-xs text-gray-400">Ej: Vacas en ordeño</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        name="permiteReproduccion"
                        checked={form.permiteReproduccion}
                        onChange={handleChange}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Permite reproducción</span>
                        <p className="text-xs text-gray-400">Ej: Vacas, Toros, Novillas</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-medium transition">
                    {editingCategoria ? 'Actualizar' : 'Crear categoría'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingCategoria(null) }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 font-medium transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-gray-800">¿Eliminar categoría?</h3>
            <p className="text-gray-600 mb-1 text-sm">Si hay animales asignados a esta categoría, no se podrá eliminar.</p>
            <p className="text-gray-500 mb-6 text-sm">Se recomienda inactivarla en su lugar.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(showConfirm)}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 font-medium transition"
              >
                Eliminar
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 font-medium transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
