'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'
import { getGrowthData } from '@/lib/db'

export default function GrowthPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [data, setData] = useState<{ date: string; signups: number; active: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGrowthData()
  }, [period])

  const loadGrowthData = async () => {
    setLoading(true)
    const growthData = await getGrowthData(period)
    setData(growthData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brown-warm text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading text-brown-deep">Growth Analytics</h1>
        
        {/* Period Filter */}
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                period === p
                  ? 'bg-brown-warm text-white'
                  : 'bg-white text-brown-mid border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Signups Over Time */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-6">
          Total Signups Over Time
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return period === 'monthly' 
                    ? date.toLocaleDateString('en-US', { month: 'short' })
                    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="signups" 
                name="New Signups"
                stroke="#c8943a" 
                strokeWidth={2}
                dot={{ fill: '#c8943a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* New vs Active (Stacked Bar) */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-6">
          New vs Active Couples
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return period === 'monthly' 
                    ? date.toLocaleDateString('en-US', { month: 'short' })
                    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="signups" name="New Signups" stackId="a" fill="#c8943a" />
              <Bar dataKey="active" name="Active" stackId="a" fill="#2c5f2e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-500">Total Signups (12 months)</p>
          <p className="text-2xl font-bold text-brown-deep">
            {data.reduce((acc, d) => acc + d.signups, 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Average New Per Month</p>
          <p className="text-2xl font-bold text-brown-deep">
            {Math.round(data.reduce((acc, d) => acc + d.signups, 0) / data.length)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Peak Month</p>
          <p className="text-2xl font-bold text-brown-deep">
            {data.reduce((acc, d) => d.signups > acc.signups ? d : acc, data[0] || {signups: 0}).signups}
          </p>
        </div>
      </div>
    </div>
  )
}
