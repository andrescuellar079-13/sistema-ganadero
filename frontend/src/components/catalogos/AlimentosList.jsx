import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_ALIMENTOS, CREATE_ALIMENTO, UPDATE_ALIMENTO, DELETE_ALIMENTO } from '../../graphql/catalogos'
import LoadingSpinner from '../LoadingSpinner'
import ErrorMessage from '../ErrorMessage'

const TIPO_ALIMENTO_LABELS = {
  CONCENTRADO: 'Concentrado',
  HENO: 'Heno',
  SILO: 'Silo/Silaje',
  SAL_MINERAL: 'Sal Mineral',
  SUPLEMENTO: 'Suplemento',
  PASTO: 'Pasto',
  OTRO: 'Otro',
}

const FORM_INITIAL = {
  nombre: '',
  tipoAlimento: '',
  unidadMedida: 'KG',
  usoRecomendado: '',
  activo: true,
  stockCantidad: '',
  stockMinimo: '',
  contenidoNeto: '',
  precioReferencia: '',
  costoPorKg: '',
  fechaVencimiento: '',
  materiaSecaPorcentaje: '',
  proteinaPorcentaje: '',
  fibraPorcentaje: '',
  energia: '',
}

function isVencido(fechaStr) {
  if (!fechaStr) return false
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return new Date(fechaStr) < hoy
}

function isStockBajo(stockCantidad, stockMinimo) {
  const min = parseFloat(stockMinimo || 0)
  if (min <= 0) return false
  return parseFloat(stockCantidad || 0) <= min
}

const SECTIONS = [
  { key: 'basicos', label: 'A. Datos básicos' },
  { key: 'inventario', label: 'B. Inventario' },
  { key: 'nutricional', label: 'C. Valor nutricional' },
]

export default function AlimentosList() {
  const { data, loading, error, refetch } = useQuery(GET_ALIMENTOS)
  const [createAlimento] = useMutation(CREATE_ALIMENTO)
  const [updateAlimento] = useMutation(UPDATE_ALIMENTO)
  const [deleteAlimento] = useMutation(DELETE_ALIMENTO)

  const [showForm, setShowForm] = useState(false)
  const [editingAlimento, setEditingAlimento] = useState(null)
  const [activeSection, setActiveSection] = useState('basicos')
  const [message, setMessage] = useState(null)
  const [showConfirm, setShowConfirm] = useState(null)
  const [errors, setErrors] = useState({})

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [tipoFilter, setTipoFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('todos')
  const [vencimientoFilter, setVencimientoFilter] = useState('todos')

  const [formData, setFormData] = useState({ ...FORM_INITIAL })

  const alimentos = data?.alimentos || []

  const alimentosFiltrados = useMemo(() => {
    let filtered = [...alimentos]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(a =>
        a.nombre?.toLowerCase().includes(term) ||
        (a.tipoAlimento && TIPO_ALIMENTO_LABELS[a.tipoAlimento]?.toLowerCase().includes(term)) ||
        a.usoRecomendado?.toLowerCase().includes(term)
      )
    }
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter(a => estadoFilter === 'activo' ? a.activo : !a.activo)
    }
    if (tipoFilter) {
      filtered = filtered.filter(a => a.tipoAlimento === tipoFilter)
    }
    if (stockFilter === 'bajo') {
      filtered = filtered.filter(a => isStockBajo(a.stockCantidad, a.stockMinimo))
    } else if (stockFilter === 'normal') {
      filtered = filtered.filter(a => !isStockBajo(a.stockCantidad, a.stockMinimo))
    }
    if (vencimientoFilter === 'vencido') {
      filtered = filtered.filter(a => isVencido(a.fechaVencimiento))
    } else if (vencimientoFilter === 'vigente') {
      filtered = filtered.filter(a => a.fechaVencimiento && !isVencido(a.fechaVencimiento))
    }

    return filtered
  }, [alimentos, searchTerm, estadoFilter, tipoFilter, stockFilter, vencimientoFilter])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setEstadoFilter('todos')
    setTipoFilter('')
    setStockFilter('todos')
    setVencimientoFilter('todos')
  }

  const openCreateForm = () => {
    setEditingAlimento(null)
    setFormData({ ...FORM_INITIAL })
    setErrors({})
    setActiveSection('basicos')
    setShowForm(true)
  }

  const openEditForm = (alimento) => {
    setEditingAlimento(alimento)
    setFormData({
      nombre: alimento.nombre || '',
      tipoAlimento: alimento.tipoAlimento || '',
      unidadMedida: alimento.unidadMedida || 'KG',
      usoRecomendado: alimento.usoRecomendado || '',
      activo: alimento.activo,
      stockCantidad: alimento.stockCantidad ?? '',
      stockMinimo: alimento.stockMinimo ?? '',
      contenidoNeto: alimento.contenidoNeto ?? '',
      precioReferencia: alimento.precioReferencia ?? '',
      costoPorKg: alimento.costoPorKg ?? '',
      fechaVencimiento: alimento.fechaVencimiento || '',
      materiaSecaPorcentaje: alimento.materiaSecaPorcentaje ?? '',
      proteinaPorcentaje: alimento.proteinaPorcentaje ?? '',
      fibraPorcentaje: alimento.fibraPorcentaje ?? '',
      energia: alimento.energia || '',
    })
    setErrors({})
    setActiveSection('basicos')
    setShowForm(true)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const e = {}
    if (!formData.nombre.trim()) e.nombre = 'El nombre es obligatorio'

    const camposNegativos = [
      ['stockCantidad', 'El stock no puede ser negativo'],
      ['stockMinimo', 'El stock mínimo no puede ser negativo'],
      ['precioReferencia', 'El precio referencia no puede ser negativo'],
      ['costoPorKg', 'El costo por kg no puede ser negativo'],
      ['contenidoNeto', 'El contenido neto no puede ser negativo'],
    ]
    for (const [campo, msg] of camposNegativos) {
      if (formData[campo] !== '' && parseFloat(formData[campo]) < 0) e[campo] = msg
    }

    for (const [campo, label] of [
      ['materiaSecaPorcentaje', 'Materia seca'],
      ['proteinaPorcentaje', 'Proteína'],
      ['fibraPorcentaje', 'Fibra'],
    ]) {
      if (formData[campo] !== '') {
        const v = parseFloat(formData[campo])
        if (isNaN(v) || v < 0 || v > 100) e[campo] = `${label} debe estar entre 0 y 100`
      }
    }
    return e
  }

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const buildVariables = () => ({
    nombre: formData.nombre.trim(),
    tipoAlimento: formData.tipoAlimento || null,
    unidadMedida: formData.unidadMedida || null,
    usoRecomendado: formData.usoRecomendado || null,
    stockCantidad: formData.stockCantidad !== '' ? parseFloat(formData.stockCantidad) : 0,
    stockMinimo: formData.stockMinimo !== '' ? parseFloat(formData.stockMinimo) : 0,
    contenidoNeto: formData.contenidoNeto !== '' ? parseFloat(formData.contenidoNeto) : 0,
    precioReferencia: formData.precioReferencia !== '' ? parseFloat(formData.precioReferencia) : 0,
    costoPorKg: formData.costoPorKg !== '' ? parseFloat(formData.costoPorKg) : 0,
    fechaVencimiento: formData.fechaVencimiento || null,
    materiaSecaPorcentaje: formData.materiaSecaPorcentaje !== '' ? parseFloat(formData.materiaSecaPorcentaje) : 0,
    proteinaPorcentaje: formData.proteinaPorcentaje !== '' ? parseFloat(formData.proteinaPorcentaje) : 0,
    fibraPorcentaje: formData.fibraPorcentaje !== '' ? parseFloat(formData.fibraPorcentaje) : 0,
    energia: formData.energia || null,
    activo: formData.activo,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      const firstErr = Object.keys(errs)[0]
      if (['nombre', 'tipoAlimento', 'unidadMedida', 'usoRecomendado'].includes(firstErr)) setActiveSection('basicos')
      else if (['stockCantidad', 'stockMinimo', 'contenidoNeto', 'precioReferencia', 'costoPorKg', 'fechaVencimiento'].includes(firstErr)) setActiveSection('inventario')
      else setActiveSection('nutricional')
      return
    }

    const vars = buildVariables()
    try {
      if (editingAlimento) {
        const result = await updateAlimento({ variables: { id: editingAlimento.id, ...vars } })
        if (result.data?.actualizarAlimento?.success) {
          showMsg('success', result.data.actualizarAlimento.message)
          refetch()
          setShowForm(false)
        } else {
          showMsg('error', result.data?.actualizarAlimento?.message || 'Error al actualizar')
        }
      } else {
        const result = await createAlimento({ variables: { fincaId: '1', ...vars } })
        if (result.data?.crearAlimento?.success) {
          showMsg('success', result.data.crearAlimento.message)
          refetch()
          setShowForm(false)
        } else {
          showMsg('error', result.data?.crearAlimento?.message || 'Error al crear')
        }
      }
    } catch (err) {
      showMsg('error', err.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      const result = await deleteAlimento({ variables: { id } })
      if (result.data?.eliminarAlimento?.success) {
        showMsg('success', result.data.eliminarAlimento.message)
        refetch()
      } else {
        showMsg('error', result.data?.eliminarAlimento?.message || 'Error al eliminar')
      }
      setShowConfirm(null)
    } catch (err) {
      showMsg('error', err.message)
      setShowConfirm(null)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const hayFiltrosActivos = searchTerm || estadoFilter !== 'todos' || tipoFilter || stockFilter !== 'todos' || vencimientoFilter !== 'todos'

  return (
    <div>
      {/* Barra búsqueda y filtros */}
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por nombre, tipo o uso recomendado..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">✕</button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 ${showFilters ? 'bg-gray-100' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
              {hayFiltrosActivos && <span className="bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>}
            </button>
            {hayFiltrosActivos && (
              <button onClick={limpiarFiltros} className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
                Limpiar
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
            <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">Todos los tipos</option>
              {Object.entries(TIPO_ALIMENTO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="todos">Todo el stock</option>
              <option value="bajo">Stock bajo</option>
              <option value="normal">Stock normal</option>
            </select>
            <select value={vencimientoFilter} onChange={e => setVencimientoFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="todos">Todos los vencimientos</option>
              <option value="vigente">Vigentes</option>
              <option value="vencido">Vencidos</option>
            </select>
          </div>
        )}

        {hayFiltrosActivos && (
          <p className="mt-3 text-sm text-gray-500">
            {alimentosFiltrados.length} de {alimentos.length} alimentos encontrados
          </p>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={openCreateForm} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">
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
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Mín.</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Precio Ref.</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Costo/kg</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Proteína %</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Uso recomendado</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {alimentosFiltrados.map(alimento => {
                const stockBajo = isStockBajo(alimento.stockCantidad, alimento.stockMinimo)
                const vencido = isVencido(alimento.fechaVencimiento)
                return (
                  <tr key={alimento.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div>{alimento.nombre}</div>
                      {vencido && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700 font-semibold">
                          Vencido
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {alimento.tipoAlimento ? (TIPO_ALIMENTO_LABELS[alimento.tipoAlimento] || alimento.tipoAlimento) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className={stockBajo ? 'text-orange-600 font-semibold' : 'text-gray-600'}>
                        {parseFloat(alimento.stockCantidad || 0).toFixed(2)} {alimento.unidadMedida || ''}
                      </div>
                      {stockBajo && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700 font-semibold">
                          Stock bajo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {parseFloat(alimento.stockMinimo || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ₲ {parseFloat(alimento.precioReferencia || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {parseFloat(alimento.costoPorKg || 0) > 0
                        ? `₲ ${parseFloat(alimento.costoPorKg).toLocaleString()}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {parseFloat(alimento.proteinaPorcentaje || 0) > 0
                        ? `${parseFloat(alimento.proteinaPorcentaje).toFixed(1)} %`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                      <span className="block truncate" title={alimento.usoRecomendado || ''}>
                        {alimento.usoRecomendado || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${alimento.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {alimento.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2 whitespace-nowrap">
                        <button onClick={() => openEditForm(alimento)} className="text-yellow-600 hover:text-yellow-800 font-medium">
                          Editar
                        </button>
                        <button onClick={() => setShowConfirm(alimento.id)} className="text-red-600 hover:text-red-800 font-medium">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal Crear / Editar ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingAlimento ? 'Editar Alimento' : 'Nuevo Alimento'}
                </h2>
                <button
                  onClick={() => { setShowForm(false); setEditingAlimento(null) }}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none font-light"
                >
                  &times;
                </button>
              </div>

              {/* Tabs de sección */}
              <div className="flex gap-1 mb-6 border-b border-gray-200">
                {SECTIONS.map(s => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setActiveSection(s.key)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                      activeSection === s.key
                        ? 'border-green-600 text-green-700 bg-green-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>

                {/* ── A. Datos básicos ── */}
                {activeSection === 'basicos' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Ej: Concentrado iniciador"
                      />
                      {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de alimento</label>
                        <select
                          name="tipoAlimento"
                          value={formData.tipoAlimento}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">-- Seleccionar --</option>
                          {Object.entries(TIPO_ALIMENTO_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida</label>
                        <select
                          name="unidadMedida"
                          value={formData.unidadMedida}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="KG">Kilogramo (kg)</option>
                          <option value="G">Gramo (g)</option>
                          <option value="L">Litro (L)</option>
                          <option value="TON">Tonelada (ton)</option>
                          <option value="BALA">Bala</option>
                          <option value="ROLLO">Rollo</option>
                          <option value="SACO">Saco</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Uso recomendado</label>
                      <input
                        type="text"
                        name="usoRecomendado"
                        value={formData.usoRecomendado}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Ej: Terneros, vacas lecheras, reproductores"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select
                        name="activo"
                        value={formData.activo ? 'true' : 'false'}
                        onChange={e => setFormData(prev => ({ ...prev, activo: e.target.value === 'true' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ── B. Inventario ── */}
                {activeSection === 'inventario' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="stockCantidad"
                          value={formData.stockCantidad}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.stockCantidad ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.stockCantidad && <p className="text-red-500 text-xs mt-1">{errors.stockCantidad}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="stockMinimo"
                          value={formData.stockMinimo}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.stockMinimo ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.stockMinimo && <p className="text-red-500 text-xs mt-1">{errors.stockMinimo}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contenido neto</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="contenidoNeto"
                        value={formData.contenidoNeto}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.contenidoNeto ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Cantidad en la unidad de medida seleccionada"
                      />
                      {errors.contenidoNeto && <p className="text-red-500 text-xs mt-1">{errors.contenidoNeto}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio referencia (Gs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="precioReferencia"
                          value={formData.precioReferencia}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.precioReferencia ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.precioReferencia && <p className="text-red-500 text-xs mt-1">{errors.precioReferencia}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Costo por kg (Gs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="costoPorKg"
                          value={formData.costoPorKg}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.costoPorKg ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.costoPorKg && <p className="text-red-500 text-xs mt-1">{errors.costoPorKg}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento</label>
                      <input
                        type="date"
                        name="fechaVencimiento"
                        value={formData.fechaVencimiento}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                )}

                {/* ── C. Valor nutricional ── */}
                {activeSection === 'nutricional' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Materia seca %</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          name="materiaSecaPorcentaje"
                          value={formData.materiaSecaPorcentaje}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.materiaSecaPorcentaje ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="0 – 100"
                        />
                        {errors.materiaSecaPorcentaje && <p className="text-red-500 text-xs mt-1">{errors.materiaSecaPorcentaje}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proteína %</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          name="proteinaPorcentaje"
                          value={formData.proteinaPorcentaje}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.proteinaPorcentaje ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="0 – 100"
                        />
                        {errors.proteinaPorcentaje && <p className="text-red-500 text-xs mt-1">{errors.proteinaPorcentaje}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fibra %</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          name="fibraPorcentaje"
                          value={formData.fibraPorcentaje}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.fibraPorcentaje ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="0 – 100"
                        />
                        {errors.fibraPorcentaje && <p className="text-red-500 text-xs mt-1">{errors.fibraPorcentaje}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Energía</label>
                      <input
                        type="text"
                        name="energia"
                        value={formData.energia}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Ej: 2.8 Mcal/kg"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-xs text-blue-700">
                      Los valores nutricionales son opcionales. Los porcentajes deben estar entre 0 y 100.
                    </div>
                  </div>
                )}

                {/* Navegación + botones */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    {activeSection !== 'basicos' && (
                      <button
                        type="button"
                        onClick={() => setActiveSection(activeSection === 'nutricional' ? 'inventario' : 'basicos')}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm text-gray-600"
                      >
                        ← Anterior
                      </button>
                    )}
                    {activeSection !== 'nutricional' && (
                      <button
                        type="button"
                        onClick={() => setActiveSection(activeSection === 'basicos' ? 'inventario' : 'nutricional')}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm text-gray-600"
                      >
                        Siguiente →
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditingAlimento(null) }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                    >
                      {editingAlimento ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-2">¿Eliminar alimento?</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Si el alimento está siendo usado en compras o alimentación animal no podrá eliminarse físicamente. Puede inactivarlo en su lugar.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(showConfirm)}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
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
