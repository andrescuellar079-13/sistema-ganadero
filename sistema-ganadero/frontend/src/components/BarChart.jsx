import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif"
const TICK_COLOR = '#64748B'
const GRID_COLOR = '#F1F5F9'

const BarChart = ({ labels, data, title, backgroundColor = '#1565C0' }) => {
  const chartData = {
    labels,
    datasets: [{
      label: title,
      data,
      backgroundColor,
      borderRadius: 6,
      borderSkipped: false,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: FONT, size: 11 },
          color: TICK_COLOR,
          boxWidth: 12,
          padding: 16,
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
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: TICK_COLOR, font: { family: FONT, size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: GRID_COLOR },
        ticks: { color: TICK_COLOR, font: { family: FONT, size: 11 } },
        border: { display: false, dash: [4, 4] },
      },
    },
  }

  return <Bar data={chartData} options={options} />
}

export default BarChart
