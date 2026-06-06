import { useState } from 'react'

export default function AnimalCard({ animal, onEdit, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false)

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'ACTIVO': return 'bg-green-100 text-green-800'
      case 'VENDIDO': return 'bg-yellow-100 text-yellow-800'
      case 'MUERTO': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSexoIcon = (sexo) => sexo === 'MACHO' ? '♂️' : '♀️'

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-1">
            {getSexoIcon(animal.sexo)} {animal.nombre || animal.nroArete}
          </h3>
          <p className="text-sm text-gray-500">Arete: {animal.nroArete}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${getEstadoColor(animal.estado)}`}>
          {animal.estado}
        </span>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-gray-500">Raza:</span> {animal.raza?.nombre || 'N/A'}</div>
        <div><span className="text-gray-500">Categoría:</span> {animal.categoria?.nombre || 'N/A'}</div>
        <div><span className="text-gray-500">Peso:</span> {animal.peso ? `${animal.peso} kg` : 'N/A'}</div>
        <div><span className="text-gray-500">Nacimiento:</span> {animal.fechaNacimiento ? new Date(animal.fechaNacimiento).toLocaleDateString() : 'N/A'}</div>
      </div>
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit(animal)}
          className="flex-1 bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600 transition"
        >
          Editar
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          className="flex-1 bg-red-600 text-white py-1 rounded hover:bg-red-700 transition"
        >
          Eliminar
        </button>
      </div>
      
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-4">¿Eliminar animal?</h3>
            <p className="text-gray-600 mb-6">¿Estás seguro de que deseas eliminar "{animal.nombre || animal.nroArete}"?</p>
            <div className="flex gap-3">
              <button
                onClick={() => onDelete(animal.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}