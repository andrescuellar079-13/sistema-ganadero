import { useQuery } from '@apollo/client'
import { GET_PROXIMAS_VACUNACIONES } from '../graphql/dashboard'

export default function ProximasVacunaciones() {
  const { loading, error, data } = useQuery(GET_PROXIMAS_VACUNACIONES, {
    variables: { dias: 15 }
  })

  if (loading) return <div className="bg-white rounded-xl shadow-md p-6 animate-pulse h-64"></div>
  if (error) return <div className="bg-white rounded-xl shadow-md p-6 text-red-500">Error: {error.message}</div>

  const vacunaciones = data?.vacunasProximas || []

  if (vacunaciones.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ Próximas Vacunaciones</h3>
        <p className="text-gray-500 text-center py-8">✅ No hay vacunaciones próximas en los próximos 15 días</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ Próximas Vacunaciones (15 días)</h3>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {vacunaciones.map((vac) => (
          <div key={vac.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
            <div>
              <p className="font-medium text-gray-800">
                {vac.animal?.nroArete} - {vac.animal?.nombre || 'Sin nombre'}
              </p>
              <p className="text-sm text-gray-600">
                💉 {vac.vacuna?.nombre}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Próxima dosis</p>
              <p className="font-bold text-yellow-700">
                {new Date(vac.fechaProxima).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}