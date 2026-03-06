'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getFeatureUsage } from '@/lib/db'
import { supabase } from '@/lib/supabase'

interface ScriptureTopic {
  topic: string
  count: number
}

export default function UsagePage() {
  const [usage, setUsage] = useState({
    checkins: 0,
    prayers: 0,
    devotionals: 0,
    daily_verse_opens: 0,
    avg_streak: 0,
    audio_listens: 0,
  })
  const [scriptureTopics, setScriptureTopics] = useState<ScriptureTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsageData()
  }, [])

  const loadUsageData = async () => {
    const usageData = await getFeatureUsage()
    setUsage(usageData)

    // Get scripture topic usage
    const { data: topics } = await supabase
      .from('verses')
      .select('topic')

    if (topics) {
      const topicCounts: Record<string, number> = {}
      topics.forEach(v => {
        topicCounts[v.topic] = (topicCounts[v.topic] || 0) + 1
      })
      setScriptureTopics(
        Object.entries(topicCounts)
          .map(([topic, count]) => ({ topic, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      )
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brown-warm text-xl">Loading...</div>
      </div>
    )
  }

  const barData = [
    { name: 'Check-ins', value: usage.checkins, fill: '#c8943a' },
    { name: 'Prayers', value: usage.prayers, fill: '#2c5f2e' },
    { name: 'Devotionals', value: usage.devotionals, fill: '#7c5cbf' },
    { name: 'Daily Verse', value: usage.daily_verse_opens, fill: '#5a2d1a' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading text-brown-deep">Feature Usage</h1>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <UsageCard label="Check-ins" value={usage.checkins} icon="✅" />
        <UsageCard label="Prayers" value={usage.prayers} icon="🙏" />
        <UsageCard label="Devotionals" value={usage.devotionals} icon="📖" />
        <UsageCard label="Daily Verse Opens" value={usage.daily_verse_opens} icon="📅" />
        <UsageCard label="Avg Streak" value={usage.avg_streak} icon="🔥" days />
        <UsageCard label="Audio Listens" value={usage.audio_listens} icon="🎧" />
      </div>

      {/* Feature Usage Chart */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-6">
          Feature Usage This Month
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scripture Topics */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-6">
          Most Used Scripture Topics
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scriptureTopics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="topic" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#c8943a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-heading text-brown-deep mb-4">
            Engagement Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Actions This Month</span>
              <span className="font-bold text-brown-deep">
                {usage.checkins + usage.prayers + usage.devotionals}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Avg Actions Per Active User</span>
              <span className="font-bold text-brown-deep">
                {((usage.checkins + usage.prayers + usage.devotionals) / Math.max(usage.checkins, 1)).toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Most Popular Feature</span>
              <span className="font-bold text-brown-deep">
                {usage.prayers > usage.checkins && usage.prayers > usage.devotionals
                  ? 'Prayers'
                  : usage.checkins > usage.devotionals
                  ? 'Check-ins'
                  : 'Devotionals'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-heading text-brown-deep mb-4">
            DAU/WAU Metrics
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Daily Active Users (Est.)</span>
              <span className="font-bold text-brown-deep">
                {Math.round(usage.checkins / 30)}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Weekly Active Users (Est.)</span>
              <span className="font-bold text-brown-deep">
                {Math.round(usage.checkins / 4)}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Avg Session Length</span>
              <span className="font-bold text-brown-deep">8 min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UsageCard({ 
  label, 
  value, 
  icon, 
  days 
}: { 
  label: string
  value: number 
  icon: string
  days?: boolean
}) {
  return (
    <div className="card text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-brown-deep">{value}{days && ' days'}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
