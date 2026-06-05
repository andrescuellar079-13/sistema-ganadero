// frontend/src/components/PartoForm.jsx
import { useState, useEffect } from 'react'
import { useAnimales } from '../hooks/useAnimales'
import { useCatalogos } from '../hooks/useCatalogos'
import { useReproduccion } from '../hooks/useReproduccion'

const today = () => new Date().toISOString().split('T')[0]

const TIPO_PARTO_OPTIONS = [
  { value: 'NORMAL',    label: 'Normal' },
  { value: 'DISTOCICO', label: 'Distócico (con asistencia)' },
  { value: 'MULTIPLE',  label: 'Múltiple' },
  { value: 'ABORTO',    label: 'Aborto' },
]

const EMPTY_CRIA = () => ({
  nroArete: '',
  nombre: '',
  sexo: 'HEMBRA',
  razaId: '',
  categoriaId: '',
  pesoNacimiento: '',
  color: '',
  observaciones: '',
})

// ---------------------------------------------------------------------------
// Componente de datos de una cría
// ---------------------------------------------------------------------------
const CriaPanel = ({ index, data, onChange, razas, categorias }) => {
  const set = (field) => (e) => onChange(index, { ...data, [field]: e.target.value })

  return (
    <div className="border border-green-200 bg-green-50 p-4 rounded-lg space-y-3">
      <h3 className="text-sm font-bold text-green-800">Cría #{index + 1}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">Arete *</label>
          <input
            required
            type="text"
            value={data.nroArete}
            onChange={set('nroArete')}
            placeholder="Ej: 001-2024"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Nombre</label>
          <input
            type="text"
            value={data.nombre}
            onChange={set('nombre')}
            placeholder="Opcional"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Sexo *</label>
          <select
            required
            value={data.sexo}
            onChange={set('sexo')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
          >
            <option value="HEMBRA">Hembra</option>
            <option value="MACHO">Macho</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Peso nacimiento (kg)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={data.pesoNacimiento}
            onChange={set('pesoNacimiento')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Raza</label>
          <select
            value={data.razaId}
            onChange={set('razaId')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
          >
            <option value="">Sin raza</option>
            {razas.map(r => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Categoría</label>
          <select
            value={data.categoriaId}
            onChange={set('categoriaId')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
          >
            <option value="">Sin categoría</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Color</label>
          <input
            type="text"
            value={data.color}
            onChange={set('color')}
            placeholder="Ej: Negro, Pinto"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Observaciones</label>
          <input
            type="text"
            value={data.observaciones}
            onChange={set('observaciones')}
            placeholder="Ej: Débil, necesita atención"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Formulario principal
// ---------------------------------------------------------------------------
const PartoForm = ({ onSuccess }) => {
  const { animales } = useAnimales()
  const { razas, categoriasAnimales } = useCatalogos()
  const { inseminaciones, montasNaturales, registrarPartoConCrias } = useReproduccion()

  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(null) // { reproduccionId, crias[] }

  const [form, setForm] = useState({
    eventoTipo: '',        // 'IA' | 'MONTA' | ''
    inseminacionId: '',
    montaId: '',
    madreId: '',
    padreId: '',
    fechaPartoEsperado: '',
    fechaPartoReal: today(),
    tipoParto: 'NORMAL',
    numCrias: 1,
    observaciones: '',
    crearLactancia: false,
  })

  const [crias, setCrias] = useState([EMPTY_CRIA()])

  // Listas filtradas
  const hembras = (animales || []).filter(a => a.sexo === 'HEMBRA' && a.estado === 'ACTIVO')
  const machos  = (animales || []).filter(a => a.sexo === 'MACHO'  && a.estado === 'ACTIVO')

  // Cuando se elige tipo evento, limpiar selección previa
  const handleEventoTipo = (tipo) => {
    setForm(f => ({
      ...f,
      eventoTipo: tipo,
      inseminacionId: '',
      montaId: '',
      madreId: '',
      fechaPartoEsperado: '',
    }))
  }

  // Cuando se selecciona una inseminación, autocompletar madre y fecha esperada
  const handleInseminacionChange = (inseminacionId) => {
    const ia = inseminaciones.find(i => String(i.id) === String(inseminacionId))
    setForm(f => ({
      ...f,
      inseminacionId,
      madreId:            ia ? String(ia.hembra?.id || '') : f.madreId,
      fechaPartoEsperado: ia?.fechaProbableParto ? ia.fechaProbableParto : f.fechaPartoEsperado,
    }))
  }

  // Cuando se selecciona una monta, autocompletar madre y fecha esperada
  const handleMontaChange = (montaId) => {
    const monta = montasNaturales.find(m => String(m.id) === String(montaId))
    setForm(f => ({
      ...f,
      montaId,
      madreId:            monta ? String(monta.hembra?.id || '') : f.madreId,
      fechaPartoEsperado: monta?.fechaProbableParto ? monta.fechaProbableParto : f.fechaPartoEsperado,
    }))
  }

  // Ajustar número de crías en el array
  const handleNumCrias = (n) => {
    const num = Math.max(0, Math.min(6, parseInt(n) || 0))
    setCrias(prev => {
      if (num > prev.length) {
        return [...prev, ...Array(num - prev.length).fill(null).map(EMPTY_CRIA)]
      }
      return prev.slice(0, num)
    })
    setForm(f => ({ ...f, numCrias: num }))
  }

  // Cambio de tipo de parto — aborto fuerza 0 crías
  const handleTipoParto = (tipoParto) => {
    if (tipoParto === 'ABORTO') {
      setCrias([])
      setForm(f => ({ ...f, tipoParto, numCrias: 0, crearLactancia: false }))
    } else {
      if (crias.length === 0) {
        setCrias([EMPTY_CRIA()])
        setForm(f => ({ ...f, tipoParto, numCrias: 1 }))
      } else {
        setForm(f => ({ ...f, tipoParto }))
      }
    }
  }

  const handleCriaChange = (index, updated) => {
    setCrias(prev => prev.map((c, i) => i === index ? updated : c))
  }

  const resetForm = () => {
    setForm({
      eventoTipo: '', inseminacionId: '', montaId: '', madreId: '', padreId: '',
      fechaPartoEsperado: '', fechaPartoReal: today(),
      tipoParto: 'NORMAL', numCrias: 1, observaciones: '', crearLactancia: false,
    })
    setCrias([EMPTY_CRIA()])
    setExito(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar aretes únicos entre las crías
    if (form.tipoParto !== 'ABORTO' && crias.length > 0) {
      const aretes = crias.map(c => c.nroArete.trim()).filter(Boolean)
      const unique = new Set(aretes)
      if (unique.size !== aretes.length) {
        alert('❌ Hay aretes duplicados en las crías. Cada arete debe ser único.')
        return
      }
      for (const cria of crias) {
        if (!cria.nroArete.trim()) {
          alert('❌ El arete es obligatorio para cada cría.')
          return
        }
        if (!cria.sexo) {
          alert('❌ El sexo es obligatorio para cada cría.')
          return
        }
      }
    }

    setLoading(true)

    const criasPayload = form.tipoParto !== 'ABORTO'
      ? crias.map(c => ({
          nroArete:      c.nroArete.trim(),
          nombre:        c.nombre || null,
          sexo:          c.sexo,
          razaId:        c.razaId || null,
          categoriaId:   c.categoriaId || null,
          pesoNacimiento: c.pesoNacimiento ? parseFloat(c.pesoNacimiento) : null,
          color:         c.color || null,
          observaciones: c.observaciones || null,
        }))
      : []

    const result = await registrarPartoConCrias({
      madreId:            form.madreId,
      inseminacionId:     form.inseminacionId || null,
      montaId:            form.montaId || null,
      padreId:            form.padreId || null,
      fechaPartoEsperado: form.fechaPartoEsperado || null,
      fechaPartoReal:     form.fechaPartoReal,
      tipoParto:          form.tipoParto,
      numCrias:           form.numCrias,
      observaciones:      form.observaciones || null,
      crearLactancia:     form.crearLactancia,
      crias:              criasPayload,
    })

    setLoading(false)

    if (result.success) {
      const repro = result.data?.reproduccion
      setExito({ reproduccion: repro })
    } else {
      alert(`❌ Error: ${result.error || 'No se pudo registrar el parto'}`)
    }
  }

  // ---- Pantalla de éxito ----
  if (exito) {
    const { reproduccion } = exito
    return (
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div className="flex items-center gap-2 text-green-700">
          <span className="text-3xl">✅</span>
          <div>
            <h2 className="text-xl font-bold">Parto registrado exitosamente</h2>
            <p className="text-sm text-gray-600">
              Madre: {reproduccion?.madre?.nroArete} — Estado: {reproduccion?.estado}
            </p>
          </div>
        </div>

        {reproduccion?.crias?.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Crías creadas:</h3>
            <div className="grid gap-2">
              {reproduccion.crias.map(cria => (
                <div key={cria.id} className="flex items-center gap-3 p-2 bg-green-50 rounded border border-green-200">
                  <span className="text-lg">{cria.sexo === 'MACHO' ? '🐂' : '🐄'}</span>
                  <div>
                    <span className="font-mono font-bold text-sm">{cria.nroArete}</span>
                    {cria.nombre && <span className="text-sm text-gray-600 ml-2">— {cria.nombre}</span>}
                    <div className="text-xs text-gray-500">
                      {cria.sexo} · Origen: {cria.origen} · Nacido: {cria.fechaNacimiento}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {form.tipoParto === 'ABORTO' && (
          <p className="text-sm text-gray-500 italic">Aborto registrado. No se crearon crías.</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={resetForm}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            Registrar otro parto
          </button>
          <button
            onClick={() => { resetForm(); if (onSuccess) onSuccess() }}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Ir a Partos
          </button>
        </div>
      </div>
    )
  }

  const mostrarCrias = form.tipoParto !== 'ABORTO' && form.numCrias > 0

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-5">
      <div>
        <h2 className="text-xl font-bold text-green-800">Registrar Parto</h2>
        <p className="text-sm text-gray-500">Complete los datos del parto y las crías nacidas.</p>
      </div>

      {/* ---- SECCIÓN 1: Evento relacionado ---- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Evento relacionado (opcional)</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de evento</label>
          <select
            value={form.eventoTipo}
            onChange={(e) => handleEventoTipo(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
          >
            <option value="">Sin evento relacionado</option>
            <option value="IA">Inseminación Artificial</option>
            <option value="MONTA">Monta Natural</option>
          </select>
        </div>

        {form.eventoTipo === 'IA' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Inseminación *</label>
            <select
              value={form.inseminacionId}
              onChange={(e) => handleInseminacionChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            >
              <option value="">Seleccionar inseminación</option>
              {inseminaciones.map(ia => (
                <option key={ia.id} value={ia.id}>
                  {new Date(ia.fecha).toLocaleDateString('es-PY')} — {ia.hembra?.nroArete}
                  {ia.reproductor ? ` (${ia.reproductor.codigo})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">La madre y fecha esperada se autocompletan al seleccionar.</p>
          </div>
        )}

        {form.eventoTipo === 'MONTA' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Monta Natural *</label>
            <select
              value={form.montaId}
              onChange={(e) => handleMontaChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            >
              <option value="">Seleccionar monta</option>
              {montasNaturales.map(m => (
                <option key={m.id} value={m.id}>
                  {new Date(m.fecha).toLocaleDateString('es-PY')} — {m.hembra?.nroArete}
                  {m.reproductor ? ` (${m.reproductor.codigo})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">La madre y fecha esperada se autocompletan al seleccionar.</p>
          </div>
        )}
      </section>

      {/* ---- SECCIÓN 2: Datos del parto ---- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Datos del parto</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Madre *</label>
            <select
              required
              value={form.madreId}
              onChange={(e) => setForm(f => ({ ...f, madreId: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Seleccionar hembra</option>
              {hembras.map(h => (
                <option key={h.id} value={h.id}>
                  {h.nroArete} — {h.nombre || 'Sin nombre'} {h.raza?.nombre ? `(${h.raza.nombre})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Padre (Animal interno, opcional)</label>
            <select
              value={form.padreId}
              onChange={(e) => setForm(f => ({ ...f, padreId: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            >
              <option value="">Sin padre registrado / externo</option>
              {machos.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nroArete} — {m.nombre || 'Sin nombre'} {m.raza?.nombre ? `(${m.raza.nombre})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Solo si el padre es un Animal interno de la finca.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha parto esperado</label>
            <input
              type="date"
              value={form.fechaPartoEsperado}
              onChange={(e) => setForm(f => ({ ...f, fechaPartoEsperado: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha parto real *</label>
            <input
              type="date"
              required
              value={form.fechaPartoReal}
              onChange={(e) => setForm(f => ({ ...f, fechaPartoReal: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de parto</label>
            <select
              value={form.tipoParto}
              onChange={(e) => handleTipoParto(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            >
              {TIPO_PARTO_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de crías</label>
            <input
              type="number"
              min="0"
              max="6"
              disabled={form.tipoParto === 'ABORTO'}
              value={form.tipoParto === 'ABORTO' ? 0 : form.numCrias}
              onChange={(e) => handleNumCrias(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Observaciones</label>
          <textarea
            rows={2}
            value={form.observaciones}
            onChange={(e) => setForm(f => ({ ...f, observaciones: e.target.value }))}
            placeholder="Ej: Parto gemelar, necesitó asistencia, cría débil..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
          />
        </div>

        {form.tipoParto !== 'ABORTO' && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.crearLactancia}
              onChange={(e) => setForm(f => ({ ...f, crearLactancia: e.target.checked }))}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">
              Crear lactancia activa para la madre (inicio automático desde fecha del parto)
            </span>
          </label>
        )}
      </section>

      {/* ---- SECCIÓN 3: Crías ---- */}
      {mostrarCrias && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">
            Datos de las crías ({crias.length})
          </h3>
          <p className="text-xs text-gray-500">
            Fecha de nacimiento, origen NACIDO_FINCA y madre se asignan automáticamente.
          </p>
          {crias.map((cria, idx) => (
            <CriaPanel
              key={idx}
              index={idx}
              data={cria}
              onChange={handleCriaChange}
              razas={razas || []}
              categorias={categoriasAnimales || []}
            />
          ))}
        </section>
      )}

      {form.tipoParto === 'ABORTO' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          Aborto seleccionado — no se crearán registros de crías.
        </div>
      )}

      {/* ---- BOTONES ---- */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !form.madreId || !form.fechaPartoReal}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
        >
          {loading ? 'Registrando...' : 'Registrar Parto'}
        </button>
        <button
          type="button"
          onClick={() => { if (onSuccess) onSuccess() }}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default PartoForm
