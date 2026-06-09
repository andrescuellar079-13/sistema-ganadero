// frontend/src/components/EmpleadoForm.jsx
import React, { useState } from 'react'
import { useRrhh } from '../hooks/useRrhh'
import { TIPOS_EMPLEADO, ESTADOS_LABORALES } from '../constants/rrhh'

const Section = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1">
      {title}
    </h3>
    {children}
  </div>
)

const EmpleadoForm = ({ onSuccess, empleadoParaEditar, onCancel }) => {
  const { tipos, fincas, usuarios, crearEmpleado, actualizarEmpleado } = useRrhh()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fincaActual = localStorage.getItem('fincaId') || '1'

  const [formData, setFormData] = useState({
    // Datos personales
    nombre: empleadoParaEditar?.nombre || '',
    apellidos: empleadoParaEditar?.apellidos || '',
    ci: empleadoParaEditar?.ci || '',
    sexo: empleadoParaEditar?.sexo || 'MASCULINO',
    fechaNacimiento: empleadoParaEditar?.fechaNacimiento || '',
    telefono: empleadoParaEditar?.telefono || '',
    email: empleadoParaEditar?.email || '',
    direccion: empleadoParaEditar?.direccion || '',
    // Datos laborales
    fincaId: empleadoParaEditar?.finca?.id || fincaActual,
    tipoId: empleadoParaEditar?.tipo?.id || '',
    tipoEmpleado: empleadoParaEditar?.tipoEmpleado || 'OTRO',
    fechaIngreso: empleadoParaEditar?.fechaIngreso || new Date().toISOString().split('T')[0],
    salario: empleadoParaEditar?.salario ?? '',
    estadoLaboral: empleadoParaEditar?.estadoLaboral || 'ACTIVO',
    fechaSalida: empleadoParaEditar?.fechaSalida || '',
    motivoSalida: empleadoParaEditar?.motivoSalida || '',
    // Acceso al sistema
    usuarioId: empleadoParaEditar?.usuario?.id || '',
    // Documentos y observaciones
    observaciones: empleadoParaEditar?.observaciones || '',
  })

  const set = (campo, valor) => setFormData((prev) => ({ ...prev, [campo]: valor }))

  const validar = () => {
    if (!formData.nombre.trim()) return 'El nombre es obligatorio.'
    if (!formData.fincaId) return 'La finca es obligatoria.'
    if (!formData.tipoId) return 'El cargo es obligatorio.'
    if (!formData.fechaIngreso) return 'La fecha de ingreso es obligatoria.'
    if (formData.salario !== '' && parseFloat(formData.salario) < 0)
      return 'El salario no puede ser negativo.'
    if (formData.estadoLaboral === 'RETIRADO' && !formData.fechaSalida)
      return 'Si el estado es RETIRADO, debe indicar la fecha de salida.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const errMsg = validar()
    if (errMsg) {
      setError(errMsg)
      return
    }

    setLoading(true)

    const payload = {
      fincaId: formData.fincaId,
      tipoId: formData.tipoId,
      nombre: formData.nombre.trim(),
      apellidos: formData.apellidos,
      ci: formData.ci || null,
      sexo: formData.sexo,
      fechaNacimiento: formData.fechaNacimiento || null,
      telefono: formData.telefono,
      email: formData.email,
      direccion: formData.direccion,
      tipoEmpleado: formData.tipoEmpleado,
      fechaIngreso: formData.fechaIngreso,
      salario: parseFloat(formData.salario) || 0,
      estadoLaboral: formData.estadoLaboral,
      fechaSalida: formData.fechaSalida || null,
      motivoSalida: formData.motivoSalida || null,
      usuarioId: formData.usuarioId || null,
      observaciones: formData.observaciones,
    }

    const result = empleadoParaEditar
      ? await actualizarEmpleado(empleadoParaEditar.id, payload)
      : await crearEmpleado(payload)

    setLoading(false)

    // El hook ya desempaqueta el payload de la mutación en result.data
    // ({ empleado, success, message }) y captura errores de red en result.error.
    const mut = result.data
    if (result.success && (mut?.success ?? true)) {
      if (onSuccess) onSuccess()
    } else {
      setError(mut?.message || result.error || 'No se pudo guardar el empleado.')
    }
  }

  const esRetirado = formData.estadoLaboral === 'RETIRADO'

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-lg shadow max-h-[85vh] overflow-y-auto"
    >
      <h2 className="text-xl font-bold text-blue-800 sticky top-0 bg-white py-2 z-10">
        {empleadoParaEditar ? '✏️ Editar Empleado' : '+ Nuevo Empleado'}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* 1. Datos personales */}
      <Section title="1. Datos personales">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Apellidos</label>
            <input
              type="text"
              value={formData.apellidos}
              onChange={(e) => set('apellidos', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">CI</label>
            <input
              type="text"
              value={formData.ci}
              onChange={(e) => set('ci', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sexo</label>
            <select
              value={formData.sexo}
              onChange={(e) => set('sexo', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha Nacimiento</label>
            <input
              type="date"
              value={formData.fechaNacimiento}
              onChange={(e) => set('fechaNacimiento', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="text"
              value={formData.telefono}
              onChange={(e) => set('telefono', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => set('email', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dirección</label>
          <textarea
            value={formData.direccion}
            onChange={(e) => set('direccion', e.target.value)}
            rows="2"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </Section>

      {/* 2. Datos laborales */}
      <Section title="2. Datos laborales">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Finca *</label>
            <select
              required
              value={formData.fincaId}
              onChange={(e) => set('fincaId', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Seleccionar finca</option>
              {fincas.map((f) => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cargo *</label>
            <select
              required
              value={formData.tipoId}
              onChange={(e) => set('tipoId', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Seleccionar cargo</option>
              {tipos.filter((t) => t.activo).map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de empleado</label>
            <select
              value={formData.tipoEmpleado}
              onChange={(e) => set('tipoEmpleado', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {TIPOS_EMPLEADO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado laboral</label>
            <select
              value={formData.estadoLaboral}
              onChange={(e) => set('estadoLaboral', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {ESTADOS_LABORALES.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha Ingreso *</label>
            <input
              type="date"
              required
              value={formData.fechaIngreso}
              onChange={(e) => set('fechaIngreso', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Salario (Gs)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.salario}
              onChange={(e) => set('salario', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>

        {/* Salida (visible siempre; obligatoria si RETIRADO) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha salida {esRetirado && '*'}
            </label>
            <input
              type="date"
              value={formData.fechaSalida}
              onChange={(e) => set('fechaSalida', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Motivo salida</label>
            <input
              type="text"
              value={formData.motivoSalida}
              onChange={(e) => set('motivoSalida', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="Ej: renuncia, fin de contrato…"
            />
          </div>
        </div>
      </Section>

      {/* 3. Acceso al sistema */}
      <Section title="3. Acceso al sistema">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Usuario relacionado (opcional)
          </label>
          <select
            value={formData.usuarioId}
            onChange={(e) => set('usuarioId', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">Sin usuario (no inicia sesión)</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}{u.firstName ? ` — ${u.firstName} ${u.lastName || ''}` : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Vincular un usuario permite usar al empleado para permisos o auditoría. No todo
            empleado necesita iniciar sesión.
          </p>
        </div>
      </Section>

      {/* 4. Documentos y observaciones */}
      <Section title="4. Documentos y observaciones">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Documento CI</label>
            {empleadoParaEditar?.documentoCiUrl ? (
              <a
                href={empleadoParaEditar.documentoCiUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm text-blue-600 underline"
              >
                Ver documento
              </a>
            ) : (
              <p className="text-xs text-gray-400 mt-2">
                Subir desde el panel de administración.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contrato</label>
            {empleadoParaEditar?.contratoUrl ? (
              <a
                href={empleadoParaEditar.contratoUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm text-blue-600 underline"
              >
                Ver contrato
              </a>
            ) : (
              <p className="text-xs text-gray-400 mt-2">
                Subir desde el panel de administración.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Observaciones</label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => set('observaciones', e.target.value)}
            rows="2"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </Section>

      <div className="flex gap-3 sticky bottom-0 bg-white py-2 z-10">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Guardando...' : empleadoParaEditar ? 'Actualizar' : 'Registrar'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export default EmpleadoForm
