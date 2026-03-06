import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

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
        };
        Insert: {
          id: string;
          name: string;
          spouse_name?: string | null;
          wedding_date?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          name?: string;
          spouse_name?: string | null;
          wedding_date?: string | null;
          avatar_url?: string | null;
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
