import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_REPRODUCTORES,
  CREATE_REPRODUCTOR,
  UPDATE_REPRODUCTOR,
  DELETE_REPRODUCTOR,
  GET_RAZAS,
} from '../../graphql/catalogos'
import LoadingSpinner from '../LoadingSpinner'
import ErrorMessage from '../ErrorMessage'

const TIPO_ORIGEN_OPCIONES = [
  { value: 'INTERNO', label: 'Interno (toro propio)' },
  { value: 'EXTERNO', label: 'Externo (otra finca)' },
  { value: 'SEMEN', label: 'Semen (pajuela)' },
]

const TIPO_REPRODUCTOR_OPCIONES = [
  { value: 'TORO', label: 'Toro' },
  { value: 'SEMEN_CONVENCIONAL', label: 'Semen Convencional' },
  { value: 'SEMEN_SEXADO', label: 'Semen Sexado' },
]

const FORM_INICIAL = {
  codigo: '',
  nombre: '',
  razaId: '',
  tipoOrigen: 'INTERNO',
  tipoReproductor: 'TORO',
  animalInternoId: '',
  codigoPajuela: '',
  laboratorio: '',
  stockPajuelas: '',
  costoPajuela: '',
  facilidadParto: '',
  valorGenetico: '',
  observaciones: '',
  activo: true,
}

export default function ReproductoresList() {
  const { data, loading, error, refetch } = useQuery(GET_REPRODUCTORES)
  const { data: razasData } = useQuery(GET_RAZAS)
  const [create] = useMutation(CREATE_REPRODUCTOR)
  const [update] = useMutation(UPDATE_REPRODUCTOR)
  const [remove] = useMutation(DELETE_REPRODUCTOR)

  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [formErrors, setFormErrors] = useState({})
  const [msg, setMsg] = useState(null)
  const [showConfirm, setShowConfirm] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [tipoOrigenFilter, setTipoOrigenFilter] = useState('todos')
  const [estadoFilter, setEstadoFilter] = useState('todos')

  const items = data?.reproductores || []
  const razas = razasData?.razas || []

  const itemsFiltrados = useMemo(() => {
    let filtered = [...items]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r =>
        r.codigo?.toLowerCase().includes(term) ||
        r.nombre?.toLowerCase().includes(term) ||
        r.codigoPajuela?.toLowerCase().includes(term)
      )
    }
    if (tipoOrigenFilter !== 'todos') filtered = filtered.filter(r => r.tipoOrigen === tipoOrigenFilter)
    if (estadoFilter !== 'todos') filtered = filtered.filter(r => estadoFilter === 'activo' ? r.activo : !r.activo)
    return filtered
  }, [items, searchTerm, tipoOrigenFilter, estadoFilter])

  const limpiarFiltros = () => { setSearchTerm(''); setTipoOrigenFilter('todos'); setEstadoFilter('todos') }

  const mostrarMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      // Al cambiar tipo origen, ajustar tipo reproductor por defecto
      if (name === 'tipoOrigen') {
        if (value === 'SEMEN') next.tipoReproductor = 'SEMEN_CONVENCIONAL'
        else next.tipoReproductor = 'TORO'
      }
      return next
    })
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }))
  }

  const validar = () => {
    const errors = {}
    if (!form.codigo.trim()) errors.codigo = 'El código es obligatorio'
    if (!form.tipoOrigen) errors.tipoOrigen = 'El tipo de origen es obligatorio'
    if (form.tipoOrigen === 'SEMEN' && !form.codigoPajuela.trim()) errors.codigoPajuela = 'El código de pajuela es obligatorio para tipo Semen'
    if (form.stockPajuelas !== '' && parseInt(form.stockPajuelas) < 0) errors.stockPajuelas = 'No puede ser negativo'
    return errors
  }

  const abrirCrear = () => {
    setEditando(null)
    setForm(FORM_INICIAL)
    setFormErrors({})
    setShowForm(true)
  }

  const abrirEditar = (item) => {
    setEditando(item.id)
    setForm({
      codigo: item.codigo || '',
      nombre: item.nombre || '',
      razaId: item.raza?.id || '',
      tipoOrigen: item.tipoOrigen || 'INTERNO',
      tipoReproductor: item.tipoReproductor || 'TORO',
      animalInternoId: item.animalInterno?.id || '',
      codigoPajuela: item.codigoPajuela || '',
      laboratorio: item.laboratorio || '',
      stockPajuelas: item.stockPajuelas ?? '',
      costoPajuela: item.costoPajuela ?? '',
      facilidadParto: item.facilidadParto ?? '',
      valorGenetico: item.valorGenetico ?? '',
      observaciones: item.observaciones || '',
      activo: item.activo,
    })
    setFormErrors({})
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validar()
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    const variables = {
      razaId: form.razaId || null,
      nombre: form.nombre || null,
      tipoOrigen: form.tipoOrigen,
      tipoReproductor: form.tipoReproductor || null,
      animalInternoId: form.tipoOrigen === 'INTERNO' && form.animalInternoId ? form.animalInternoId : null,
      codigoPajuela: form.tipoOrigen === 'SEMEN' ? form.codigoPajuela : null,
      laboratorio: form.laboratorio || null,
      stockPajuelas: form.stockPajuelas !== '' ? parseInt(form.stockPajuelas) : 0,
      costoPajuela: form.costoPajuela !== '' ? parseFloat(form.costoPajuela) : null,
      facilidadParto: form.facilidadParto !== '' ? parseFloat(form.facilidadParto) : null,
      valorGenetico: form.valorGenetico !== '' ? parseFloat(form.valorGenetico) : null,
      observaciones: form.observaciones || null,
    }

    try {
      if (editando) {
        const res = await update({ variables: { id: editando, ...variables, activo: form.activo } })
        if (res.data?.actualizarReproductor?.success) {
          mostrarMsg('success', res.data.actualizarReproductor.message)
          refetch(); setShowForm(false)
        } else {
          mostrarMsg('error', res.data?.actualizarReproductor?.message || 'Error al actualizar')
        }
      } else {
        const fincaId = localStorage.getItem('fincaId') || '1'
        const res = await create({ variables: { fincaId, codigo: form.codigo, ...variables } })
        if (res.data?.crearReproductor?.success) {
          mostrarMsg('success', res.data.crearReproductor.message)
          refetch(); setShowForm(false)
        } else {
          mostrarMsg('error', res.data?.crearReproductor?.message || 'Error al crear')
        }
      }
    } catch (err) {
      mostrarMsg('error', err.message)
    }
  }

  const handleEliminar = async (id) => {
    try {
      const res = await remove({ variables: { id } })
      if (res.data?.eliminarReproductor?.success) {
        mostrarMsg('success', res.data.eliminarReproductor.message)
        refetch()
      } else {
        mostrarMsg('error', res.data?.eliminarReproductor?.message || 'Error al eliminar')
      }
      setShowConfirm(null)
    } catch (err) {
      mostrarMsg('error', err.message)
    }
  }

  const toggleActivo = async (item) => {
    try {
      const res = await update({ variables: { id: item.id, activo: !item.activo } })
      if (res.data?.actualizarReproductor?.success) {
        mostrarMsg('success', `Reproductor ${!item.activo ? 'activado' : 'inactivado'} correctamente`)
        refetch()
      } else {
        mostrarMsg('error', res.data?.actualizarReproductor?.message || 'Error')
      }
    } catch (err) {
      mostrarMsg('error', err.message)
    }
  }

  const tipoOrigenLabel = (v) => TIPO_ORIGEN_OPCIONES.find(o => o.value === v)?.label || v
  const tipoReprodLabel = (v) => TIPO_REPRODUCTOR_OPCIONES.find(o => o.value === v)?.label || v

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const hayFiltros = searchTerm || tipoOrigenFilter !== 'todos' || estadoFilter !== 'todos'

  return (
    <div>
      {/* Búsqueda y filtros */}
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por código, nombre o código pajuela..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
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
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={tipoOrigenFilter} onChange={(e) => setTipoOrigenFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="todos">Todos los tipos</option>
              {TIPO_ORIGEN_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        )}

        {hayFiltros && (
          <div className="mt-3 text-sm text-gray-500">
            {itemsFiltrados.length} de {items.length} reproductores encontrados
          </div>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={abrirCrear} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
          + Nuevo Reproductor
        </button>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-md ${msg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      {itemsFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{hayFiltros ? 'No hay reproductores que coincidan con la búsqueda' : 'No hay reproductores registrados'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Raza</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tipo origen</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tipo reproductor</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Animal interno</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cód. pajuela</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stock pajuelas</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {itemsFiltrados.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.codigo}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{item.nombre || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.raza?.nombre || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.tipoOrigen === 'INTERNO' ? 'bg-blue-100 text-blue-800' :
                      item.tipoOrigen === 'EXTERNO' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.tipoOrigen === 'INTERNO' ? 'Interno' : item.tipoOrigen === 'EXTERNO' ? 'Externo' : 'Semen'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.tipoReproductor ? tipoReprodLabel(item.tipoReproductor) : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.animalInterno ? `${item.animalInterno.nombre || ''} ${item.animalInterno.nroArete ? `(${item.animalInterno.nroArete})` : ''}`.trim() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.codigoPajuela || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.tipoOrigen === 'SEMEN' ? (item.stockPajuelas ?? 0) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${item.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => abrirEditar(item)} className="text-yellow-600 hover:text-yellow-800 text-xs font-medium">Editar</button>
                      <button onClick={() => toggleActivo(item)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        {item.activo ? 'Inactivar' : 'Activar'}
                      </button>
                      <button onClick={() => setShowConfirm(item.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Eliminar</button>
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
                {editando ? 'Editar Reproductor' : 'Nuevo Reproductor'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* A. Datos básicos */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">A. Datos básicos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código <span className="text-red-500">*</span></label>
                      <input
                        name="codigo"
                        value={form.codigo}
                        onChange={handleChange}
                        disabled={!!editando}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 ${editando ? 'bg-gray-100' : ''} ${formErrors.codigo ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Ej: REPRO-001"
                      />
                      {formErrors.codigo && <p className="text-red-500 text-xs mt-1">{formErrors.codigo}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input name="nombre" value={form.nombre} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Ej: Toro Campeón" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Raza</label>
                      <select name="razaId" value={form.razaId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="">Seleccionar raza</option>
                        {razas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de origen <span className="text-red-500">*</span></label>
                      <select name="tipoOrigen" value={form.tipoOrigen} onChange={handleChange} className={`w-full px-3 py-2 border rounded-md ${formErrors.tipoOrigen ? 'border-red-500' : 'border-gray-300'}`}>
                        {TIPO_ORIGEN_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      {formErrors.tipoOrigen && <p className="text-red-500 text-xs mt-1">{formErrors.tipoOrigen}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de reproductor</label>
                      <select name="tipoReproductor" value={form.tipoReproductor} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        {form.tipoOrigen === 'SEMEN'
                          ? TIPO_REPRODUCTOR_OPCIONES.filter(o => o.value !== 'TORO').map(o => <option key={o.value} value={o.value}>{o.label}</option>)
                          : <option value="TORO">Toro</option>
                        }
                      </select>
                    </div>
                    {editando && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select name="activo" value={form.activo} onChange={(e) => setForm(prev => ({ ...prev, activo: e.target.value === 'true' }))} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* B. Toro interno — solo si tipo origen = INTERNO */}
                {form.tipoOrigen === 'INTERNO' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">B. Animal interno</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                      <p className="text-sm text-blue-700">Para toros propios de la finca. Opcionalmente vincula un animal del módulo Animales para sincronizar datos.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID Animal interno (opcional)</label>
                      <input
                        name="animalInternoId"
                        value={form.animalInternoId}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="ID del animal en el módulo Animales"
                      />
                      <p className="text-xs text-gray-500 mt-1">Ingresa el ID del toro registrado en el módulo Animales</p>
                    </div>
                  </div>
                )}

                {/* C. Semen / Pajuela — solo si tipo origen = SEMEN */}
                {form.tipoOrigen === 'SEMEN' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">C. Semen / Pajuela</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código de pajuela <span className="text-red-500">*</span></label>
                        <input
                          name="codigoPajuela"
                          value={form.codigoPajuela}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md ${formErrors.codigoPajuela ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Ej: AX-12345"
                        />
                        {formErrors.codigoPajuela && <p className="text-red-500 text-xs mt-1">{formErrors.codigoPajuela}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
                        <input name="laboratorio" value={form.laboratorio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Ej: ABS Global" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock de pajuelas</label>
                        <input
                          type="number"
                          name="stockPajuelas"
                          value={form.stockPajuelas}
                          onChange={handleChange}
                          min={0}
                          className={`w-full px-3 py-2 border rounded-md ${formErrors.stockPajuelas ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {formErrors.stockPajuelas && <p className="text-red-500 text-xs mt-1">{formErrors.stockPajuelas}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Costo por pajuela</label>
                        <input type="number" step="0.01" name="costoPajuela" value={form.costoPajuela} onChange={handleChange} min={0} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Laboratorio para EXTERNO */}
                {form.tipoOrigen === 'EXTERNO' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">B. Reproductor externo</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Propietario / Establecimiento</label>
                      <input name="laboratorio" value={form.laboratorio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Nombre del propietario o establecimiento" />
                    </div>
                  </div>
                )}

                {/* D. Datos genéticos */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">D. Datos genéticos (opcionales)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facilidad de parto (1-10)</label>
                      <input type="number" step="0.01" name="facilidadParto" value={form.facilidadParto} onChange={handleChange} min={1} max={10} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Ej: 8.5" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valor genético / DEP</label>
                      <input type="number" step="0.01" name="valorGenetico" value={form.valorGenetico} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Ej: 12.5" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                      <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                  </div>
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

      {/* Modal confirmar eliminar */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-2">¿Eliminar reproductor?</h3>
            <p className="text-gray-600 mb-1 text-sm">Si tiene eventos de reproducción asociados, no se podrá eliminar.</p>
            <p className="text-gray-500 mb-6 text-sm">Considera inactivarlo en su lugar.</p>
            <div className="flex gap-3">
              <button onClick={() => handleEliminar(showConfirm)} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700">Eliminar</button>
              <button onClick={() => setShowConfirm(null)} className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
