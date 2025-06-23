import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// Database types (to be updated based on your schema)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          profile_image?: string;
          email_verified: boolean;
          kyc_status: 'pending' | 'verified' | 'rejected';
          onboarding_complete: boolean;
          biometric_enabled: boolean;
          phone_number?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          profile_image?: string;
          email_verified?: boolean;
          kyc_status?: 'pending' | 'verified' | 'rejected';
          onboarding_complete?: boolean;
          biometric_enabled?: boolean;
          phone_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          profile_image?: string;
          email_verified?: boolean;
          kyc_status?: 'pending' | 'verified' | 'rejected';
          onboarding_complete?: boolean;
          biometric_enabled?: boolean;
          phone_number?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}