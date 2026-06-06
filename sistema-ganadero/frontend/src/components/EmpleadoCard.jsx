// frontend/src/components/EmpleadoCard.jsx
import React from 'react'

const EmpleadoCard = ({ empleado, onEditar, onEliminar }) => {
  const getEstadoColor = (estado) => {
    const colores = {
      'ACTIVO': 'bg-green-100 text-green-800',
      'INACTIVO': 'bg-red-100 text-red-800',
      'LICENCIA': 'bg-yellow-100 text-yellow-800',
      'VACACIONES': 'bg-blue-100 text-blue-800',
    }
    return colores[estado] || 'bg-gray-100 text-gray-800'
  }

  const getEstadoIcono = (estado) => {
    const iconos = {
      'ACTIVO': '✅',
      'INACTIVO': '❌',
      'LICENCIA': '📋',
      'VACACIONES': '🏖️',
    }
    return iconos[estado] || '📌'
  }

  const getSexoIcono = (sexo) => {
    if (sexo === 'MASCULINO') return '👨'
    if (sexo === 'FEMENINO') return '👩'
    return '👤'
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString()
  }

  const formatearSalario = (salario) => {
    if (!salario) return '-'
    return `Gs. ${parseFloat(salario).toLocaleString()}`
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200">
      {/* Header con foto y nombre */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-3 text-white">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
              {getSexoIcono(empleado.sexo)}
            </div>
            <div>
              <h3 className="font-bold text-lg">{empleado.nombreCompleto}</h3>
              <p className="text-sm text-blue-200">{empleado.tipo?.nombre}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(empleado.estado)}`}>
            {getEstadoIcono(empleado.estado)} {empleado.estado}
          </span>
        </div>
      </div>

      {/* Cuerpo con información */}
      <div className="p-4 space-y-3">
        {/* Información personal */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-gray-400">🆔</span>
            <span>{empleado.ci || 'CI no registrada'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-gray-400">📅</span>
            <span>Nac: {formatearFecha(empleado.fechaNacimiento)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-gray-400">📞</span>
            <span>{empleado.telefono || 'Sin teléfono'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-gray-400">✉️</span>
            <span className="truncate">{empleado.email || 'Sin email'}</span>
          </div>
        </div>

        {/* Información laboral */}
        <div className="border-t pt-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-gray-400">📅 Ingreso:</span>
              <span className="font-medium">{formatearFecha(empleado.fechaIngreso)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-gray-400">💰 Salario:</span>
              <span className="font-medium text-green-600">{formatearSalario(empleado.salario)}</span>
            </div>
          </div>
          {empleado.fechaRetiro && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              <span className="text-gray-400">📅 Retiro:</span>
              <span>{formatearFecha(empleado.fechaRetiro)}</span>
            </div>
          )}
        </div>

        {/* Observaciones */}
        {empleado.observaciones && (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 italic">
              📝 {empleado.observaciones.length > 80 ? empleado.observaciones.substring(0, 80) + '...' : empleado.observaciones}
            </p>
          </div>
        )}
      </div>

      {/* Footer con botones */}
      <div className="border-t px-4 py-3 bg-gray-50 flex justify-end gap-2">
        <button
          onClick={() => onEditar(empleado)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
        >
          ✏️ Editar
        </button>
        <button
          onClick={() => onEliminar(empleado.id, empleado.nombreCompleto)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition"
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>
  )
}

export default EmpleadoCard