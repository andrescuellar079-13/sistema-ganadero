import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif"

// Paleta Material Design — tonos oscuros para buen contraste
const MATERIAL_PALETTE = [
  '#1565C0', // Blue 800
  '#2E7D32', // Green 800
  '#6A1B9A', // Purple 900
  '#E65100', // Deep Orange 900
  '#00695C', // Teal 800
  '#AD1457', // Pink 800
  '#4E342E', // Brown 800
  '#37474F', // Blue Grey 800
]

const PieChart = ({ labels, data, colors }) => {
  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: colors || MATERIAL_PALETTE,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      hoverBorderWidth: 3,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: FONT, size: 11 },
          color: '#64748B',
          boxWidth: 12,
          padding: 14,
        },
      },
      tooltip: {
        padding: 10,
        cornerRadius: 8,
        backgroundColor: '#1A2027',
        titleFont:  { family: FONT, size: 12, weight: '600' },
        bodyFont:   { family: FONT, size: 11 },
        titleColor: '#F8FAFC',
        bodyColor:  '#CBD5E1',
      },
    },
  }

  return <Pie data={chartData} options={options} />
}

export default PieChart
