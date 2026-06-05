import { useState } from 'react'
import VacunaCard from './VacunaCard'
import VacunaForm from './VacunaForm'
import { useVacunas } from '../hooks/useVacunas'

function VacunaList() {
  const { vacunas, loading, error, crearVacuna, actualizarVacuna, eliminarVacuna } = useVacunas()
  const [showForm, setShowForm] = useState(false)
  const [editingVacuna, setEditingVacuna] = useState(null)
  const [message, setMessage] = useState(null)

  const handleCreate = async (data) => {
    const result = await crearVacuna(data)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    if (result.success) {
      setShowForm(false)
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handleEdit = (vacuna) => {
    setEditingVacuna(vacuna)
    setShowForm(true)
  }

  const handleUpdate = async (data) => {
    const result = await actualizarVacuna(editingVacuna.id, data)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    if (result.success) {
      setShowForm(false)
      setEditingVacuna(null)
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handleDelete = async (id) => {
    const result = await eliminarVacuna(id)
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) return <div className="text-center py-10">Cargando vacunas...</div>
  if (error) return <div className="text-red-500 text-center py-10">Error: {error.message}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🐄 Vacunas</h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingVacuna(null)
              setShowForm(true)
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            + Nueva Vacuna
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('token')
              window.location.reload()
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vacunas.map((vacuna) => (
          <VacunaCard
            key={vacuna.id}
            vacuna={vacuna}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {showForm && (
        <VacunaForm
          vacuna={editingVacuna}
          onSubmit={editingVacuna ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false)
            setEditingVacuna(null)
          }}
        />
      )}
    </div>
  )
}

export default VacunaList