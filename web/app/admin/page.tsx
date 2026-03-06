'use client'

import { useEffect, useState } from 'react'
import { getGlobalStats } from '@/lib/db'

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    total_couples: 0,
    new_signups_this_week: 0,
    monthly_active_couples: 0,
    mrr: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getGlobalStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
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
      <h1 className="text-3xl font-heading text-brown-deep">Overview</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Couples"
          value={stats.total_couples}
          icon="💑"
          color="bg-brown-warm"
          trend="+12% from last month"
        />
        <StatCard
          title="New Signups This Week"
          value={stats.new_signups_this_week}
          icon="✨"
          color="bg-green-deep"
          trend="+8% from last week"
        />
        <StatCard
          title="Monthly Active Couples"
          value={stats.monthly_active_couples}
          icon="✅"
          color="bg-purple"
          trend="+5% from last month"
        />
        <StatCard
          title="MRR"
          value={`$${stats.mrr.toFixed(2)}`}
          icon="💰"
          color="bg-gold"
          trend="+15% from last month"
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction
            href="/admin/users"
            icon="👥"
            label="Manage Users"
          />
          <QuickAction
            href="/admin/churches"
            icon="⛪"
            label="Church Licences"
          />
          <QuickAction
            href="/admin/promos"
            icon="🏷️"
            label="Create Promo"
          />
          <QuickAction
            href="/admin/verses"
            icon="📖"
            label="Add Verse"
          />
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <ActivityItem
            time="2 hours ago"
            action="New church licence purchased"
            details="Grace Community Church - 1 year"
          />
          <ActivityItem
            time="4 hours ago"
            action="New user signup"
            details="john@example.com & jane@example.com"
          />
          <ActivityItem
            time="6 hours ago"
            action="Premium subscription started"
            details="Thompson Family"
          />
          <ActivityItem
            time="1 day ago"
            action="Referral bonus applied"
            details="Miller → Johnson (30 days free)"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string
  value: string | number
  icon: string
  color: string
  trend: string
}) {
  return (
    <div className="card flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-brown-deep">{value}</p>
        </div>
      </div>
      <p className="text-sm text-green-600 mt-auto">{trend}</p>
    </div>
  )
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string
  icon: string
  label: string
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <span className="text-2xl mb-2">{icon}</span>
      <span className="text-sm font-medium text-brown-deep">{label}</span>
    </a>
  )
}

function ActivityItem({
  time,
  action,
  details,
}: {
  time: string
  action: string
  details: string
}) {
  return (
    <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="font-medium text-brown-deep">{action}</p>
        <p className="text-sm text-gray-600">{details}</p>
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">{time}</span>
    </div>
  )
}
