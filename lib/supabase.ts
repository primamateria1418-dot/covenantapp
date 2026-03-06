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
