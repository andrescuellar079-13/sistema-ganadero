// frontend/src/components/ProximosPartosCard.jsx
import React from 'react'
import { useReproduccion } from '../hooks/useReproduccion'

const ProximosPartosCard = () => {
  const { proximosPartos, loading } = useReproduccion()
  
  const getDaysLeft = (date) => {
    const today = new Date()
    const partoDate = new Date(date)
    const diffTime = partoDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  if (loading) return <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-bold text-green-800 mb-3">🤰 Próximos Partos (30 días)</h3>
      
      {proximosPartos.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No hay partos próximos</p>
      ) : (
        <div className="space-y-3">
          {proximosPartos.map(parto => {
            const daysLeft = getDaysLeft(parto.fechaPartoEsperado)
            return (
              <div key={parto.id} className="border-l-4 border-green-500 pl-3 py-2 bg-gray-50 rounded">
                <div className="font-medium">{parto.madre?.nombre || parto.madre?.nroArete}</div>
                <div className="text-sm text-gray-600">
                  Fecha esperada: {new Date(parto.fechaPartoEsperado).toLocaleDateString()}
                </div>
                <div className={`text-sm font-semibold ${
                  daysLeft <= 7 ? 'text-red-600' : daysLeft <= 15 ? 'text-orange-500' : 'text-green-600'
                }`}>
                  {daysLeft <= 0 ? '⚠️ Parto atrasado' : `📅 En ${daysLeft} días`}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProximosPartosCard