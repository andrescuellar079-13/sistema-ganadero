// frontend/src/components/VentaForm.jsx
import { useState, useMemo, useEffect } from 'react'

const MODALIDADES = [
  { value: 'POR_KILO',   label: '⚖️ Por Kilo' },
  { value: 'POR_CABEZA', label: '🐄 Por Cabeza' },
  { value: 'MIXTO',      label: '🔀 Mixto' },
]

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

export default function VentaForm({
  clientes,
  animales,
  corrales = [],
  onSubmit,
  onCancel,
  initialData = null,
  isEditing = false,
  onDelete = null,
}) {
  const today = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    clienteId: '',
    corralId: '',
    modalidadVenta: 'POR_KILO',
    fechaVenta: today,
    guiaSalida: '',
    observaciones: '',
  })

  const [detalles, setDetalles] = useState([])
  const [currentDetalle, setCurrentDetalle] = useState({
    animalId: '',
    modalidad: 'POR_KILO',
    pesoVentaKg: '',
    precioKg: '',
    costoEstimado: '',
  })

  const [editandoDetalle, setEditandoDetalle] = useState(null)
  const [searchCliente, setSearchCliente] = useState('')
  const [searchAnimal, setSearchAnimal] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showUtilidad, setShowUtilidad] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        clienteId: initialData.clienteId || '',
        corralId: initialData.corralId || '',
        modalidadVenta: initialData.modalidadVenta || 'POR_KILO',
        fechaVenta: initialData.fechaVenta || today,
        guiaSalida: initialData.guiaSalida || '',
        observaciones: initialData.observaciones || '',
      })
      setDetalles(initialData.detalles || [])
    }
  }, [initialData])

  useEffect(() => {
    if (formData.modalidadVenta !== 'MIXTO') {
      setCurrentDetalle(p => ({ ...p, modalidad: formData.modalidadVenta }))
    }
  }, [formData.modalidadVenta])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
    if (name === 'clienteId' && value) setSearchCliente('')
  }

  const handleDetalleChange = e => {
    setCurrentDetalle(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const calcSubtotal = (det) => {
    const mod = det.modalidad || formData.modalidadVenta
    if (mod === 'POR_KILO') {
      return parseFloat(det.pesoVentaKg || 0) * parseFloat(det.precioKg || 0)
    }
    return parseFloat(det.precioKg || 0)
  }

  const agregarDetalle = () => {
    const mod = currentDetalle.modalidad || formData.modalidadVenta
    const necesitaPeso = mod === 'POR_KILO'
    if (!currentDetalle.animalId || !currentDetalle.precioKg) return
    if (necesitaPeso && !currentDetalle.pesoVentaKg) return
    const animal = animales.find(a => a.id === currentDetalle.animalId)
    const subtotal = calcSubtotal(currentDetalle)
    setDetalles(p => [...p, {
      ...currentDetalle,
      nombreAnimal: `${animal?.nroArete}${animal?.nombre ? ' - ' + animal.nombre : ''}`,
      subtotal,
    }])
    setCurrentDetalle(p => ({
      animalId: '', pesoVentaKg: '', precioKg: '', costoEstimado: '',
      modalidad: formData.modalidadVenta !== 'MIXTO' ? formData.modalidadVenta : p.modalidad,
    }))
    setSearchAnimal('')
  }

  const actualizarDetalle = () => {
    if (editandoDetalle === null) return
    const animal = animales.find(a => a.id === currentDetalle.animalId)
    const subtotal = calcSubtotal(currentDetalle)
    const nuevos = [...detalles]
    nuevos[editandoDetalle] = {
      ...currentDetalle,
      nombreAnimal: `${animal?.nroArete}${animal?.nombre ? ' - ' + animal.nombre : ''}`,
      subtotal,
    }
    setDetalles(nuevos)
    setEditandoDetalle(null)
    setCurrentDetalle({ animalId: '', pesoVentaKg: '', precioKg: '', costoEstimado: '', modalidad: formData.modalidadVenta })
    setSearchAnimal('')
  }

  const editarDetalle = (idx) => {
    const d = detalles[idx]
    setEditandoDetalle(idx)
    setCurrentDetalle({
      animalId: d.animalId,
      modalidad: d.modalidad || formData.modalidadVenta,
      pesoVentaKg: d.pesoVentaKg,
      precioKg: d.precioKg,
      costoEstimado: d.costoEstimado || '',
    })
  }

  const eliminarDetalle = (idx) => {
    setDetalles(p => p.filter((_, i) => i !== idx))
    if (editandoDetalle === idx) {
      setEditandoDetalle(null)
      setCurrentDetalle({ animalId: '', pesoVentaKg: '', precioKg: '', costoEstimado: '', modalidad: formData.modalidadVenta })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData, detalles)
  }

  const clientesFiltrados = useMemo(() => {
    const term = searchCliente.toLowerCase()
    return (clientes || []).filter(c =>
      !term || c.nombre?.toLowerCase().includes(term) ||
      c.apellidos?.toLowerCase().includes(term) ||
      c.ci?.toLowerCase().includes(term) ||
      c.telefono?.toLowerCase().includes(term)
    )
  }, [clientes, searchCliente])

  const animalesFiltrados = useMemo(() => {
    const usados = new Set(detalles.map(d => d.animalId))
    const term = searchAnimal.toLowerCase()
    return (animales || []).filter(a =>
      !usados.has(a.id) && (!term || a.nroArete?.toLowerCase().includes(term) || a.nombre?.toLowerCase().includes(term))
    )
  }, [animales, searchAnimal, detalles])

  const total = detalles.reduce((s, d) => s + (d.subtotal || 0), 0)
  const costoTotal = detalles.reduce((s, d) => s + parseFloat(d.costoEstimado || 0), 0)
  const utilidadTotal = total - costoTotal
  const modalidadActual = currentDetalle.modalidad || formData.modalidadVenta
  const esPorKilo = modalidadActual === 'POR_KILO'
  const previewSubtotal = calcSubtotal(currentDetalle)

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditing ? '✏️ Editar Venta' : '🛒 Nueva Venta'}
              </h2>
              <div className="flex gap-2">
                {isEditing && onDelete && (
                  <button type="button" onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 text-sm font-medium">
                    🗑️ Eliminar
                  </button>
                )}
                <button type="button" onClick={onCancel}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold px-2">×</button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Cliente</label>
                  {!formData.clienteId && (
                    <input type="text" placeholder="🔍 Buscar cliente..."
                      value={searchCliente} onChange={e => setSearchCliente(e.target.value)}
                      className={`${inputCls} mb-2`} />
                  )}
                  <select name="clienteId" value={formData.clienteId} onChange={handleChange}
                    className={inputCls} size={Math.min(clientesFiltrados.length + 1, 5)}>
                    <option value="">— Seleccionar cliente —</option>
                    {clientesFiltrados.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellidos || ''} {c.ci ? `- ${c.ci}` : ''}
                      </option>
                    ))}
                  </select>
                  {formData.clienteId && (
                    <button type="button" onClick={() => { setFormData(p => ({ ...p, clienteId: '' })); setSearchCliente('') }}
                      className="text-xs text-red-500 mt-1 hover:text-red-700">✕ Cambiar cliente</button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Fecha de Venta *</label>
                    <input type="date" name="fechaVenta" value={formData.fechaVenta}
                      onChange={handleChange} required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Guía de Salida</label>
                    <input type="text" name="guiaSalida" value={formData.guiaSalida}
                      onChange={handleChange} placeholder="Nro. guía..." className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Modalidad de Venta</label>
                  <div className="flex gap-2">
                    {MODALIDADES.map(m => (
                      <button key={m.value} type="button"
                        onClick={() => setFormData(p => ({ ...p, modalidadVenta: m.value }))}
                        className={`flex-1 py-2 px-2 rounded-lg border-2 text-xs font-semibold transition ${
                          formData.modalidadVenta === m.value
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Corral de Venta (opcional)</label>
                  <select name="corralId" value={formData.corralId} onChange={handleChange} className={inputCls}>
                    <option value="">— Sin corral —</option>
                    {(corrales || []).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.totalAnimales} animales)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Observaciones</label>
                <textarea name="observaciones" value={formData.observaciones} onChange={handleChange}
                  rows={2} className={inputCls} placeholder="Observaciones..." />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  {editandoDetalle !== null ? '✏️ Editar Animal' : '➕ Agregar Animal'}
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <input type="text" placeholder="🔍 Buscar por arete o nombre..."
                    value={searchAnimal} onChange={e => setSearchAnimal(e.target.value)}
                    className={`${inputCls} mb-3`} />
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={labelCls}>Animal *</label>
                      <select name="animalId" value={currentDetalle.animalId}
                        onChange={handleDetalleChange} className={inputCls}>
                        <option value="">— Seleccionar —</option>
                        {animalesFiltrados.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.nroArete}{a.nombre ? ` - ${a.nombre}` : ''} ({parseFloat(a.peso || 0).toFixed(0)} kg)
                          </option>
                        ))}
                      </select>
                    </div>
                    {formData.modalidadVenta === 'MIXTO' && (
                      <div>
                        <label className={labelCls}>Modalidad de este animal</label>
                        <select name="modalidad" value={currentDetalle.modalidad}
                          onChange={handleDetalleChange} className={inputCls}>
                          <option value="POR_KILO">⚖️ Por Kilo</option>
                          <option value="POR_CABEZA">🐄 Por Cabeza</option>
                        </select>
                      </div>
                    )}
                    {esPorKilo && (
                      <div>
                        <label className={labelCls}>Peso Venta (kg) *</label>
                        <input type="number" step="0.01" min="0" name="pesoVentaKg"
                          value={currentDetalle.pesoVentaKg} onChange={handleDetalleChange}
                          className={inputCls} placeholder="kg" />
                      </div>
                    )}
                    <div>
                      <label className={labelCls}>
                        {esPorKilo ? 'Precio por kg (Bs.) *' : 'Precio por cabeza (Bs.) *'}
                      </label>
                      <input type="number" step="0.01" min="0" name="precioKg"
                        value={currentDetalle.precioKg} onChange={handleDetalleChange}
                        className={inputCls} placeholder="Bs." />
                    </div>
                    <div>
                      <label className={labelCls}>Costo adquisición (Bs.) <span className="text-gray-400 font-normal text-xs">para utilidad</span></label>
                      <input type="number" step="0.01" min="0" name="costoEstimado"
                        value={currentDetalle.costoEstimado} onChange={handleDetalleChange}
                        className={inputCls} placeholder="Bs. 0" />
                    </div>
                  </div>

                  {currentDetalle.precioKg && (esPorKilo ? currentDetalle.pesoVentaKg : true) && (
                    <div className="text-right text-sm mb-3 bg-white rounded-lg p-2 border">
                      <span className="text-gray-500">Subtotal: </span>
                      <span className="font-bold text-green-600">Bs. {previewSubtotal.toLocaleString('es', { minimumFractionDigits: 2 })}</span>
                      {currentDetalle.costoEstimado && (
                        <>
                          <span className="text-gray-300 mx-2">|</span>
                          <span className="text-gray-500">Utilidad: </span>
                          <span className={`font-bold ${previewSubtotal - parseFloat(currentDetalle.costoEstimado) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            Bs. {(previewSubtotal - parseFloat(currentDetalle.costoEstimado)).toLocaleString('es', { minimumFractionDigits: 2 })}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {editandoDetalle !== null ? (
                      <>
                        <button type="button" onClick={actualizarDetalle}
                          className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 font-medium text-sm">
                          💾 Actualizar Animal
                        </button>
                        <button type="button" onClick={() => {
                          setEditandoDetalle(null)
                          setCurrentDetalle({ animalId: '', pesoVentaKg: '', precioKg: '', costoEstimado: '', modalidad: formData.modalidadVenta })
                        }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={agregarDetalle}
                        disabled={!currentDetalle.animalId || !currentDetalle.precioKg || (esPorKilo && !currentDetalle.pesoVentaKg)}
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm">
                        + Agregar Animal
                      </button>
                    )}
                  </div>
                </div>

                {detalles.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-gray-700">📋 Animales ({detalles.length})</h4>
                      <button type="button" onClick={() => setShowUtilidad(!showUtilidad)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        {showUtilidad ? '🙈 Ocultar utilidad' : '📊 Ver utilidad'}
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {detalles.map((det, idx) => {
                        const utilidad = (det.subtotal || 0) - parseFloat(det.costoEstimado || 0)
                        return (
                          <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border hover:shadow-sm">
                            <div className="flex-1">
                              <span className="font-medium text-gray-800 text-sm">{det.nombreAnimal}</span>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {det.modalidad === 'POR_KILO'
                                  ? `${det.pesoVentaKg} kg × Bs. ${parseFloat(det.precioKg).toLocaleString()}/kg`
                                  : `Bs. ${parseFloat(det.precioKg).toLocaleString()} por cabeza`}
                                <span className="ml-1 px-1 py-0.5 rounded bg-gray-100 text-gray-400">
                                  {det.modalidad === 'POR_KILO' ? '⚖️' : '🐄'}
                                </span>
                              </div>
                              {showUtilidad && det.costoEstimado && (
                                <div className="text-xs mt-1">
                                  <span className="text-gray-400">Costo: Bs. {parseFloat(det.costoEstimado).toLocaleString()} | </span>
                                  <span className={utilidad >= 0 ? 'text-blue-600 font-medium' : 'text-red-600 font-medium'}>
                                    Utilidad: Bs. {utilidad.toLocaleString('es', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <span className="font-bold text-green-600 text-sm">Bs. {(det.subtotal || 0).toLocaleString('es', { minimumFractionDigits: 2 })}</span>
                              <button type="button" onClick={() => editarDetalle(idx)} className="text-blue-500 hover:text-blue-700">✏️</button>
                              <button type="button" onClick={() => eliminarDetalle(idx)} className="text-red-500 hover:text-red-700">🗑️</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total venta:</span>
                        <span className="font-bold text-green-600">Bs. {total.toLocaleString('es', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {costoTotal > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Costo total:</span>
                            <span className="text-gray-700">Bs. {costoTotal.toLocaleString('es', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold">
                            <span>Utilidad estimada:</span>
                            <span className={utilidadTotal >= 0 ? 'text-blue-600' : 'text-red-600'}>
                              Bs. {utilidadTotal.toLocaleString('es', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="submit"
                  disabled={!formData.clienteId || detalles.length === 0}
                  className="flex-1 py-3 rounded-lg font-bold text-sm disabled:bg-gray-300 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700">
                  {isEditing ? '💾 Actualizar Venta' : '✅ Registrar Venta'}
                  {detalles.length > 0 && ` (${detalles.length} animales — Bs. ${total.toLocaleString('es', { minimumFractionDigits: 2 })})`}
                </button>
                <button type="button" onClick={onCancel}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="text-xl font-bold mb-2">¿Eliminar esta venta?</h3>
            <p className="text-gray-500 text-sm mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => { onDelete?.(); setShowDeleteConfirm(false) }}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium">
                Sí, eliminar
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}