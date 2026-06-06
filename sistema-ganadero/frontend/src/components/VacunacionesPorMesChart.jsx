import { useQuery } from '@apollo/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { GET_VACUNACIONES_POR_MES } from '../graphql/dashboard'

export default function VacunacionesPorMesChart() {
  const { loading, error, data } = useQuery(GET_VACUNACIONES_POR_MES)

  if (loading) return <div className="bg-white rounded-xl shadow-md p-6 animate-pulse h-80"></div>
  if (error) return <div className="bg-white rounded-xl shadow-md p-6 text-red-500">Error: {error.message}</div>

  // Procesar datos para agrupar por mes
  const vacunaciones = data?.vacunaciones || []
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const vacunacionesPorMes = new Array(12).fill(0)

  vacunaciones.forEach(vac => {
    const fecha = new Date(vac.fechaAplicacion)
    const mes = fecha.getMonth()
    vacunacionesPorMes[mes]++
  })

  const chartData = meses.map((mes, index) => ({
    mes,
    vacunaciones: vacunacionesPorMes[index],
  }))

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Vacunaciones por Mes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="vacunaciones" fill="#3b82f6" name="Vacunaciones" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}