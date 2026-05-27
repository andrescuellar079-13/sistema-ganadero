import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { GET_ANIMAL_DETALLE, GET_ANIMALES_MACHOS, GET_ANIMALES_HEMBRAS } from '../graphql/animales'

const FIELD = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white'
const LABEL = 'block text-xs font-medium text-gray-600 mb-1'
const SECTION_TITLE = 'text-xs font-semibold text-green-700 uppercase tracking-wider mb-2'

function Seccion({ titulo, children }) {
  return (
    <div className="mb-4">
      <p className={SECTION_TITLE}>{titulo}</p>
      <hr className="border-gray-200 mb-3" />
      {children}
    </div>
  )
}

const ESTADO_CHOICES = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'VENDIDO', label: 'Vendido' },
  { value: 'MUERTO', label: 'Muerto' },
  { value: 'DESCARTE', label: 'Descarte' },
  { value: 'BAJA', label: 'Baja' },
]

const EMPTY_FORM = {
  nroArete: '',
  nombre: '',
  sexo: 'MACHO',
  razaId: '',
  categoriaId: '',
  estado: 'ACTIVO',
  peso: '',
  pesoNacimiento: '',
  tipoProduccion: 'DOBLE_PROPOSITO',
  origen: 'NACIDO_FINCA',
  fechaNacimiento: '',
  fechaIngreso: '',
  edadIngresoMeses: '',
  padreId: '',
  madreId: '',
  observaciones: '',
}

export default function AnimalForm({ animal, razas, categorias, fincaId, onSubmit, onCancel }) {
  const animalId = animal?.id || null

  // Cargar detalle completo al editar (incluye padre, madre, origen, etc.)
  const { data: detalleData, loading: loadingDetalle } = useQuery(GET_ANIMAL_DETALLE, {
    variables: { id: animalId },
    skip: !animalId,
    fetchPolicy: 'network-only',
  })

  // Selectores de padre (machos) y madre (hembras), excluyendo el animal actual
  const { data: machosData } = useQuery(GET_ANIMALES_MACHOS, {
    variables: { fincaId: String(fincaId || 1), excluirId: animalId || undefined },
    skip: !fincaId,
  })
  const { data: hembrasData } = useQuery(GET_ANIMALES_HEMBRAS, {
    variables: { fincaId: String(fincaId || 1), excluirId: animalId || undefined },
    skip: !fincaId,
  })

  const animalesMachos = machosData?.animalesMachosParaPadre || []
  const animalesHembras = hembrasData?.animalesHembrasParaMadre || []

  const [formData, setFormData] = useState(EMPTY_FORM)

  // Poblar formulario cuando se carga el detalle (modo edición)
  useEffect(() => {
    const a = detalleData?.animalDetalle
    if (!a) return
    setFormData({
      nroArete: a.nroArete || '',
      nombre: a.nombre || '',
      sexo: a.sexo || 'MACHO',
      razaId: a.raza?.id || '',
      categoriaId: a.categoria?.id || '',
      estado: a.estado || 'ACTIVO',
      peso: a.peso ?? '',
      pesoNacimiento: a.pesoNacimiento ?? '',
      tipoProduccion: a.tipoProduccion || 'DOBLE_PROPOSITO',
      origen: a.origen || 'NACIDO_FINCA',
      fechaNacimiento: a.fechaNacimiento || '',
      fechaIngreso: a.fechaIngreso || '',
      edadIngresoMeses: a.edadIngresoMeses || '',
      padreId: a.padre?.id || '',
      madreId: a.madre?.id || '',
      observaciones: a.observaciones || '',
    })
  }, [detalleData])

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const submitData = {
      fincaId: fincaId || 1,
      nroArete: formData.nroArete,
      nombre: formData.nombre || null,
      sexo: formData.sexo,
      razaId: formData.razaId || null,
      categoriaId: formData.categoriaId || null,
      estado: formData.estado,
      fechaNacimiento: formData.fechaNacimiento || null,
      fechaIngreso: formData.fechaIngreso || null,
      edadIngresoMeses: formData.edadIngresoMeses !== '' ? parseInt(formData.edadIngresoMeses) : null,
      peso: formData.peso !== '' ? parseFloat(formData.peso) : null,
      pesoNacimiento: formData.pesoNacimiento !== '' ? parseFloat(formData.pesoNacimiento) : null,
      tipoProduccion: formData.tipoProduccion,
      origen: formData.origen,
      observaciones: formData.observaciones || null,
      padreId: formData.padreId || null,
      madreId: formData.madreId || null,
    }
    onSubmit(submitData)
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {animal ? 'Editar Animal' : 'Nuevo Animal'}
        </h2>

        {loadingDetalle ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-0">

            {/* ── SECCIÓN 1: Identificación ── */}
            <Seccion titulo="1. Identificación">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Arete *</label>
                  <input
                    type="text" name="nroArete" value={formData.nroArete}
                    onChange={handleChange} required className={FIELD}
                    placeholder="Ej: AR-001"
                    readOnly={!!animalId}
                    style={animalId ? { background: '#f9f9f9', color: '#555' } : {}}
                  />
                </div>
                <div>
                  <label className={LABEL}>Nombre</label>
                  <input
                    type="text" name="nombre" value={formData.nombre}
                    onChange={handleChange} className={FIELD}
                    placeholder="Ej: Torito"
                  />
                </div>
                <div>
                  <label className={LABEL}>Sexo *</label>
                  <select name="sexo" value={formData.sexo} onChange={handleChange} className={FIELD}>
                    <option value="MACHO">Macho</option>
                    <option value="HEMBRA">Hembra</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Estado</label>
                  <select name="estado" value={formData.estado} onChange={handleChange} className={FIELD}>
                    {ESTADO_CHOICES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Raza</label>
                  <select name="razaId" value={formData.razaId} onChange={handleChange} className={FIELD}>
                    <option value="">Seleccionar...</option>
                    {razas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Categoría</label>
                  <select name="categoriaId" value={formData.categoriaId} onChange={handleChange} className={FIELD}>
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
            </Seccion>

            {/* ── SECCIÓN 2: Datos productivos ── */}
            <Seccion titulo="2. Datos productivos">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Peso actual (kg)</label>
                  <input
                    type="number" step="0.01" min="0" name="peso"
                    value={formData.peso} onChange={handleChange} className={FIELD}
                    placeholder="Ej: 350.5"
                  />
                </div>
                <div>
                  <label className={LABEL}>Peso al nacimiento (kg)</label>
                  <input
                    type="number" step="0.01" min="0" name="pesoNacimiento"
                    value={formData.pesoNacimiento} onChange={handleChange} className={FIELD}
                    placeholder="Ej: 32.0"
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL}>Tipo de producción</label>
                  <select name="tipoProduccion" value={formData.tipoProduccion} onChange={handleChange} className={FIELD}>
                    <option value="CARNE">Carne</option>
                    <option value="LECHE">Leche</option>
                    <option value="DOBLE_PROPOSITO">Doble propósito</option>
                  </select>
                </div>
              </div>
            </Seccion>

            {/* ── SECCIÓN 3: Origen ── */}
            <Seccion titulo="3. Origen del animal">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Origen</label>
                  <select name="origen" value={formData.origen} onChange={handleChange} className={FIELD}>
                    <option value="NACIDO_FINCA">Nacido en finca</option>
                    <option value="COMPRADO">Comprado</option>
                    <option value="DONADO">Donado</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Fecha de nacimiento</label>
                  <input
                    type="date" name="fechaNacimiento"
                    value={formData.fechaNacimiento} onChange={handleChange} className={FIELD}
                  />
                </div>
                <div>
                  <label className={LABEL}>Fecha de ingreso</label>
                  <input
                    type="date" name="fechaIngreso"
                    value={formData.fechaIngreso} onChange={handleChange} className={FIELD}
                  />
                </div>
                <div>
                  <label className={LABEL}>Edad de ingreso (meses)</label>
                  <input
                    type="number" min="0" name="edadIngresoMeses"
                    value={formData.edadIngresoMeses} onChange={handleChange} className={FIELD}
                    placeholder="Ej: 6"
                  />
                </div>
              </div>
            </Seccion>

            {/* ── SECCIÓN 4: Genealogía ── */}
            <Seccion titulo="4. Genealogía / Herencia biológica">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Padre (macho)</label>
                  <select name="padreId" value={formData.padreId} onChange={handleChange} className={FIELD}>
                    <option value="">— No registrado —</option>
                    {animalesMachos.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.nroArete}{a.nombre ? ` · ${a.nombre}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Madre (hembra)</label>
                  <select name="madreId" value={formData.madreId} onChange={handleChange} className={FIELD}>
                    <option value="">— No registrada —</option>
                    {animalesHembras.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.nroArete}{a.nombre ? ` · ${a.nombre}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Opcional. Los selectores muestran solo animales de la misma finca con el sexo correcto.
              </p>
            </Seccion>

            {/* Observaciones */}
            <div className="mb-4">
              <label className={LABEL}>Observaciones</label>
              <textarea
                name="observaciones" value={formData.observaciones}
                onChange={handleChange} rows={2}
                className={`${FIELD} resize-y`}
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition font-medium text-sm"
              >
                {animal ? 'Actualizar' : 'Crear Animal'}
              </button>
              <button
                type="button" onClick={onCancel}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
