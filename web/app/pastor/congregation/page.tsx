'use client'

import { useEffect, useState } from 'react'
import { getCongregationList, CongregationMember } from '@/lib/db'
import { format } from 'date-fns'

export default function CongregationPage() {
  const [members, setMembers] = useState<CongregationMember[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'new'>('all')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadCongregation()
  }, [filter])

  const loadCongregation = async () => {
    try {
      const churchId = localStorage.getItem('church_id')
      if (!churchId) return

      const data = await getCongregationList(churchId, filter)
      setMembers(data)
    } catch (error) {
      console.error('Error loading congregation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    setExporting(true)
    
    const headers = ['Couple Name', 'Join Date', 'Last Active', 'Check-ins Completed', 'Devotional Streak']
    const csvContent = [
      headers.join(','),
      ...members.map(m => [
        `"${m.couple_name}"`,
        format(new Date(m.join_date), 'yyyy-MM-dd'),
        format(new Date(m.last_active), 'yyyy-MM-dd'),
        m.checkins_completed,
        m.devotional_streak
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `congregation-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brown-warm text-xl">Loading congregation...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading text-brown-deep">Congregation</h1>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="btn-secondary"
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <span className="font-semibold">🔒 Privacy Notice:</span> Prayer and check-in 
          content is private — visible only to each couple. This list shows only 
          engagement metrics, not personal responses.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'active', 'inactive', 'new'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              filter === f
                ? 'bg-brown-warm text-white'
                : 'bg-white text-brown-mid border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'new' ? 'New This Month' : f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Couple</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Last Active</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Check-ins</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No couples found
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-brown-deep">
                      {member.couple_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(member.join_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(member.last_active), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {member.checkins_completed}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        member.devotional_streak > 7
                          ? 'bg-green-100 text-green-800'
                          : member.devotional_streak > 0
                          ? 'bg-gold-light text-brown-deep'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {member.devotional_streak} days
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
