import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { CREATE_MEDICAMENTO, UPDATE_MEDICAMENTO, GET_TIPOS_MEDICAMENTO } from '../../graphql/catalogos'

const VIA_OPCIONES = [
  { value: '', label: 'Seleccionar...' },
  { value: 'INTRAMUSCULAR', label: 'Intramuscular' },
  { value: 'SUBCUTANEA', label: 'Subcutánea' },
  { value: 'INTRADERMICA', label: 'Intradérmica' },
  { value: 'ORAL', label: 'Oral' },
  { value: 'TOPICA', label: 'Tópica' },
  { value: 'INTRAVENOSA', label: 'Intravenosa' },
]

const FORM_INICIAL = {
  nombre: '',
  tipoId: '',
  laboratorio: '',
  principioActivo: '',
  presentacion: '',
  unidadMedida: '',
  stockCantidad: '',
  stockMinimo: '',
  contenidoNeto: '',
  fechaVencimiento: '',
  precioCompra: '',
  dosisRecomendada: '',
  viaAplicacion: '',
  diasRetiroCarne: '',
  diasRetiroLeche: '',
  intervaloDias: '',
  activo: true,
  descripcion: '',
}

export default function MedicamentoForm({ medicamento, onSuccess, onCancel }) {
  const [createMedicamento] = useMutation(CREATE_MEDICAMENTO)
  const [updateMedicamento] = useMutation(UPDATE_MEDICAMENTO)
  const { data: tiposData } = useQuery(GET_TIPOS_MEDICAMENTO)
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [form, setForm] = useState(FORM_INICIAL)

  const tipos = tiposData?.tiposMedicamento || []

  useEffect(() => {
    if (medicamento) {
      setForm({
        nombre: medicamento.nombre || '',
        tipoId: medicamento.tipo?.id || '',
        laboratorio: medicamento.laboratorio || '',
        principioActivo: medicamento.principioActivo || '',
        presentacion: medicamento.presentacion || '',
        unidadMedida: medicamento.unidadMedida || '',
        stockCantidad: medicamento.stockCantidad ?? '',
        stockMinimo: medicamento.stockMinimo ?? '',
        contenidoNeto: medicamento.contenidoNeto ?? '',
        fechaVencimiento: medicamento.fechaVencimiento || '',
        precioCompra: medicamento.precioCompra ?? '',
        dosisRecomendada: medicamento.dosisRecomendada || '',
        viaAplicacion: medicamento.viaAplicacion || '',
        diasRetiroCarne: medicamento.diasRetiroCarne ?? '',
        diasRetiroLeche: medicamento.diasRetiroLeche ?? '',
        intervaloDias: medicamento.intervaloDias ?? '',
        activo: medicamento.activo ?? true,
        descripcion: medicamento.descripcion || '',
      })
    } else {
      setForm(FORM_INICIAL)
    }
  }, [medicamento])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }))
  }

  const validar = () => {
    const errors = {}
    if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio'
    if (form.stockCantidad !== '' && parseFloat(form.stockCantidad) < 0) errors.stockCantidad = 'No puede ser negativo'
    if (form.stockMinimo !== '' && parseFloat(form.stockMinimo) < 0) errors.stockMinimo = 'No puede ser negativo'
    if (form.precioCompra !== '' && parseFloat(form.precioCompra) < 0) errors.precioCompra = 'No puede ser negativo'
    if (form.diasRetiroCarne !== '' && parseInt(form.diasRetiroCarne) < 0) errors.diasRetiroCarne = 'No puede ser negativo'
    if (form.diasRetiroLeche !== '' && parseInt(form.diasRetiroLeche) < 0) errors.diasRetiroLeche = 'No puede ser negativo'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validar()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setLoading(true)

    const variables = {
      tipoId: form.tipoId || null,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion || null,
      laboratorio: form.laboratorio || null,
      principioActivo: form.principioActivo || null,
      presentacion: form.presentacion || null,
      unidadMedida: form.unidadMedida || null,
      stockCantidad: form.stockCantidad !== '' ? parseFloat(form.stockCantidad) : 0,
      stockMinimo: form.stockMinimo !== '' ? parseFloat(form.stockMinimo) : 0,
      contenidoNeto: form.contenidoNeto !== '' ? parseFloat(form.contenidoNeto) : 0,
      fechaVencimiento: form.fechaVencimiento || null,
      precioCompra: form.precioCompra !== '' ? parseFloat(form.precioCompra) : 0,
      dosisRecomendada: form.dosisRecomendada || null,
      viaAplicacion: form.viaAplicacion || null,
      diasRetiroCarne: form.diasRetiroCarne !== '' ? parseInt(form.diasRetiroCarne) : 0,
      diasRetiroLeche: form.diasRetiroLeche !== '' ? parseInt(form.diasRetiroLeche) : 0,
      intervaloDias: form.intervaloDias !== '' ? parseInt(form.intervaloDias) : 0,
      activo: form.activo,
    }

    try {
      let result
      if (medicamento) {
        result = await updateMedicamento({ variables: { id: medicamento.id, ...variables } })
        if (result.data?.actualizarMedicamento?.success) {
          onSuccess(result.data.actualizarMedicamento.message || 'Medicamento actualizado correctamente')
        } else {
          setFormErrors({ _global: result.data?.actualizarMedicamento?.message || 'Error al actualizar' })
        }
      } else {
        const fincaId = localStorage.getItem('fincaId') || '1'
        result = await createMedicamento({ variables: { fincaId, ...variables } })
        if (result.data?.crearMedicamento?.success) {
          onSuccess(result.data.crearMedicamento.message || 'Medicamento creado correctamente')
        } else {
          setFormErrors({ _global: result.data?.crearMedicamento?.message || 'Error al crear' })
        }
      }
    } catch (error) {
      setFormErrors({ _global: 'Error al guardar el medicamento: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ label, name, type = 'text', required = false, min, step, placeholder, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children || (
        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          min={min}
          step={step}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${formErrors[name] ? 'border-red-500' : 'border-gray-300'}`}
        />
      )}
      {formErrors[name] && <p className="text-red-500 text-xs mt-1">{formErrors[name]}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-5">
            {medicamento ? 'Editar Medicamento' : 'Nuevo Medicamento'}
          </h2>

          {formErrors._global && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">{formErrors._global}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* A. Identificación */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">
                A. Identificación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Field label="Nombre" name="nombre" required placeholder="Ej: Ivermectina 3.15%" />
                </div>
                <Field label="Tipo">
                  <select name="tipoId" value={form.tipoId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500">
                    <option value="">Sin tipo</option>
                    {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </Field>
                <Field label="Laboratorio" name="laboratorio" placeholder="Ej: MSD Animal Health" />
                <Field label="Principio activo" name="principioActivo" placeholder="Ej: Ivermectina" />
                <Field label="Presentación" name="presentacion" placeholder="Ej: Solución inyectable 500ml" />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} placeholder="Descripción o notas del medicamento" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            </div>

            {/* B. Inventario */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">
                B. Inventario
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Unidad de medida" name="unidadMedida" placeholder="Ej: ml, dosis, tableta" />
                <Field label="Contenido neto" name="contenidoNeto" type="number" step="0.01" min="0" />
                <Field label="Stock actual" name="stockCantidad" type="number" step="0.01" min="0" />
                <Field label="Stock mínimo" name="stockMinimo" type="number" step="0.01" min="0" />
                <Field label="Precio compra" name="precioCompra" type="number" step="0.01" min="0" />
                <Field label="Fecha vencimiento" name="fechaVencimiento" type="date" />
              </div>
            </div>

            {/* C. Uso sanitario */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">
                C. Uso sanitario
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Dosis recomendada" name="dosisRecomendada" placeholder="Ej: 1 ml por 50 kg" />
                <Field label="Vía de aplicación">
                  <select name="viaAplicacion" value={form.viaAplicacion} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500">
                    {VIA_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Días retiro carne" name="diasRetiroCarne" type="number" min="0" placeholder="0" />
                <Field label="Días retiro leche" name="diasRetiroLeche" type="number" min="0" placeholder="0" />
                <Field label="Intervalo entre dosis (días)" name="intervaloDias" type="number" min="0" placeholder="0" />
              </div>
            </div>

            {/* D. Estado */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">
                D. Estado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select name="activo" value={form.activo} onChange={(e) => setForm(prev => ({ ...prev, activo: e.target.value === 'true' }))} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-green-300"
              >
                {loading ? 'Guardando...' : (medicamento ? 'Actualizar' : 'Crear')}
              </button>
              <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-md hover:bg-gray-400">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
