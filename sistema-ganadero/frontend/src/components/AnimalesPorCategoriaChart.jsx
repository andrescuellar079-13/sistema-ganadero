import { useQuery } from '@apollo/client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { GET_ANIMALES_POR_CATEGORIA } from '../graphql/dashboard'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnimalesPorCategoriaChart() {
  const { loading, error, data } = useQuery(GET_ANIMALES_POR_CATEGORIA)

  if (loading) return <div className="bg-white rounded-xl shadow-md p-6 animate-pulse h-80"></div>
  if (error) return <div className="bg-white rounded-xl shadow-md p-6 text-red-500">Error: {error.message}</div>

  const animales = data?.allAnimales || []
  
  // Agrupar por categoría
  const categoriasMap = new Map()
  animales.forEach(animal => {
    const categoriaNombre = animal.categoria?.nombre || 'Sin categoría'
    categoriasMap.set(categoriaNombre, (categoriasMap.get(categoriaNombre) || 0) + 1)
  })

  const chartData = Array.from(categoriasMap.entries()).map(([name, value]) => ({
    name,
    value,
  }))

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🥩 Animales por Categoría</h3>
        <p className="text-gray-500 text-center py-8">No hay datos de animales</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">🥩 Animales por Categoría</h3>
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
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}