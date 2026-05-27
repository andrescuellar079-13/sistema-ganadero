import { useState } from 'react'

const TIPOS_BAJA = [
  { value: 'MUERTE',   label: '💀 Muerte' },
  { value: 'ROBO',     label: '🚨 Robo' },
  { value: 'PERDIDA',  label: '🔍 Pérdida' },
  { value: 'DESCARTE', label: '📋 Descarte' },
  { value: 'OTRO',     label: '❓ Otro' },
]

export default function MuerteBajaForm({ animales, onSubmit, onCancel, initialData = null, isEditing = false }) {
  const [form, setForm] = useState({
    animalId:       initialData?.animal?.id      || '',
    fechaBaja:      initialData?.fechaBaja       || new Date().toISOString().split('T')[0],
    tipo:           initialData?.tipo            || '',
    causa:          initialData?.causa           || '',
    descripcion:    initialData?.descripcion     || '',
    pesoEstimadoKg: initialData?.pesoEstimadoKg || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.tipo || !form.causa) {
      setError('Tipo y causa son obligatorios.')
      return
    }
    if (!isEditing && !form.animalId) {
      setError('Seleccioná un animal.')
      return
    }
    setLoading(true)
    await onSubmit({
      animalId:       form.animalId       || undefined,
      fechaBaja:      form.fechaBaja,
      tipo:           form.tipo,
      causa:          form.causa,
      descripcion:    form.descripcion    || null,
      pesoEstimadoKg: form.pesoEstimadoKg || null,
    })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? '✏️ Editar Baja' : '💀 Registrar Baja'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 px-4 py-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Al CREAR — select de animales activos */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Animal <span className="text-red-500">*</span>
              </label>
              <select
                name="animalId"
                value={form.animalId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="">Seleccionar animal...</option>
                {animales.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.nroArete} — {a.nombre} ({a.raza?.nombre})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Al EDITAR — animal fijo como texto, no se puede cambiar */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Animal
              </label>
              <div className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-600">
                #{initialData?.animal?.nroArete} — {initialData?.animal?.nombre}
              </div>
            </div>
          )}

          {/* Tipo y Fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="">Seleccionar...</option>
                {TIPOS_BAJA.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fechaBaja"
                value={form.fechaBaja}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
          </div>

          {/* Causa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Causa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="causa"
              value={form.causa}
              onChange={handleChange}
              placeholder="Ej: Neumonía, Accidente, Robo nocturno..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Peso estimado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso Estimado (Kg)
              <span className="text-gray-400 text-xs ml-1">opcional</span>
            </label>
            <input
              type="number"
              name="pesoEstimadoKg"
              value={form.pesoEstimadoKg}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
              <span className="text-gray-400 text-xs ml-1">opcional</span>
            </label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={3}
              placeholder="Detalles adicionales..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-md text-sm font-medium disabled:opacity-50 transition ${
                isEditing
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading
                ? 'Guardando...'
                : isEditing ? 'Guardar Cambios' : 'Registrar Baja'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}