import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_VETERINARIOS,
  CREATE_VETERINARIO,
  UPDATE_VETERINARIO,
  DELETE_VETERINARIO,
} from '../../graphql/catalogos'
import LoadingSpinner from '../LoadingSpinner'
import ErrorMessage from '../ErrorMessage'

const TIPO_SERVICIO_LABELS = {
  SANIDAD: 'Sanidad',
  REPRODUCCION: 'Reproducción',
  CIRUGIA: 'Cirugía',
  DIAGNOSTICO: 'Diagnóstico',
  GENERAL: 'General',
}

const FORM_INITIAL = {
  nombre: '',
  apellidos: '',
  ci: '',
  telefono: '',
  email: '',
  direccion: '',
  activo: true,
  matriculaProfesional: '',
  especialidad: '',
  tipoServicio: '',
  costoVisita: '',
  observaciones: '',
}

const SECTIONS = [
  { key: 'personal', label: 'A. Datos personales' },
  { key: 'profesional', label: 'B. Datos profesionales' },
  { key: 'observaciones', label: 'C. Observaciones' },
]

function isEmailValido(email) {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function VeterinariosList() {
  const { data, loading, error, refetch } = useQuery(GET_VETERINARIOS)
  const [createVeterinario] = useMutation(CREATE_VETERINARIO)
  const [updateVeterinario] = useMutation(UPDATE_VETERINARIO)
  const [deleteVeterinario] = useMutation(DELETE_VETERINARIO)

  const [showForm, setShowForm] = useState(false)
  const [editingVeterinario, setEditingVeterinario] = useState(null)
  const [activeSection, setActiveSection] = useState('personal')
  const [message, setMessage] = useState(null)
  const [showConfirm, setShowConfirm] = useState(null)
  const [errors, setErrors] = useState({})

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [tipoServicioFilter, setTipoServicioFilter] = useState('')
  const [especialidadFilter, setEspecialidadFilter] = useState('')

  const [formData, setFormData] = useState({ ...FORM_INITIAL })

  const veterinarios = data?.veterinarios || []

  const especialidadesUnicas = useMemo(() => {
    const set = new Set(veterinarios.map(v => v.especialidad).filter(Boolean))
    return [...set].sort()
  }, [veterinarios])

  const veterinariosFiltrados = useMemo(() => {
    let filtered = [...veterinarios]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(v =>
        v.nombre?.toLowerCase().includes(term) ||
        v.apellidos?.toLowerCase().includes(term) ||
        v.ci?.toLowerCase().includes(term) ||
        v.matriculaProfesional?.toLowerCase().includes(term) ||
        v.especialidad?.toLowerCase().includes(term)
      )
    }
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter(v => estadoFilter === 'activo' ? v.activo : !v.activo)
    }
    if (tipoServicioFilter) {
      filtered = filtered.filter(v => v.tipoServicio === tipoServicioFilter)
    }
    if (especialidadFilter) {
      filtered = filtered.filter(v => v.especialidad === especialidadFilter)
    }

    return filtered
  }, [veterinarios, searchTerm, estadoFilter, tipoServicioFilter, especialidadFilter])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setEstadoFilter('todos')
    setTipoServicioFilter('')
    setEspecialidadFilter('')
  }

  const openCreateForm = () => {
    setEditingVeterinario(null)
    setFormData({ ...FORM_INITIAL })
    setErrors({})
    setActiveSection('personal')
    setShowForm(true)
  }

  const openEditForm = (vet) => {
    setEditingVeterinario(vet)
    setFormData({
      nombre: vet.nombre || '',
      apellidos: vet.apellidos || '',
      ci: vet.ci || '',
      telefono: vet.telefono || '',
      email: vet.email || '',
      direccion: vet.direccion || '',
      activo: vet.activo,
      matriculaProfesional: vet.matriculaProfesional || '',
      especialidad: vet.especialidad || '',
      tipoServicio: vet.tipoServicio || '',
      costoVisita: vet.costoVisita ?? '',
      observaciones: vet.observaciones || '',
    })
    setErrors({})
    setActiveSection('personal')
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
    if (formData.email && !isEmailValido(formData.email)) {
      e.email = 'El formato del email no es válido'
    }
    if (formData.costoVisita !== '' && parseFloat(formData.costoVisita) < 0) {
      e.costoVisita = 'El costo de visita no puede ser negativo'
    }
    return e
  }

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const buildVariables = () => ({
    nombre: formData.nombre.trim(),
    apellidos: formData.apellidos || null,
    ci: formData.ci || null,
    telefono: formData.telefono || null,
    email: formData.email || null,
    direccion: formData.direccion || null,
    matriculaProfesional: formData.matriculaProfesional || null,
    especialidad: formData.especialidad || null,
    tipoServicio: formData.tipoServicio || null,
    costoVisita: formData.costoVisita !== '' ? parseFloat(formData.costoVisita) : 0,
    observaciones: formData.observaciones || null,
    activo: formData.activo,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      const firstErr = Object.keys(errs)[0]
      if (['nombre', 'apellidos', 'ci', 'telefono', 'email', 'direccion'].includes(firstErr)) setActiveSection('personal')
      else if (['matriculaProfesional', 'especialidad', 'tipoServicio', 'costoVisita'].includes(firstErr)) setActiveSection('profesional')
      else setActiveSection('observaciones')
      return
    }

    const vars = buildVariables()
    try {
      if (editingVeterinario) {
        const result = await updateVeterinario({ variables: { id: editingVeterinario.id, ...vars } })
        if (result.data?.actualizarVeterinario?.success) {
          showMsg('success', result.data.actualizarVeterinario.message)
          refetch()
          setShowForm(false)
        } else {
          showMsg('error', result.data?.actualizarVeterinario?.message || 'Error al actualizar')
        }
      } else {
        const result = await createVeterinario({ variables: { fincaId: '1', ...vars } })
        if (result.data?.crearVeterinario?.success) {
          showMsg('success', result.data.crearVeterinario.message)
          refetch()
          setShowForm(false)
        } else {
          showMsg('error', result.data?.crearVeterinario?.message || 'Error al crear')
        }
      }
    } catch (err) {
      showMsg('error', err.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      const result = await deleteVeterinario({ variables: { id } })
      if (result.data?.eliminarVeterinario?.success) {
        showMsg('success', result.data.eliminarVeterinario.message)
        refetch()
      } else {
        showMsg('error', result.data?.eliminarVeterinario?.message || 'Error al eliminar')
      }
      setShowConfirm(null)
    } catch (err) {
      showMsg('error', err.message)
      setShowConfirm(null)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const hayFiltrosActivos = searchTerm || estadoFilter !== 'todos' || tipoServicioFilter || especialidadFilter

  return (
    <div>
      {/* Barra búsqueda y filtros */}
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por nombre, apellido, CI, matrícula o especialidad..."
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
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
            <select value={tipoServicioFilter} onChange={e => setTipoServicioFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">Todos los tipos de servicio</option>
              {Object.entries(TIPO_SERVICIO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select value={especialidadFilter} onChange={e => setEspecialidadFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">Todas las especialidades</option>
              {especialidadesUnicas.map(esp => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>
        )}

        {hayFiltrosActivos && (
          <p className="mt-3 text-sm text-gray-500">
            {veterinariosFiltrados.length} de {veterinarios.length} veterinarios encontrados
          </p>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={openCreateForm} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">
          + Nuevo Veterinario
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {veterinariosFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {hayFiltrosActivos ? 'No hay veterinarios que coincidan con la búsqueda' : 'No hay veterinarios registrados'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Apellidos</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Matrícula</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Especialidad</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo servicio</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Costo visita</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {veterinariosFiltrados.map(vet => (
                <tr key={vet.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{vet.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{vet.apellidos || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{vet.matriculaProfesional || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{vet.especialidad || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {vet.tipoServicio ? (TIPO_SERVICIO_LABELS[vet.tipoServicio] || vet.tipoServicio) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{vet.telefono || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {parseFloat(vet.costoVisita || 0) > 0
                      ? `₲ ${parseFloat(vet.costoVisita).toLocaleString()}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${vet.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {vet.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2 whitespace-nowrap">
                      <button onClick={() => openEditForm(vet)} className="text-yellow-600 hover:text-yellow-800 font-medium">
                        Editar
                      </button>
                      <button onClick={() => setShowConfirm(vet.id)} className="text-red-600 hover:text-red-800 font-medium">
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

      {/* ── Modal Crear / Editar ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingVeterinario ? 'Editar Veterinario' : 'Nuevo Veterinario'}
                </h2>
                <button
                  onClick={() => { setShowForm(false); setEditingVeterinario(null) }}
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

                {/* ── A. Datos personales ── */}
                {activeSection === 'personal' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                          placeholder="Ej: Juan"
                        />
                        {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                        <input
                          type="text"
                          name="apellidos"
                          value={formData.apellidos}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Ej: Pérez González"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CI</label>
                        <input
                          type="text"
                          name="ci"
                          value={formData.ci}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Número de cédula"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                          type="text"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Ej: 0981 123456"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="correo@ejemplo.com"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                      <input
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Dirección del consultorio o domicilio"
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

                {/* ── B. Datos profesionales ── */}
                {activeSection === 'profesional' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula profesional</label>
                        <input
                          type="text"
                          name="matriculaProfesional"
                          value={formData.matriculaProfesional}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Ej: VET-00123"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                        <input
                          type="text"
                          name="especialidad"
                          value={formData.especialidad}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Ej: Bovinos, Cirugía, Reproducción"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de servicio</label>
                        <select
                          name="tipoServicio"
                          value={formData.tipoServicio}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">-- Seleccionar --</option>
                          {Object.entries(TIPO_SERVICIO_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Costo de visita (Gs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="costoVisita"
                          value={formData.costoVisita}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.costoVisita ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="0"
                        />
                        {errors.costoVisita && <p className="text-red-500 text-xs mt-1">{errors.costoVisita}</p>}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-xs text-blue-700">
                      La matrícula y especialidad se usarán como referencia en vacunaciones, tratamientos y diagnósticos.
                    </div>
                  </div>
                )}

                {/* ── C. Observaciones ── */}
                {activeSection === 'observaciones' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                      <textarea
                        name="observaciones"
                        value={formData.observaciones}
                        onChange={handleChange}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        placeholder="Notas adicionales sobre el veterinario, horarios, condiciones de contratación, etc."
                      />
                    </div>
                  </div>
                )}

                {/* Navegación + botones */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    {activeSection !== 'personal' && (
                      <button
                        type="button"
                        onClick={() => setActiveSection(activeSection === 'observaciones' ? 'profesional' : 'personal')}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm text-gray-600"
                      >
                        ← Anterior
                      </button>
                    )}
                    {activeSection !== 'observaciones' && (
                      <button
                        type="button"
                        onClick={() => setActiveSection(activeSection === 'personal' ? 'profesional' : 'observaciones')}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm text-gray-600"
                      >
                        Siguiente →
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditingVeterinario(null) }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                    >
                      {editingVeterinario ? 'Actualizar' : 'Crear'}
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
            <h3 className="text-lg font-bold mb-2">¿Eliminar veterinario?</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Si el veterinario está asociado a vacunaciones, tratamientos, desparasitaciones o diagnósticos, no podrá eliminarse. Puede inactivarlo en su lugar.
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
