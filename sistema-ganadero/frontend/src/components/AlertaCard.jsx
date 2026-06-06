// frontend/src/components/AlertaCard.jsx
import React from 'react'

const AlertaCard = ({ alerta, onMarcarLeida, onEliminar }) => {
  const getColorByTipo = (tipo) => {
    const colores = {
      'VACUNA_PROXIMA': 'bg-yellow-100 border-yellow-500 text-yellow-800',
      'VACUNA_VENCIDA': 'bg-red-100 border-red-500 text-red-800',
      'PARTO_PROXIMO': 'bg-blue-100 border-blue-500 text-blue-800',
      'STOCK_BAJO_MEDICAMENTO': 'bg-orange-100 border-orange-500 text-orange-800',
      'STOCK_BAJO_ALIMENTO': 'bg-orange-100 border-orange-500 text-orange-800',
      'PESAJE_PENDIENTE': 'bg-purple-100 border-purple-500 text-purple-800',
      'OTRO': 'bg-gray-100 border-gray-500 text-gray-800',
    }
    return colores[tipo] || colores['OTRO']
  }

  const getIconoByTipo = (tipo) => {
    const iconos = {
      'VACUNA_PROXIMA': '💉',
      'VACUNA_VENCIDA': '⚠️',
      'PARTO_PROXIMO': '🤰',
      'STOCK_BAJO_MEDICAMENTO': '💊',
      'STOCK_BAJO_ALIMENTO': '🍖',
      'PESAJE_PENDIENTE': '⚖️',
      'OTRO': '📢',
    }
    return iconos[tipo] || '🔔'
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible'
    return new Date(fecha).toLocaleDateString()
  }

  return (
    <div className={`border-l-4 rounded-lg shadow-sm p-4 mb-3 ${getColorByTipo(alerta.tipo)} bg-opacity-50`}>
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="text-2xl">{getIconoByTipo(alerta.tipo)}</div>
          <div>
            <h3 className="font-bold">{alerta.tipo?.replace(/_/g, ' ') || 'Alerta'}</h3>
            <p className="text-sm mt-1">{alerta.mensaje}</p>
            <div className="flex gap-4 mt-2 text-xs">
              <span>📅 {formatearFecha(alerta.fechaAlerta)}</span>
              {alerta.diasRestantes > 0 && (
                <span className="font-semibold">⏰ {alerta.diasRestantes} días restantes</span>
              )}
              {alerta.animal && (
                <span>🐄 {alerta.animal.nroArete} - {alerta.animal.nombre || 'Sin nombre'}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!alerta.leida && (
            <button
              onClick={() => onMarcarLeida(alerta.id)}
              className="text-green-600 hover:text-green-800 text-sm"
              title="Marcar como leída"
            >
              ✅
            </button>
          )}
          <button
            onClick={() => onEliminar(alerta.id)}
            className="text-red-600 hover:text-red-800 text-sm"
            title="Eliminar"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

export default AlertaCard