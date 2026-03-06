'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '@/lib/supabase'
import { getChurchStats, getEngagementTrend, ChurchStats, EngagementTrend } from '@/lib/db'

export default function PastorDashboardPage() {
  const [stats, setStats] = useState<ChurchStats | null>(null)
  const [trends, setTrends] = useState<EngagementTrend[]>([])
  const [licenceStatus, setLicenceStatus] = useState<{ active: boolean; daysRemaining: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const churchId = localStorage.getItem('church_id')
      if (!churchId) return

      // Load stats
      const churchStats = await getChurchStats(churchId)
      setStats(churchStats)

      // Load trends
      const engagementTrends = await getEngagementTrend(churchId, 12)
      setTrends(engagementTrends)

      // Check licence status
      const { data: church } = await supabase
        .from('churches')
        .select('licence_expiry')
        .eq('id', churchId)
        .single()

      if (church?.licence_expiry) {
        const expiry = new Date(church.licence_expiry)
        const now = new Date()
        const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        setLicenceStatus({
          active: daysRemaining > 0,
          daysRemaining,
        })
      } else {
        setLicenceStatus({ active: false, daysRemaining: 0 })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brown-warm text-xl">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading text-brown-deep">Dashboard</h1>

      {/* Licence Renewal Banner */}
      {licenceStatus && licenceStatus.daysRemaining <= 30 && licenceStatus.daysRemaining > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800">
                Licence expires in {licenceStatus.daysRemaining} days
              </p>
              <p className="text-amber-700 text-sm">
                Renew now to keep your congregation's access uninterrupted
              </p>
            </div>
          </div>
          <a href="/pastor/licence" className="btn-primary">
            Renew Now
          </a>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Couples"
          value={stats?.total_couples || 0}
          icon="💑"
          color="bg-brown-warm"
        />
        <StatCard
          title="Active This Month"
          value={stats?.active_this_month || 0}
          icon="✅"
          color="bg-green-deep"
        />
        <StatCard
          title="Devotionals Completed"
          value={stats?.devotionals_completed || 0}
          icon="📖"
          color="bg-purple"
        />
        <StatCard
          title="Prayers Logged"
          value={stats?.prayers_logged || 0}
          icon="🙏"
          color="bg-gold"
        />
      </div>

      {/* Engagement Trend Chart */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-6">
          Engagement Trend — Last 12 Weeks
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                dataKey="checkins" 
                name="Check-ins"
                stroke="#c8943a" 
                strokeWidth={2}
                dot={{ fill: '#c8943a' }}
              />
              <Line 
                type="monotone" 
                dataKey="prayers" 
                name="Prayers"
                stroke="#2c5f2e" 
                strokeWidth={2}
                dot={{ fill: '#2c5f2e' }}
              />
              <Line 
                type="monotone" 
                dataKey="devotionals" 
                name="Devotionals"
                stroke="#7c5cbf" 
                strokeWidth={2}
                dot={{ fill: '#7c5cbf' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string
  value: number
  icon: string
  color: string
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-14 h-14 ${color} rounded-full flex items-center justify-center text-2xl`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-brown-deep">{value}</p>
      </div>
    </div>
  )
}
