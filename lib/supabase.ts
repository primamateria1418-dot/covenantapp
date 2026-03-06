import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://vvbqktqlkcafmfxfekie.supabase.co';
const supabaseAnonKey = 'sb_publishable_fxDti6SfownkSKZafG9opw_Pe_9-DN4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Auth Helpers ────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { profile: data, error };
}

export async function upsertProfile(profile: {
  id: string;
  name: string;
  spouse_name?: string | null;
  wedding_date?: string | null;
  couple_code?: string | null;
}) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();
  return { data, error };
}

// ─── Database Types ───────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          spouse_name: string | null;
          wedding_date: string | null;
          avatar_url: string | null;
          couple_code: string | null;
        };
        Insert: {
          id: string;
          name: string;
          spouse_name?: string | null;
          wedding_date?: string | null;
          avatar_url?: string | null;
          couple_code?: string | null;
        };
        Update: {
          name?: string;
          spouse_name?: string | null;
          wedding_date?: string | null;
          avatar_url?: string | null;
          couple_code?: string | null;
        };
      };
      prayers: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          title: string;
          body: string;
          answered: boolean;
          answered_at: string | null;
        };
        Insert: {
          user_id: string;
          title: string;
          body: string;
          answered?: boolean;
        };
        Update: {
          title?: string;
          body?: string;
          answered?: boolean;
          answered_at?: string | null;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          prompt: string | null;
          content: string;
          mood: string | null;
        };
        Insert: {
          user_id: string;
          content: string;
          prompt?: string | null;
          mood?: string | null;
        };
        Update: {
          content?: string;
          mood?: string | null;
        };
      };
      checkins: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          mood: number;
          note: string | null;
        };
        Insert: {
          user_id: string;
          mood: number;
          note?: string | null;
        };
        Update: {
          mood?: number;
          note?: string | null;
        };
      };
      // ─── Journal Letters (Couples) ────────────────────────────────
      journal_letters: {
        Row: {
          id: string;
          couple_id: string;
          author_user_id: string;
          text: string;
          is_private: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          couple_id: string;
          author_user_id: string;
          text: string;
          is_private?: boolean;
        };
        Update: {
          text?: string;
          is_private?: boolean;
          read_at?: string | null;
        };
      };
      // ─── Time Capsules ───────────────────────────────────────────
      time_capsules: {
        Row: {
          id: string;
          couple_id: string;
          text: string;
          written_at: string;
          unlock_date: string;
          unlocked: boolean;
        };
        Insert: {
          couple_id: string;
          text: string;
          unlock_date: string;
        };
        Update: {
          text?: string;
          unlocked?: boolean;
        };
      };
      // ─── Couples ─────────────────────────────────────────────────
      couples: {
        Row: {
          id: string;
          user_id_1: string | null;
          user_id_2: string | null;
          name1: string;
          name2: string;
          anniversary: string | null;
          couple_code: string;
          premium: boolean;
          premium_expiry: string | null;
          created_at: string;
        };
        Insert: {
          user_id_1: string;
          user_id_2?: string | null;
          name1: string;
          name2: string;
          anniversary: string;
          couple_code: string;
          premium?: boolean;
        };
        Update: {
          user_id_2?: string | null;
          name2?: string;
          anniversary?: string;
          premium?: boolean;
          premium_expiry?: string | null;
        };
      };
      // ─── Bucket List ───────────────────────────────────────────────
      bucket_list: {
        Row: {
          id: string;
          couple_id: string;
          text: string;
          category: string;
          target_date: string | null;
          completed: boolean;
          completed_at: string | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          couple_id: string;
          text: string;
          category: string;
          target_date?: string | null;
          completed?: boolean;
          photo_url?: string | null;
        };
        Update: {
          text?: string;
          category?: string;
          target_date?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          photo_url?: string | null;
        };
      };
      // ─── Monthly Goals ────────────────────────────────────────────
      monthly_goals: {
        Row: {
          id: string;
          couple_id: string;
          goal_text: string;
          month: number;
          year: number;
          proposed_by: string | null;
          confirmed: boolean;
          outcome: string | null;
          created_at: string;
        };
        Insert: {
          couple_id: string;
          goal_text: string;
          month: number;
          year: number;
          proposed_by?: string | null;
          confirmed?: boolean;
          outcome?: string | null;
        };
        Update: {
          goal_text?: string;
          month?: number;
          year?: number;
          proposed_by?: string | null;
          confirmed?: boolean;
          outcome?: string | null;
        };
      };
    };
  };
};

// ─── Couple Code Generation ──────────────────────────────────────────────────────

export function generateCoupleCode(): string {
  const adjectives = ['GRACE', 'FAITH', 'HOPE', 'LOVE', 'PEACE', 'JOY', 'BLESS', 'GROW', 'RISE', 'SHINE'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const num = Math.floor(Math.random() * 10);
  return `${adj}${num}`;
}

// ─── Get Current User's Couple ─────────────────────────────────────────────────────

export async function getCoupleForUser(userId: string) {
  // First try to find in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', userId)
    .single();

  if (profile?.couple_id) {
    const { data: couple } = await supabase
      .from('couples')
      .select('*')
      .eq('id', profile.couple_id)
      .single();
    return { couple, error: null };
  }

  // Try to find by user_id_1 or user_id_2
  const { data: couple } = await supabase
    .from('couples')
    .select('*')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .single();

  return { couple, error: couple ? null : 'No couple found' };
}

// ─── Journal Letters Helpers ─────────────────────────────────────────────────────

export type JournalLetter = Database['public']['Tables']['journal_letters']['Row'];

export async function getLettersForCouple(coupleId: string) {
  const { data, error } = await supabase
    .from('journal_letters')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });
  return { letters: data as JournalLetter[] | null, error };
}

export async function getSpouseLetters(coupleId: string, currentUserId: string) {
  const { data, error } = await supabase
    .from('journal_letters')
    .select('*')
    .eq('couple_id', coupleId)
    .neq('author_user_id', currentUserId)
    .eq('is_private', false)
    .order('created_at', { ascending: false });
  return { letters: data as JournalLetter[] | null, error };
}

export async function sendLetter(coupleId: string, authorUserId: string, text: string, isPrivate: boolean = false) {
  const { data, error } = await supabase
    .from('journal_letters')
    .insert({
      couple_id: coupleId,
      author_user_id: authorUserId,
      text,
      is_private: isPrivate,
    })
    .select()
    .single();
  return { letter: data as JournalLetter | null, error };
}

export async function markLetterAsRead(letterId: string) {
  const { data, error } = await supabase
    .from('journal_letters')
    .update({ read_at: new Date().toISOString() })
    .eq('id', letterId)
    .select()
    .single();
  return { letter: data as JournalLetter | null, error };
}

export async function reactToLetter(letterId: string) {
  // Heart reaction - marks as read
  return markLetterAsRead(letterId);
}

// ─── Time Capsule Helpers ─────────────────────────────────────────────────────

export type TimeCapsule = Database['public']['Tables']['time_capsules']['Row'];

export async function getTimeCapsules(coupleId: string) {
  const { data, error } = await supabase
    .from('time_capsules')
    .select('*')
    .eq('couple_id', coupleId)
    .order('unlock_date', { ascending: true });
  return { capsules: data as TimeCapsule[] | null, error };
}

export async function getUnlockableCapsules(coupleId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('time_capsules')
    .select('*')
    .eq('couple_id', coupleId)
    .lte('unlock_date', today)
    .eq('unlocked', false)
    .order('unlock_date', { ascending: true });
  return { capsules: data as TimeCapsule[] | null, error };
}

export async function createTimeCapsule(coupleId: string, text: string, unlockDate: string) {
  const { data, error } = await supabase
    .from('time_capsules')
    .insert({
      couple_id: coupleId,
      text,
      unlock_date: unlockDate,
      unlocked: false,
    })
    .select()
    .single();
  return { capsule: data as TimeCapsule | null, error };
}

export async function unlockTimeCapsule(capsuleId: string) {
  const { data, error } = await supabase
    .from('time_capsules')
    .update({ unlocked: true })
    .eq('id', capsuleId)
    .select()
    .single();
  return { capsule: data as TimeCapsule | null, error };
}

// Helper to calculate next anniversary (1 year from now)
export function getNextAnniversaryDate(): string {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  return nextYear.toISOString().split('T')[0];
}

// ─── Bucket List Helpers ─────────────────────────────────────────────────────

export type BucketItem = Database['public']['Tables']['bucket_list']['Row'];

export async function getBucketList(coupleId: string) {
  const { data, error } = await supabase
    .from('bucket_list')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });
  return { items: data as BucketItem[] | null, error };
}

export async function addBucketItem(coupleId: string, text: string, category: string, targetDate?: string) {
  const { data, error } = await supabase
    .from('bucket_list')
    .insert({
      couple_id: coupleId,
      text,
      category,
      target_date: targetDate || null,
      completed: false,
    })
    .select()
    .single();
  return { item: data as BucketItem | null, error };
}

export async function completeBucketItem(itemId: string, photoUrl?: string) {
  const { data, error } = await supabase
    .from('bucket_list')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      photo_url: photoUrl || null,
    })
    .eq('id', itemId)
    .select()
    .single();
  return { item: data as BucketItem | null, error };
}

export async function deleteBucketItem(itemId: string) {
  const { error } = await supabase
    .from('bucket_list')
    .delete()
    .eq('id', itemId);
  return { error };
}

// ─── Monthly Goals Helpers ───────────────────────────────────────────────────

export type MonthlyGoal = Database['public']['Tables']['monthly_goals']['Row'];

export async function getMonthlyGoals(coupleId: string) {
  const { data, error } = await supabase
    .from('monthly_goals')
    .select('*')
    .eq('couple_id', coupleId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  return { goals: data as MonthlyGoal[] | null, error };
}

export async function getCurrentMonthGoal(coupleId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  const { data, error } = await supabase
    .from('monthly_goals')
    .select('*')
    .eq('couple_id', coupleId)
    .eq('month', month)
    .eq('year', year)
    .single();
  return { goal: data as MonthlyGoal | null, error };
}

export async function proposeMonthlyGoal(coupleId: string, userId: string, goalText: string, category: string, month: number, year: number) {
  const { data, error } = await supabase
    .from('monthly_goals')
    .insert({
      couple_id: coupleId,
      goal_text: goalText,
      category,
      month,
      year,
      proposed_by: userId,
      confirmed: false,
    })
    .select()
    .single();
  return { goal: data as MonthlyGoal | null, error };
}

export async function confirmMonthlyGoal(goalId: string) {
  const { data, error } = await supabase
    .from('monthly_goals')
    .update({ confirmed: true })
    .eq('id', goalId)
    .select()
    .single();
  return { goal: data as MonthlyGoal | null, error };
}

export async function updateGoalOutcome(goalId: string, outcome: 'achieved' | 'partial' | 'missed') {
  const { data, error } = await supabase
    .from('monthly_goals')
    .update({ outcome })
    .eq('id', goalId)
    .select()
    .single();
  return { goal: data as MonthlyGoal | null, error };
}
