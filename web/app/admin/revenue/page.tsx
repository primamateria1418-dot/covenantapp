'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { getRevenueData } from '@/lib/db'

export default function RevenuePage() {
  const [data, setData] = useState<{
    mrr_history: { month: string; mrr: number }[]
    free_count: number
    premium_count: number
    trial_conversions: number
    churn_rate: number
    arpu: number
    arr: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRevenueData()
  }, [])

  const loadRevenueData = async () => {
    const revenueData = await getRevenueData()
    setData(revenueData)
    setLoading(false)
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brown-warm text-xl">Loading...</div>
      </div>
    )
  }

  const pieData = [
    { name: 'Premium', value: data.premium_count, color: '#c8943a' },
    { name: 'Free', value: data.free_count || 10, color: '#e5e7eb' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading text-brown-deep">Revenue Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm text-gray-500">MRR</p>
          <p className="text-2xl font-bold text-brown-deep">
            ${data.mrr_history[data.mrr_history.length - 1]?.mrr.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">ARR Projection</p>
          <p className="text-2xl font-bold text-brown-deep">
            ${(data.mrr_history[data.mrr_history.length - 1]?.mrr * 12 || 0).toFixed(2)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Trial Conversions (Month)</p>
          <p className="text-2xl font-bold text-brown-deep">{data.trial_conversions}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Churn Rate</p>
          <p className="text-2xl font-bold text-brown-deep">{(data.churn_rate * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* MRR Chart */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-6">
          MRR Over Time
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.mrr_history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'MRR']}
              />
              <Line 
                type="monotone" 
                dataKey="mrr" 
                stroke="#c8943a" 
                strokeWidth={2}
                dot={{ fill: '#c8943a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Free vs Premium Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-heading text-brown-deep mb-6">
            Free vs Premium Split
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-heading text-brown-deep mb-6">
            Revenue Metrics
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">ARPU (Avg Revenue Per User)</span>
              <span className="font-bold text-brown-deep">${data.arpu.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Monthly Recurring Revenue</span>
              <span className="font-bold text-brown-deep">
                ${data.mrr_history[data.mrr_history.length - 1]?.mrr.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Annual Run Rate</span>
              <span className="font-bold text-brown-deep">
                ${((data.mrr_history[data.mrr_history.length - 1]?.mrr || 0) * 12).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Premium Subscribers</span>
              <span className="font-bold text-brown-deep">{data.premium_count}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
