import { useQuery } from '@apollo/client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { GET_ANIMALES_POR_SEXO } from '../graphql/dashboard'

const COLORS = ['#3b82f6', '#ec4899']

export default function AnimalesPorSexoChart() {
  const { loading, error, data } = useQuery(GET_ANIMALES_POR_SEXO)

  if (loading) return <div className="bg-white rounded-xl shadow-md p-6 animate-pulse h-80"></div>
  if (error) return <div className="bg-white rounded-xl shadow-md p-6 text-red-500">Error: {error.message}</div>

  const animales = data?.allAnimales || []
  
  const machos = animales.filter(a => a.sexo === 'MACHO').length
  const hembras = animales.filter(a => a.sexo === 'HEMBRA').length

  const chartData = [
    { name: 'Machos', value: machos },
    { name: 'Hembras', value: hembras },
  ]

  if (animales.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🐂 Animales por Sexo</h3>
        <p className="text-gray-500 text-center py-8">No hay datos de animales</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">🐂 Animales por Sexo</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            <Cell fill="#3b82f6" />
            <Cell fill="#ec4899" />
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}