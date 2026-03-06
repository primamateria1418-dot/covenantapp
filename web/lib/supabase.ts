import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for the database
export interface Profile {
  id: string
  email: string
  full_name: string
  spouse_name: string
  wedding_date: string
  couple_id: string | null
  created_at: string
  updated_at: string
}

export interface Couple {
  id: string
  user1_id: string
  user2_id: string | null
  church_id: string | null
  premium_expiry: string | null
  referral_code: string | null
  referred_by: string | null
  church_licence_expiry: string | null
  created_at: string
}

export interface Church {
  id: string
  name: string
  denomination: string | null
  pastor_name: string | null
  pastor_email: string | null
  logo_url: string | null
  cobranding_enabled: boolean | null
  sermon_series_banner: string | null
  licence_expiry: string | null
  created_at: string
}

export interface Pastor {
  id: string
  church_id: string
  email: string
  full_name: string
  password_hash: string
  totp_secret: string | null
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  email: string
  full_name: string
  password_hash: string
  totp_secret: string
  created_at: string
  updated_at: string
}

export interface CheckIn {
  id: string
  couple_id: string
  week_start: string
  health_score: number | null
  created_at: string
}

export interface CheckInAnswer {
  id: string
  checkin_id: string
  question_id: number
  answer: string
  partner_answer: string | null
}

export interface Prayer {
  id: string
  couple_id: string
  prayer_text: string
  answered: boolean
  created_at: string
  answered_at: string | null
}

export interface DevotionalProgress {
  id: string
  couple_id: string
  day_number: number
  completed: boolean
  completed_at: string | null
}

export interface Retreat {
  id: string
  church_id: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export interface RetreatQuestion {
  id: string
  retreat_id: string
  question_text: string
  order_index: number
}

export interface PromoCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  expires_at: string | null
  max_uses: number | null
  uses_count: number | null
  is_active: boolean
  created_at: string
}

export interface Subscription {
  id: string
  couple_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  plan_type: 'premium' | 'church_licence'
  current_period_start: string
  current_period_end: string
  created_at: string
}

export interface Verse {
  id: string
  reference: string
  text: string
  topic: string
  is_active: boolean
  created_at: string
}

export interface NotificationLog {
  id: string
  couple_id: string
  type: string
  sent_at: string
  delivered: boolean
}

// Analytics types
export interface ChurchStats {
  total_couples: number
  active_this_month: number
  devotionals_completed: number
  prayers_logged: number
}

export interface EngagementTrend {
  week: string
  checkins: number
  prayers: number
  devotionals: number
}

export interface RevenueStats {
  mrr: number
  free_count: number
  premium_count: number
  trial_conversions: number
  churn_rate: number
  arpu: number
  arr: number
}

export interface FeatureUsage {
  checkins: number
  prayers: number
  devotionals: number
  daily_verse_opens: number
  avg_streak: number
  audio_listens: number
}
