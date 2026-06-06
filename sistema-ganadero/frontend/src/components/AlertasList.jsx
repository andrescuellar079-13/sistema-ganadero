// frontend/src/components/AlertasList.jsx
import React from 'react'
import AlertaCard from './AlertaCard'

const AlertasList = ({ alertas, onMarcarLeida, onEliminar, titulo }) => {
  if (!alertas || alertas.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">🔔 No hay alertas para mostrar</p>
      </div>
    )
  }

  return (
    <div>
      {titulo && <h3 className="text-lg font-semibold mb-3">{titulo} ({alertas.length})</h3>}
      {alertas.map(alerta => (
        <AlertaCard
          key={alerta.id}
          alerta={alerta}
          onMarcarLeida={onMarcarLeida}
          onEliminar={onEliminar}
        />
      ))}
    </div>
  )
}

export default AlertasList