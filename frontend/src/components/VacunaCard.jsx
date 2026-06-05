import { useState } from 'react'

export default function AnimalCard({ animal, onEdit, onDelete }) {  // ← Función correcta
  const [showConfirm, setShowConfirm] = useState(false)

  const getEstadoColor = (estado) => {  // ← Función correcta
    switch(estado) {
      case 'ACTIVO': return 'bg-green-100 text-green-800'
      case 'VENDIDO': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (  // ← return DENTRO de la función principal
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* contenido */}
    </div>
  )
}