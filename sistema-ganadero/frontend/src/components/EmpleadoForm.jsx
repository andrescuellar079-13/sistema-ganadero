// frontend/src/components/EmpleadoForm.jsx
import React, { useState } from 'react'
import { useRrhh } from '../hooks/useRrhh'

const EmpleadoForm = ({ onSuccess, empleadoParaEditar, onCancel }) => {
  const { tipos, crearEmpleado, actualizarEmpleado } = useRrhh()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    tipoId: empleadoParaEditar?.tipo?.id || '',
    nombre: empleadoParaEditar?.nombre || '',
    apellidos: empleadoParaEditar?.apellidos || '',
    ci: empleadoParaEditar?.ci || '',
    sexo: empleadoParaEditar?.sexo || 'MASCULINO',
    fechaNacimiento: empleadoParaEditar?.fechaNacimiento || '',
    telefono: empleadoParaEditar?.telefono || '',
    email: empleadoParaEditar?.email || '',
    direccion: empleadoParaEditar?.direccion || '',
    fechaIngreso: empleadoParaEditar?.fechaIngreso || new Date().toISOString().split('T')[0],
    salario: empleadoParaEditar?.salario || '',
    estado: empleadoParaEditar?.estado || 'ACTIVO',
    observaciones: empleadoParaEditar?.observaciones || '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    let result
    if (empleadoParaEditar) {
      result = await actualizarEmpleado(empleadoParaEditar.id, {
        tipoId: formData.tipoId,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        ci: formData.ci,
        sexo: formData.sexo,
        fechaNacimiento: formData.fechaNacimiento || null,
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
        fechaIngreso: formData.fechaIngreso,
        fechaRetiro: null,
        salario: parseFloat(formData.salario) || 0,
        estado: formData.estado,
        observaciones: formData.observaciones
      })
    } else {
      result = await crearEmpleado({
        tipoId: formData.tipoId,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        ci: formData.ci,
        sexo: formData.sexo,
        fechaNacimiento: formData.fechaNacimiento || null,
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
        fechaIngreso: formData.fechaIngreso,
        salario: parseFloat(formData.salario) || 0,
        estado: formData.estado,
        observaciones: formData.observaciones
      })
    }

    if (result.success) {
      alert(empleadoParaEditar ? '✅ Empleado actualizado' : '✅ Empleado registrado')
      if (onSuccess) onSuccess()
    } else {
      alert(`❌ Error: ${result.error}`)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-bold text-blue-800 sticky top-0 bg-white py-2">
        {empleadoParaEditar ? '✏️ Editar Empleado' : '+ Nuevo Empleado'}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo *</label>
          <select
            required
            value={formData.tipoId}
            onChange={(e) => setFormData({ ...formData, tipoId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">Seleccionar tipo</option>
            {tipos.filter(t => t.activo).map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <select
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="ACTIVO">✅ Activo</option>
            <option value="INACTIVO">❌ Inactivo</option>
            <option value="LICENCIA">📋 Licencia</option>
            <option value="VACACIONES">🏖️ Vacaciones</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre *</label>
          <input
            type="text"
            required
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Apellidos</label>
          <input
            type="text"
            value={formData.apellidos}
            onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Sexo</label>
          <select
            value={formData.sexo}
            onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="MASCULINO">👨 Masculino</option>
            <option value="FEMENINO">👩 Femenino</option>
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
            onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="text"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Dirección</label>
        <textarea
          value={formData.direccion}
          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha Ingreso *</label>
          <input
            type="date"
            required
            value={formData.fechaIngreso}
            onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Salario (Bs)</label>
          <input
            type="number"
            step="0.01"
            value={formData.salario}
            onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Observaciones</label>
        <textarea
          value={formData.observaciones}
          onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div className="flex gap-3 sticky bottom-0 bg-white py-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          {loading ? 'Guardando...' : (empleadoParaEditar ? 'Actualizar' : 'Registrar')}
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