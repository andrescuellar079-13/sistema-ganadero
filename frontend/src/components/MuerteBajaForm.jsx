// frontend/src/components/MuerteBajaForm.jsx
import { useState, useEffect } from 'react'

const TIPOS_BAJA = [
  { value: 'MUERTE',    label: '💀 Muerte' },
  { value: 'ROBO',      label: '🚨 Robo' },
  { value: 'PERDIDA',   label: '🔍 Pérdida' },
  { value: 'DESCARTE',  label: '📋 Descarte' },
  { value: 'SACRIFICIO',label: '🔪 Sacrificio' },
  { value: 'OTRO',      label: '⚙️ Otro' },
]

const MOTIVOS_DESCARTE = [
  { value: 'EDAD_AVANZADA',           label: '👴 Edad avanzada' },
  { value: 'BAJA_PRODUCCION',         label: '📉 Baja producción' },
  { value: 'PROBLEMAS_REPRODUCTIVOS', label: '🔬 Problemas reproductivos' },
  { value: 'ENFERMEDAD_CRONICA',      label: '🏥 Enfermedad crónica' },
  { value: 'LESION_PERMANENTE',       label: '🦴 Lesión permanente' },
  { value: 'MAL_CARACTER',            label: '😠 Mal carácter' },
  { value: 'DECISION_ECONOMICA',      label: '💰 Decisión económica' },
  { value: 'OTRO',                    label: '⚙️ Otro' },
]

const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

export default function MuerteBajaForm({
  animales = [],
  onSubmit,
  onCancel,
  initialData = null,
  isEditing = false,
}) {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    animalId: '',
    tipo: '',
    motivoDescarte: '',
    fechaBaja: today,
    causa: '',
    pesoEstimadoKg: '',
    descripcion: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchAnimal, setSearchAnimal] = useState('')

  useEffect(() => {
    if (initialData) {
      setForm({
        animalId: initialData.animal?.id || '',
        tipo: initialData.tipo || '',
        motivoDescarte: initialData.motivoDescarte || '',
        fechaBaja: initialData.fechaBaja || today,
        causa: initialData.causa || '',
        pesoEstimadoKg: initialData.pesoEstimadoKg || '',
        descripcion: initialData.descripcion || '',
      })
    }
  }, [initialData])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    // Limpiar motivo descarte si cambia el tipo
    if (name === 'tipo' && value !== 'DESCARTE') {
      setForm(p => ({ ...p, tipo: value, motivoDescarte: '' }))
    }
  }

  const animalesFiltrados = animales.filter(a => {
    if (!searchAnimal) return true
    const t = searchAnimal.toLowerCase()
    return a.nroArete?.toLowerCase().includes(t) || a.nombre?.toLowerCase().includes(t)
  })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!isEditing && !form.animalId) return setError('Selecciona un animal')
    if (!form.tipo) return setError('Selecciona el tipo de baja')
    if (!form.fechaBaja) return setError('Ingresa la fecha')
    if (!form.causa) return setError('Ingresa la causa')
    if (form.tipo === 'DESCARTE' && !form.motivoDescarte) return setError('Selecciona el motivo de descarte')

    setLoading(true)
    try {
      await onSubmit({
        animalId: form.animalId,
        tipo: form.tipo,
        motivoDescarte: form.tipo === 'DESCARTE' ? form.motivoDescarte : null,
        fechaBaja: form.fechaBaja,
        causa: form.causa,
        pesoEstimadoKg: form.pesoEstimadoKg ? parseFloat(form.pesoEstimadoKg) : null,
        descripcion: form.descripcion || null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              {isEditing ? '✏️ Editar Baja' : '💀 Registrar Baja'}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
          </div>

          {error && (
            <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Animal — solo al crear */}
            {!isEditing ? (
              <div>
                <label className={labelCls}>Animal <span className="text-red-500">*</span></label>
                <input type="text" placeholder="🔍 Buscar por arete o nombre..."
                  value={searchAnimal} onChange={e => setSearchAnimal(e.target.value)}
                  className={`${inputCls} mb-2`} />
                <select name="animalId" value={form.animalId} onChange={handleChange}
                  className={inputCls} size={Math.min(animalesFiltrados.length + 1, 5)}>
                  <option value="">— Seleccionar animal —</option>
                  {animalesFiltrados.map(a => (
                    <option key={a.id} value={a.id}>
                      #{a.nroArete} — {a.nombre || 'Sin nombre'} {a.raza?.nombre ? `(${a.raza.nombre})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className={labelCls}>Animal</label>
                <div className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-600">
                  #{initialData?.animal?.nroArete} — {initialData?.animal?.nombre}
                </div>
              </div>
            )}

            {/* Tipo + Fecha */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tipo <span className="text-red-500">*</span></label>
                <select name="tipo" value={form.tipo} onChange={handleChange} className={inputCls}>
                  <option value="">— Seleccionar —</option>
                  {TIPOS_BAJA.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Fecha <span className="text-red-500">*</span></label>
                <input type="date" name="fechaBaja" value={form.fechaBaja}
                  onChange={handleChange} className={inputCls} />
              </div>
            </div>

            {/* Motivo descarte — solo si tipo=DESCARTE */}
            {form.tipo === 'DESCARTE' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className={labelCls}>
                  Motivo de Descarte <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {MOTIVOS_DESCARTE.map(m => (
                    <button key={m.value} type="button"
                      onClick={() => setForm(p => ({ ...p, motivoDescarte: m.value }))}
                      className={`p-2 rounded-lg border-2 text-xs font-medium text-left transition ${
                        form.motivoDescarte === m.value
                          ? 'border-amber-500 bg-amber-100 text-amber-800'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Causa */}
            <div>
              <label className={labelCls}>Causa <span className="text-red-500">*</span></label>
              <input type="text" name="causa" value={form.causa} onChange={handleChange}
                placeholder="Ej: Neumonía, Accidente, Edad avanzada..."
                className={inputCls} />
            </div>

            {/* Peso estimado */}
            <div>
              <label className={labelCls}>
                Peso Estimado (kg) <span className="text-gray-400 text-xs font-normal">opcional</span>
              </label>
              <input type="number" name="pesoEstimadoKg" value={form.pesoEstimadoKg}
                onChange={handleChange} placeholder="0.00" step="0.01" min="0"
                className={inputCls} />
            </div>

            {/* Descripción */}
            <div>
              <label className={labelCls}>
                Descripción <span className="text-gray-400 text-xs font-normal">opcional</span>
              </label>
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                rows={3} placeholder="Detalles adicionales..."
                className={`${inputCls} resize-none`} />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className={`flex-1 py-2.5 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition ${
                  isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                }`}>
                {loading ? 'Guardando...' : isEditing ? '💾 Guardar Cambios' : '✅ Registrar Baja'}
              </button>
              <button type="button" onClick={onCancel}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}