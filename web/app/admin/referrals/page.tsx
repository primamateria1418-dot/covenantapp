'use client'

import { useEffect, useState } from 'react'
import { getReferralAnalytics } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Referral {
  id: string
  code: string
  referrer_name: string
  referred_name: string
  created_at: string
  converted: boolean
}

export default function ReferralsPage() {
  const [stats, setStats] = useState({
    total_referrals: 0,
    conversion_rate: 0,
    free_months_issued: 0,
  })
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReferralData()
  }, [])

  const loadReferralData = async () => {
    const analytics = await getReferralAnalytics()
    setStats(analytics)

    // Get referral details
    const { data } = await supabase
      .from('couples')
      .select(`
        id,
        referral_code,
        created_at,
        profiles:user1_id(full_name),
        referred_by
      `)
      .not('referred_by', 'is', null)
      .order('created_at', { ascending: false })

    if (data) {
      const referralList = await Promise.all(
        data.map(async (r) => {
          // Get referrer info
          let referrerName = 'Unknown'
          if (r.referred_by) {
            const { data: referrer } = await supabase
              .from('couples')
              .select('profiles:user1_id(full_name)')
              .eq('referral_code', r.referred_by)
              .single()
            referrerName = referrer?.profiles?.full_name || 'Unknown'
          }

          // Check if converted (has check-in)
          const { count } = await supabase
            .from('checkins')
            .select('*', { count: 'exact', head: true })
            .eq('couple_id', r.id)

          return {
            id: r.id,
            code: r.referred_by,
            referrer_name: referrerName,
            referred_name: r.profiles?.full_name || 'Unknown',
            created_at: r.created_at,
            converted: (count || 0) > 0,
          }
        })
      )
      setReferrals(referralList)
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading text-brown-deep">Referral Analytics</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-500">Total Referrals This Month</p>
          <p className="text-3xl font-bold text-brown-deep">{stats.total_referrals}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="text-3xl font-bold text-green-600">{stats.conversion_rate.toFixed(1)}%</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Free Months Issued</p>
          <p className="text-3xl font-bold text-gold">{stats.free_months_issued}</p>
        </div>
      </div>

      {/* How it Works */}
      <div className="card bg-gold-light">
        <h2 className="text-xl font-heading text-brown-deep mb-4">How Referrals Work</h2>
        <div className="grid md:grid-cols-3 gap-6 text-brown-mid">
          <div className="text-center">
            <div className="text-3xl mb-2">🎁</div>
            <p className="font-semibold">Share Your Code</p>
            <p className="text-sm">Couples get a unique referral code to share</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💕</div>
            <p className="font-semibold">Friend Signs Up</p>
            <p className="text-sm">New couple creates account using the code</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🆓</div>
            <p className="font-semibold">Both Get 30 Days Free</p>
            <p className="text-sm">When referred couple completes first check-in</p>
          </div>
        </div>
      </div>

      {/* Referral Table */}
      <div className="card">
        <h2 className="text-xl font-heading text-brown-deep mb-4">Recent Referrals</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Referrer</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Referred</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code Used</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No referrals yet
                  </td>
                </tr>
              ) : (
                referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-brown-deep">
                      {ref.referrer_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {ref.referred_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {ref.code}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(ref.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ref.converted
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ref.converted ? '✓ Converted' : 'Pending'}
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
