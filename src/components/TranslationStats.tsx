'use client'

import { useEffect, useState } from 'react'
import { TranslationChart } from './TranslationChart'

export default function TranslationStats() {
  const [range, setRange] = useState(7)
  const [stats, setStats] = useState<{
    totalTranslations: number
    translationsByType: Record<string, number>
    last7Days: { date: string; count: number }[]
  } | null>(null)

  useEffect(() => {
    fetch(`/api/admin/stats?range=${range}`)
      .then(res => res.json())
      .then(data => setStats(data))
  }, [range])

  if (!stats) return <p className="text-gray-600">Cargando estadísticas...</p>

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select
          value={range}
          onChange={e => setRange(parseInt(e.target.value))}
          className="border rounded p-2 text-sm"
        >
          <option value={7}>Últimos 7 días</option>
          <option value={14}>Últimos 14 días</option>
          <option value={30}>Últimos 30 días</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white shadow-md rounded-lg p-4">
          <h3 className="text-gray-700 font-semibold">Total de traducciones</h3>
          <p className="text-2xl font-bold text-indigo-600">{stats.totalTranslations}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <h3 className="text-gray-700 font-semibold">Texto → Braille</h3>
          <p className="text-2xl font-bold text-blue-600">
            {stats.translationsByType['TEXT_TO_BRAILLE'] || 0}
          </p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <h3 className="text-gray-700 font-semibold">Braille → Texto</h3>
          <p className="text-2xl font-bold text-green-600">
            {stats.translationsByType['BRAILLE_TO_TEXT'] || 0}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <TranslationChart dataPoints={stats.last7Days} />
      </div>
    </div>
  )
}
