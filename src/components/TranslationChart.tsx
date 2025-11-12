'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface DataPoint {
  date: string
  count: number
}

export function TranslationChart({ dataPoints }: { dataPoints: DataPoint[] }) {
  const chartData = {
    labels: dataPoints.map(d => d.date),
    datasets: [
      {
        label: 'Traducciones por día',
        data: dataPoints.map(d => d.count),
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.3)',
        tension: 0.4,
      },
    ],
  }

  return <Line data={chartData} />
}
