import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif"
const TICK_COLOR = '#64748B'
const GRID_COLOR = '#F1F5F9'

const LineChart = ({ labels, data, title, color = '#2E7D32' }) => {
  const chartData = {
    labels,
    datasets: [{
      label: title,
      data,
      borderColor: color,
      backgroundColor: color + '14',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
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

  return <Line data={chartData} options={options} />
}

export default LineChart
