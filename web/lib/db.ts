// Database helper functions for the portals
import { supabase, ChurchStats, EngagementTrend, RevenueStats, FeatureUsage } from './supabase'

// Church Analytics
export async function getChurchStats(churchId: string): Promise<ChurchStats> {
  // Get total couples
  const { count: totalCouples } = await supabase
    .from('couples')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)

  // Get active this month (at least 1 check-in this month)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: activeThisMonth } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)
    .gte('created_at', startOfMonth.toISOString())

  // Get devotionals completed this month
  const { count: devotionalsCompleted } = await supabase
    .from('devotional_progress')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)
    .eq('completed', true)
    .gte('completed_at', startOfMonth.toISOString())

  // Get prayers logged this month
  const { count: prayersLogged } = await supabase
    .from('prayers')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)
    .gte('created_at', startOfMonth.toISOString())

  return {
    total_couples: totalCouples || 0,
    active_this_month: activeThisMonth || 0,
    devotionals_completed: devotionalsCompleted || 0,
    prayers_logged: prayersLogged || 0,
  }
}

export async function getEngagementTrend(churchId: string, weeks: number = 12): Promise<EngagementTrend[]> {
  const trends: EngagementTrend[] = []
  const now = new Date()

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (i * 7))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const { count: checkins } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', churchId)
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString())

    const { count: prayers } = await supabase
      .from('prayers')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', churchId)
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString())

    const { count: devotionals } = await supabase
      .from('devotional_progress')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', churchId)
      .eq('completed', true)
      .gte('completed_at', weekStart.toISOString())
      .lt('completed_at', weekEnd.toISOString())

    trends.push({
      week: weekStart.toISOString().split('T')[0],
      checkins: checkins || 0,
      prayers: prayers || 0,
      devotionals: devotionals || 0,
    })
  }

  return trends
}

// Global Analytics (Admin only)
export async function getGlobalStats() {
  // Total couples
  const { count: totalCouples } = await supabase
    .from('couples')
    .select('*', { count: 'exact', head: true })

  // New signups this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { count: newSignups } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString())

  // Monthly active
  const monthAgo = new Date()
  monthAgo.setDate(monthAgo.getDate() - 30)

  const { count: monthlyActive } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', monthAgo.toISOString())

  // MRR (premium subscriptions)
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')

  const mrr = subscriptions?.reduce((acc, sub) => {
    if (sub.plan_type === 'premium') {
      return acc + 9.99
    }
    return acc
  }, 0) || 0

  return {
    total_couples: totalCouples || 0,
    new_signups_this_week: newSignups || 0,
    monthly_active_couples: monthlyActive || 0,
    mrr: mrr,
  }
}

export async function getGrowthData(period: 'daily' | 'weekly' | 'monthly' = 'weekly') {
  const now = new Date()
  const monthsBack = 12
  const data: { date: string; signups: number; active: number }[] = []

  for (let i = monthsBack - 1; i >= 0; i--) {
    let startDate: Date
    let endDate: Date

    if (period === 'daily') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - i)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 1)
    } else if (period === 'weekly') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - (i * 7))
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 7)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    }

    const { count: signups } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())

    const { count: active } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())

    data.push({
      date: startDate.toISOString().split('T')[0],
      signups: signups || 0,
      active: active || 0,
    })
  }

  return data
}

export async function getRevenueData() {
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')

  const mrrHistory: { month: string; mrr: number }[] = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

    const { data: monthSubs } = await supabase
      .from('subscriptions')
      .select('*')
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', monthEnd.toISOString())
      .eq('status', 'active')

    const mrr = monthSubs?.reduce((acc, sub) => {
      if (sub.plan_type === 'premium') return acc + 9.99
      return acc
    }, 0) || 0

    mrrHistory.push({
      month: monthStart.toLocaleString('default', { month: 'short' }),
      mrr: mrr,
    })
  }

  const premiumCount = subscriptions?.filter(s => s.plan_type === 'premium').length || 0
  const freeCount = subscriptions?.length ? 0 : 0 // This would be total - premium

  // Trial conversions this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const { count: trialConversions } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', monthStart.toISOString())
    .eq('status', 'active')
    .eq('plan_type', 'premium')

  return {
    mrr_history: mrrHistory,
    free_count: 0,
    premium_count: premiumCount,
    trial_conversions: trialConversions || 0,
    churn_rate: 0.05, // Would need historical data to calculate
    arpu: premiumCount > 0 ? (premiumCount * 9.99) / premiumCount : 0,
    arr: premiumCount * 9.99 * 12,
  }
}

export async function getFeatureUsage(): Promise<FeatureUsage> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const { count: checkins } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', monthStart.toISOString())

  const { count: prayers } = await supabase
    .from('prayers')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', monthStart.toISOString())

  const { count: devotionals } = await supabase
    .from('devotional_progress')
    .select('*', { count: 'exact', head: true })
    .eq('completed', true)
    .gte('completed_at', monthStart.toISOString())

  const { count: dailyVerseOpens } = await supabase
    .from('notifications_log')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'daily_verse')
    .gte('sent_at', monthStart.toISOString())

  return {
    checkins: checkins || 0,
    prayers: prayers || 0,
    devotionals: devotionals || 0,
    daily_verse_opens: dailyVerseOpens || 0,
    avg_streak: 0, // Would need streak calculation
    audio_listens: 0, // Would need audio tracking
  }
}

export async function getReferralAnalytics() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const { count: totalReferrals } = await supabase
    .from('couples')
    .select('*', { count: 'exact', head: true })
    .not('referred_by', 'is', null)
    .gte('created_at', monthStart.toISOString())

  const { count: conversions } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .not('referred_by', 'is', null)
    .gte('created_at', monthStart.toISOString())

  return {
    total_referrals: totalReferrals || 0,
    conversion_rate: totalReferrals ? ((conversions || 0) / totalReferrals) * 100 : 0,
    free_months_issued: (totalReferrals || 0) * 1, // 1 month per referral
  }
}

// Congregation List
export interface CongregationMember {
  id: string
  couple_name: string
  join_date: string
  last_active: string
  checkins_completed: number
  devotional_streak: number
}

export async function getCongregationList(
  churchId: string,
  filter: 'all' | 'active' | 'inactive' | 'new' = 'all'
): Promise<CongregationMember[]> {
  let query = supabase
    .from('couples')
    .select(`
      id,
      created_at,
      profiles:user1_id(
        full_name,
        spouse_name
      )
    `)
    .eq('church_id', churchId)

  const { data: couples } = await query

  if (!couples) return []

  const members: CongregationMember[] = []

  for (const couple of couples) {
    // Get check-in count
    const { count: checkinCount } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('couple_id', couple.id)

    // Get last active (most recent check-in or prayer)
    const { data: lastCheckin } = await supabase
      .from('checkins')
      .select('created_at')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: lastPrayer } = await supabase
      .from('prayers')
      .select('created_at')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const lastActive = lastCheckin?.created_at || lastPrayer?.created_at || couple.created_at
    const joinDate = couple.created_at

    // Calculate if active in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const isActive = new Date(lastActive) > thirtyDaysAgo

    // Check if new this month
    const monthStart = new Date()
    monthStart.setDate(1)
    const isNew = new Date(joinDate) >= monthStart

    // Filter
    if (filter === 'active' && !isActive) continue
    if (filter === 'inactive' && isActive) continue
    if (filter === 'new' && !isNew) continue

    // Get devotional streak
    const { count: streak } = await supabase
      .from('devotional_progress')
      .select('*', { count: 'exact', head: true })
      .eq('couple_id', couple.id)
      .eq('completed', true)

    const fullName = couple.profiles?.full_name || ''
    const spouseName = couple.profiles?.spouse_name || ''

    members.push({
      id: couple.id,
      couple_name: `${fullName} & ${spouseName}`,
      join_date: joinDate,
      last_active: lastActive,
      checkins_completed: checkinCount || 0,
      devotional_streak: streak || 0,
    })
  }

  return members.sort((a, b) => 
    new Date(b.last_active).getTime() - new Date(a.last_active).getTime()
  )
}
