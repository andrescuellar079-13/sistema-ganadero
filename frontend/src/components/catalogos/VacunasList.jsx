import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_VACUNAS, CREATE_VACUNA, UPDATE_VACUNA, DELETE_VACUNA } from '../../graphql/catalogos'
import LoadingSpinner from '../LoadingSpinner'
import ErrorMessage from '../ErrorMessage'

const VIA_OPCIONES = [
  { value: 'INTRAMUSCULAR', label: 'Intramuscular' },
  { value: 'SUBCUTANEA', label: 'Subcutánea' },
  { value: 'INTRADERMICA', label: 'Intradérmica' },
  { value: 'ORAL', label: 'Oral' },
]

const SEXO_OPCIONES = [
  { value: 'AMBOS', label: 'Ambos' },
  { value: 'MACHO', label: 'Macho' },
  { value: 'HEMBRA', label: 'Hembra' },
]

const TIPO_PRODUCCION_OPCIONES = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'CARNE', label: 'Carne' },
  { value: 'LECHE', label: 'Leche' },
  { value: 'DOBLE_PROPOSITO', label: 'Doble propósito' },
]

const FORM_INICIAL = {
  // Datos básicos
  nombre: '',
  descripcion: '',
  enfermedadPreviene: '',
  laboratorio: '',
  lote: '',
  activo: true,
  // Aplicación
  dosisRecomendada: '',
  viaAplicacion: 'INTRAMUSCULAR',
  intervaloDias: 365,
  edadMinimaMeses: 0,
  requiereRefuerzo: false,
  diasAnticipacionAlerta: 30,
  // Aplicabilidad
  sexoAplicable: 'AMBOS',
  tipoProduccionAplicable: 'TODOS',
  // Inventario
  stockCantidad: '',
  stockMinimo: '',
  fechaVencimiento: '',
  // Observaciones
  observacionesTecnicas: '',
}

// Indicadores: usa los flags del backend con fallback de cálculo local
const esStockBajo = (v) => {
  if (typeof v.isStockBajo === 'boolean') return v.isStockBajo
  const min = parseFloat(v.stockMinimo || 0)
  return min > 0 && parseFloat(v.stockCantidad || 0) <= min
}

const esVencida = (v) => {
  if (typeof v.isVencida === 'boolean') return v.isVencida
  if (!v.fechaVencimiento) return false
  return new Date(v.fechaVencimiento) < new Date(new Date().toDateString())
}

export default function VacunasList() {
  const { data, loading, error, refetch } = useQuery(GET_VACUNAS)
  const [createVacuna] = useMutation(CREATE_VACUNA)
  const [updateVacuna] = useMutation(UPDATE_VACUNA)
  const [deleteVacuna] = useMutation(DELETE_VACUNA)

  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [formErrors, setFormErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [showConfirm, setShowConfirm] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [stockBajoFilter, setStockBajoFilter] = useState(false)
  const [vencidasFilter, setVencidasFilter] = useState(false)
  const [viaFilter, setViaFilter] = useState('todos')
  const [sexoFilter, setSexoFilter] = useState('todos')
  const [tipoProduccionFilter, setTipoProduccionFilter] = useState('todos')

  const vacunas = data?.vacunas || []

  const vacunasFiltradas = useMemo(() => {
    let filtered = [...vacunas]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(v =>
        v.nombre?.toLowerCase().includes(term) ||
        v.descripcion?.toLowerCase().includes(term) ||
        v.enfermedadPreviene?.toLowerCase().includes(term) ||
        v.laboratorio?.toLowerCase().includes(term)
      )
    }
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter(v => estadoFilter === 'activo' ? v.activo : !v.activo)
    }
    if (stockBajoFilter) {
      filtered = filtered.filter(v => esStockBajo(v))
    }
    if (vencidasFilter) {
      filtered = filtered.filter(v => esVencida(v))
    }
    if (viaFilter !== 'todos') {
      filtered = filtered.filter(v => v.viaAplicacion === viaFilter)
    }
    if (sexoFilter !== 'todos') {
      filtered = filtered.filter(v => v.sexoAplicable === sexoFilter)
    }
    if (tipoProduccionFilter !== 'todos') {
      filtered = filtered.filter(v => v.tipoProduccionAplicable === tipoProduccionFilter)
    }
    return filtered
  }, [vacunas, searchTerm, estadoFilter, stockBajoFilter, vencidasFilter, viaFilter, sexoFilter, tipoProduccionFilter])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setEstadoFilter('todos')
    setStockBajoFilter(false)
    setVencidasFilter(false)
    setViaFilter('todos')
    setSexoFilter('todos')
    setTipoProduccionFilter('todos')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }))
  }

  const validar = () => {
    const errors = {}
    if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio'
    if (!form.dosisRecomendada.trim()) errors.dosisRecomendada = 'La dosis es obligatoria'
    if (!form.viaAplicacion) errors.viaAplicacion = 'La vía de aplicación es obligatoria'
    if (form.stockCantidad !== '' && parseFloat(form.stockCantidad) < 0) errors.stockCantidad = 'No puede ser negativo'
    if (form.stockMinimo !== '' && parseFloat(form.stockMinimo) < 0) errors.stockMinimo = 'No puede ser negativo'
    if (form.intervaloDias !== '' && parseInt(form.intervaloDias) < 0) errors.intervaloDias = 'No puede ser negativo'
    if (form.edadMinimaMeses !== '' && parseInt(form.edadMinimaMeses) < 0) errors.edadMinimaMeses = 'No puede ser negativo'
    if (form.diasAnticipacionAlerta !== '' && parseInt(form.diasAnticipacionAlerta) < 0) errors.diasAnticipacionAlerta = 'No puede ser negativo'
    return errors
  }

  const abrirCrear = () => {
    setEditando(null)
    setForm(FORM_INICIAL)
    setFormErrors({})
    setShowForm(true)
  }

  const abrirEditar = (vacuna) => {
    setEditando(vacuna.id)
    setForm({
      nombre: vacuna.nombre || '',
      descripcion: vacuna.descripcion || '',
      enfermedadPreviene: vacuna.enfermedadPreviene || '',
      laboratorio: vacuna.laboratorio || '',
      lote: vacuna.lote || '',
      activo: vacuna.activo,
      dosisRecomendada: vacuna.dosisRecomendada || '',
      viaAplicacion: vacuna.viaAplicacion || 'INTRAMUSCULAR',
      intervaloDias: vacuna.intervaloDias ?? 365,
      edadMinimaMeses: vacuna.edadMinimaMeses ?? 0,
      requiereRefuerzo: vacuna.requiereRefuerzo ?? false,
      diasAnticipacionAlerta: vacuna.diasAnticipacionAlerta ?? 30,
      sexoAplicable: vacuna.sexoAplicable || 'AMBOS',
      tipoProduccionAplicable: vacuna.tipoProduccionAplicable || 'TODOS',
      stockCantidad: vacuna.stockCantidad ?? '',
      stockMinimo: vacuna.stockMinimo ?? '',
      fechaVencimiento: vacuna.fechaVencimiento || '',
      observacionesTecnicas: vacuna.observacionesTecnicas || '',
    })
    setFormErrors({})
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validar()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const variables = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion || null,
      enfermedadPreviene: form.enfermedadPreviene || null,
      laboratorio: form.laboratorio || null,
      lote: form.lote || null,
      dosisRecomendada: form.dosisRecomendada.trim(),
      viaAplicacion: form.viaAplicacion,
      intervaloDias: parseInt(form.intervaloDias) || 365,
      edadMinimaMeses: parseInt(form.edadMinimaMeses) || 0,
      requiereRefuerzo: !!form.requiereRefuerzo,
      diasAnticipacionAlerta: form.diasAnticipacionAlerta !== '' ? parseInt(form.diasAnticipacionAlerta) : 30,
      sexoAplicable: form.sexoAplicable,
      tipoProduccionAplicable: form.tipoProduccionAplicable,
      stockCantidad: form.stockCantidad !== '' ? parseFloat(form.stockCantidad) : 0,
      stockMinimo: form.stockMinimo !== '' ? parseFloat(form.stockMinimo) : 0,
      fechaVencimiento: form.fechaVencimiento || null,
      observacionesTecnicas: form.observacionesTecnicas || null,
    }

    try {
      let result
      if (editando) {
        result = await updateVacuna({ variables: { id: editando, ...variables, activo: form.activo } })
        if (result.data?.actualizarVacuna?.success) {
          mostrarMensaje('success', result.data.actualizarVacuna.message)
          refetch()
          setShowForm(false)
        } else {
          mostrarMensaje('error', result.data?.actualizarVacuna?.message || 'Error al actualizar')
        }
      } else {
        const fincaId = localStorage.getItem('fincaId') || '1'
        result = await createVacuna({ variables: { fincaId, ...variables } })
        if (result.data?.crearVacuna?.success) {
          mostrarMensaje('success', result.data.crearVacuna.message)
          refetch()
          setShowForm(false)
        } else {
          mostrarMensaje('error', result.data?.crearVacuna?.message || 'Error al crear')
        }
      }
    } catch (err) {
      mostrarMensaje('error', err.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      const result = await deleteVacuna({ variables: { id } })
      if (result.data?.eliminarVacuna?.success) {
        mostrarMensaje('success', result.data.eliminarVacuna.message)
        refetch()
      } else {
        mostrarMensaje('error', result.data?.eliminarVacuna?.message || 'Error al eliminar')
      }
      setShowConfirm(null)
    } catch (err) {
      mostrarMensaje('error', err.message)
    }
  }

  const toggleActivo = async (vacuna) => {
    try {
      const result = await updateVacuna({ variables: { id: vacuna.id, activo: !vacuna.activo } })
      if (result.data?.actualizarVacuna?.success) {
        mostrarMensaje('success', `Vacuna ${!vacuna.activo ? 'activada' : 'inactivada'} correctamente`)
        refetch()
      } else {
        mostrarMensaje('error', result.data?.actualizarVacuna?.message || 'Error al cambiar estado')
      }
    } catch (err) {
      mostrarMensaje('error', err.message)
    }
  }

  const mostrarMensaje = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const viaLabel = (val) => VIA_OPCIONES.find(o => o.value === val)?.label || val

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const hayFiltros = searchTerm || estadoFilter !== 'todos' || stockBajoFilter || vencidasFilter ||
    viaFilter !== 'todos' || sexoFilter !== 'todos' || tipoProduccionFilter !== 'todos'

  return (
    <div>
      {/* Barra búsqueda y filtros */}
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por nombre, enfermedad, laboratorio..."
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
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
            </button>
            {hayFiltros && (
              <button onClick={limpiarFiltros} className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
            <select value={viaFilter} onChange={(e) => setViaFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="todos">Todas las vías</option>
              {VIA_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={sexoFilter} onChange={(e) => setSexoFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="todos">Todos los sexos</option>
              {SEXO_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={tipoProduccionFilter} onChange={(e) => setTipoProduccionFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="todos">Todos los tipos de producción</option>
              {TIPO_PRODUCCION_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={stockBajoFilter} onChange={(e) => setStockBajoFilter(e.target.checked)} />
              <span className="text-sm text-gray-700">Solo stock bajo</span>
            </label>
            <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={vencidasFilter} onChange={(e) => setVencidasFilter(e.target.checked)} />
              <span className="text-sm text-gray-700">Solo vencidas</span>
            </label>
          </div>
        )}

        {hayFiltros && (
          <div className="mt-3 text-sm text-gray-500">
            {vacunasFiltradas.length} de {vacunas.length} vacunas encontradas
          </div>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={abrirCrear} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">
          + Nueva Vacuna
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {vacunasFiltradas.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{hayFiltros ? 'No hay vacunas que coincidan con la búsqueda' : 'No hay vacunas registradas'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Enfermedad previene</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Dosis</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Vía</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Intervalo</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Edad mín.</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stock mín.</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Vencimiento</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Laboratorio</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vacunasFiltradas.map((v) => {
                const stockBajo = esStockBajo(v)
                const vencida = esVencida(v)
                return (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.enfermedadPreviene || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.dosisRecomendada}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{viaLabel(v.viaAplicacion)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.intervaloDias ?? 0} días</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.edadMinimaMeses ?? 0} m</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className={stockBajo ? 'text-red-600 font-medium' : ''}>{v.stockCantidad ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.stockMinimo ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className={vencida ? 'text-red-600 font-medium' : ''}>{v.fechaVencimiento || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.laboratorio || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs text-center ${v.activo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                          {v.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        {stockBajo && (
                          <span className="px-2 py-0.5 rounded-full text-xs text-center bg-amber-100 text-amber-800">Stock bajo</span>
                        )}
                        {vencida && (
                          <span className="px-2 py-0.5 rounded-full text-xs text-center bg-red-100 text-red-800">Vencida</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => abrirEditar(v)} className="text-yellow-600 hover:text-yellow-800 text-xs font-medium">Editar</button>
                        <button onClick={() => toggleActivo(v)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                          {v.activo ? 'Inactivar' : 'Activar'}
                        </button>
                        <button onClick={() => setShowConfirm(v.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-5 text-gray-800">
                {editando ? 'Editar Vacuna' : 'Nueva Vacuna'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* 1. Datos básicos */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">Datos básicos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                      <input
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 ${formErrors.nombre ? 'border-red-500' : ''}`}
                        placeholder="Ej: Aftosa Doble Oleosa"
                      />
                      {formErrors.nombre && <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enfermedad que previene</label>
                      <input
                        name="enfermedadPreviene"
                        value={form.enfermedadPreviene}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Ej: Fiebre Aftosa"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
                      <input name="laboratorio" value={form.laboratorio} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" placeholder="Ej: Biogénesis" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                      <input name="lote" value={form.lote} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" placeholder="Ej: LOT-2024-001" />
                    </div>
                    {editando && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select name="activo" value={form.activo} onChange={(e) => setForm(prev => ({ ...prev, activo: e.target.value === 'true' }))} className="w-full px-3 py-2 border rounded-md">
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Aplicación sanitaria */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">Aplicación sanitaria</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dosis recomendada *</label>
                      <input
                        name="dosisRecomendada"
                        value={form.dosisRecomendada}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md ${formErrors.dosisRecomendada ? 'border-red-500' : ''}`}
                        placeholder="Ej: 2 ml"
                      />
                      {formErrors.dosisRecomendada && <p className="text-red-500 text-xs mt-1">{formErrors.dosisRecomendada}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vía de aplicación *</label>
                      <select name="viaAplicacion" value={form.viaAplicacion} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
                        {VIA_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo días (refuerzo)</label>
                      <input
                        type="number"
                        name="intervaloDias"
                        value={form.intervaloDias}
                        onChange={handleChange}
                        min={0}
                        className={`w-full px-3 py-2 border rounded-md ${formErrors.intervaloDias ? 'border-red-500' : ''}`}
                      />
                      {formErrors.intervaloDias && <p className="text-red-500 text-xs mt-1">{formErrors.intervaloDias}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Edad mínima (meses)</label>
                      <input
                        type="number"
                        name="edadMinimaMeses"
                        value={form.edadMinimaMeses}
                        onChange={handleChange}
                        min={0}
                        className={`w-full px-3 py-2 border rounded-md ${formErrors.edadMinimaMeses ? 'border-red-500' : ''}`}
                      />
                      {formErrors.edadMinimaMeses && <p className="text-red-500 text-xs mt-1">{formErrors.edadMinimaMeses}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Días anticipación alerta</label>
                      <input
                        type="number"
                        name="diasAnticipacionAlerta"
                        value={form.diasAnticipacionAlerta}
                        onChange={handleChange}
                        min={0}
                        className={`w-full px-3 py-2 border rounded-md ${formErrors.diasAnticipacionAlerta ? 'border-red-500' : ''}`}
                      />
                      {formErrors.diasAnticipacionAlerta && <p className="text-red-500 text-xs mt-1">{formErrors.diasAnticipacionAlerta}</p>}
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer py-2">
                        <input type="checkbox" name="requiereRefuerzo" checked={form.requiereRefuerzo} onChange={handleChange} />
                        <span className="text-sm font-medium text-gray-700">Requiere refuerzo</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. Inventario */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">Inventario</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
                      <input
                        type="number"
                        step="0.01"
                        name="stockCantidad"
                        value={form.stockCantidad}
                        onChange={handleChange}
                        min={0}
                        className={`w-full px-3 py-2 border rounded-md ${formErrors.stockCantidad ? 'border-red-500' : ''}`}
                      />
                      {formErrors.stockCantidad && <p className="text-red-500 text-xs mt-1">{formErrors.stockCantidad}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
                      <input
                        type="number"
                        step="0.01"
                        name="stockMinimo"
                        value={form.stockMinimo}
                        onChange={handleChange}
                        min={0}
                        className={`w-full px-3 py-2 border rounded-md ${formErrors.stockMinimo ? 'border-red-500' : ''}`}
                      />
                      {formErrors.stockMinimo && <p className="text-red-500 text-xs mt-1">{formErrors.stockMinimo}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento</label>
                      <input type="date" name="fechaVencimiento" value={form.fechaVencimiento} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                  </div>
                </div>

                {/* 4. Aplicabilidad */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">Aplicabilidad</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sexo aplicable</label>
                      <select name="sexoAplicable" value={form.sexoAplicable} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
                        {SEXO_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de producción aplicable</label>
                      <select name="tipoProduccionAplicable" value={form.tipoProduccionAplicable} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
                        {TIPO_PRODUCCION_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 5. Observaciones */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">Observaciones</h3>
                  <textarea
                    name="observacionesTecnicas"
                    value={form.observacionesTecnicas}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Conservación, contraindicaciones, recomendaciones técnicas..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
                    {editando ? 'Actualizar' : 'Crear'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-md hover:bg-gray-400">
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
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-2">¿Eliminar vacuna?</h3>
            <p className="text-gray-600 mb-1 text-sm">Si la vacuna está usada en vacunaciones registradas, no se podrá eliminar.</p>
            <p className="text-gray-500 mb-6 text-sm">Considera inactivarla en su lugar.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(showConfirm)} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700">Eliminar</button>
              <button onClick={() => setShowConfirm(null)} className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
