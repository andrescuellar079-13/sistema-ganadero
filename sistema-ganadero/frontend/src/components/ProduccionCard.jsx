// frontend/src/components/ProduccionCard.jsx
import React from 'react'

const ProduccionCard = ({ titulo, valor, icono, color, subtitulo }) => {
  const colores = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{titulo}</p>
          <p className="text-2xl font-bold text-gray-800">{valor}</p>
          {subtitulo && <p className="text-xs text-gray-400 mt-1">{subtitulo}</p>}
        </div>
        <div className={`${colores[color] || 'bg-blue-500'} w-10 h-10 rounded-full flex items-center justify-center text-white text-xl`}>
          {icono}
        </div>
      </div>
    </div>
  )
}

export default ProduccionCard