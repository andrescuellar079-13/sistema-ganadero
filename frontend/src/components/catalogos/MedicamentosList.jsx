import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_MEDICAMENTOS, DELETE_MEDICAMENTO, UPDATE_MEDICAMENTO } from '../../graphql/catalogos'
import LoadingSpinner from '../LoadingSpinner'
import ErrorMessage from '../ErrorMessage'
import MedicamentoForm from './MedicamentoForm'

const getVencimientoStatus = (fechaVencimiento) => {
  if (!fechaVencimiento) return 'sin_fecha'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vencimiento = new Date(fechaVencimiento + 'T00:00:00')
  const diffDias = (vencimiento - hoy) / (1000 * 60 * 60 * 24)
  if (diffDias < 0) return 'vencido'
  if (diffDias <= 30) return 'por_vencer'
  return 'vigente'
}

export default function MedicamentosList() {
  const { data, loading, error, refetch } = useQuery(GET_MEDICAMENTOS)
  const [deleteMedicamento] = useMutation(DELETE_MEDICAMENTO)
  const [updateMedicamento] = useMutation(UPDATE_MEDICAMENTO)

  const [showForm, setShowForm] = useState(false)
  const [editingMedicamento, setEditingMedicamento] = useState(null)
  const [message, setMessage] = useState(null)
  const [showConfirm, setShowConfirm] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [stockFilter, setStockFilter] = useState('todos')
  const [vencimientoFilter, setVencimientoFilter] = useState('todos')

  const medicamentos = data?.medicamentos || []

  const tiposUnicos = useMemo(() => {
    const tipos = medicamentos.map(m => m.tipo?.nombre).filter(Boolean)
    return [...new Set(tipos)]
  }, [medicamentos])

  const medicamentosFiltrados = useMemo(() => {
    let filtered = [...medicamentos]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(m =>
        m.nombre?.toLowerCase().includes(term) ||
        m.laboratorio?.toLowerCase().includes(term) ||
        m.principioActivo?.toLowerCase().includes(term) ||
        m.descripcion?.toLowerCase().includes(term)
      )
    }
    if (tipoFilter !== 'todos') {
      filtered = filtered.filter(m => m.tipo?.nombre === tipoFilter)
    }
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter(m => estadoFilter === 'activo' ? m.activo : !m.activo)
    }
    if (stockFilter !== 'todos') {
      filtered = filtered.filter(m => {
        const bajo = parseFloat(m.stockMinimo || 0) > 0 && parseFloat(m.stockCantidad || 0) <= parseFloat(m.stockMinimo || 0)
        return stockFilter === 'bajo' ? bajo : !bajo
      })
    }
    if (vencimientoFilter !== 'todos') {
      filtered = filtered.filter(m => getVencimientoStatus(m.fechaVencimiento) === vencimientoFilter)
    }
    return filtered
  }, [medicamentos, searchTerm, tipoFilter, estadoFilter, stockFilter, vencimientoFilter])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setTipoFilter('todos')
    setEstadoFilter('todos')
    setStockFilter('todos')
    setVencimientoFilter('todos')
  }

  const mostrarMensaje = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleDelete = async (id) => {
    try {
      const result = await deleteMedicamento({ variables: { id } })
      if (result.data?.eliminarMedicamento?.success) {
        mostrarMensaje('success', result.data.eliminarMedicamento.message)
        refetch()
      } else {
        mostrarMensaje('error', result.data?.eliminarMedicamento?.message || 'Error al eliminar')
      }
      setShowConfirm(null)
    } catch (error) {
      mostrarMensaje('error', error.message)
    }
  }

  const toggleActivo = async (med) => {
    try {
      const result = await updateMedicamento({ variables: { id: med.id, activo: !med.activo } })
      if (result.data?.actualizarMedicamento?.success) {
        mostrarMensaje('success', `Medicamento ${!med.activo ? 'activado' : 'inactivado'} correctamente`)
        refetch()
      } else {
        mostrarMensaje('error', result.data?.actualizarMedicamento?.message || 'Error al cambiar estado')
      }
    } catch (err) {
      mostrarMensaje('error', err.message)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const hayFiltrosActivos = searchTerm || tipoFilter !== 'todos' || estadoFilter !== 'todos' || stockFilter !== 'todos' || vencimientoFilter !== 'todos'

  return (
    <div>
      {/* Barra de búsqueda y filtros */}
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por nombre, laboratorio, principio activo..."
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
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${showFilters ? 'bg-green-50 border-green-400 text-green-700' : 'hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
            </button>
            {hayFiltrosActivos && (
              <button onClick={limpiarFiltros} className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-3">
            {tiposUnicos.length > 0 && (
              <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
                <option value="todos">Todos los tipos</option>
                {tiposUnicos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            )}
            <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="todos">Stock: todos</option>
              <option value="normal">Stock normal</option>
              <option value="bajo">Stock bajo</option>
            </select>
            <select value={vencimientoFilter} onChange={(e) => setVencimientoFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="todos">Vencimiento: todos</option>
              <option value="vigente">Vigente</option>
              <option value="por_vencer">Por vencer (30 días)</option>
              <option value="vencido">Vencido</option>
              <option value="sin_fecha">Sin fecha</option>
            </select>
          </div>
        )}

        {hayFiltrosActivos && (
          <div className="mt-3 text-sm text-gray-500">
            {medicamentosFiltrados.length} de {medicamentos.length} medicamentos encontrados
          </div>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setEditingMedicamento(null); setShowForm(true) }}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          + Nuevo Medicamento
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {medicamentosFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {hayFiltrosActivos ? 'No hay medicamentos que coincidan con la búsqueda' : 'No hay medicamentos registrados'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Laboratorio</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Principio activo</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stock actual</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stock mín.</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Precio</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Vencimiento</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {medicamentosFiltrados.map((med) => {
                const stockBajo = parseFloat(med.stockMinimo || 0) > 0 && parseFloat(med.stockCantidad || 0) <= parseFloat(med.stockMinimo || 0)
                const vencStatus = getVencimientoStatus(med.fechaVencimiento)
                return (
                  <tr key={med.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{med.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{med.tipo?.nombre || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{med.laboratorio || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{med.principioActivo || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className={stockBajo ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                          {med.stockCantidad} {med.unidadMedida || ''}
                        </span>
                        {stockBajo && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                            Stock bajo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{med.stockMinimo ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">₲ {parseFloat(med.precioCompra || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      {med.fechaVencimiento ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-600">{med.fechaVencimiento}</span>
                          {vencStatus === 'vencido' && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium w-fit">
                              Vencido
                            </span>
                          )}
                          {vencStatus === 'por_vencer' && (
                            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium w-fit">
                              Por vencer
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${med.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {med.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingMedicamento(med); setShowForm(true) }} className="text-yellow-600 hover:text-yellow-800 text-xs font-medium">Editar</button>
                        <button onClick={() => toggleActivo(med)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                          {med.activo ? 'Inactivar' : 'Activar'}
                        </button>
                        <button onClick={() => setShowConfirm(med.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <MedicamentoForm
          medicamento={editingMedicamento}
          onSuccess={(msg) => {
            setShowForm(false)
            setEditingMedicamento(null)
            refetch()
            if (msg) mostrarMensaje('success', msg)
          }}
          onCancel={() => { setShowForm(false); setEditingMedicamento(null) }}
        />
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-2">¿Eliminar medicamento?</h3>
            <p className="text-gray-600 mb-1 text-sm">Si tiene tratamientos o compras asociadas, no se podrá eliminar.</p>
            <p className="text-gray-500 mb-6 text-sm">Considera inactivarlo en su lugar.</p>
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
