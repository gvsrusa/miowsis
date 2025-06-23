import { supabase } from '../config/supabase';
import type { User as SupabaseUser, AuthResponse as SupabaseAuthResponse, AuthError } from '@supabase/supabase-js';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  emailVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  onboardingComplete: boolean;
  biometricEnabled: boolean;
  phoneNumber?: string;
}

export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at?: number;
  };
}

class SupabaseAuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Authentication failed');
      }

      // Get or create user profile
      const userProfile = await this.getOrCreateUserProfile(data.user);

      return {
        user: userProfile,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone_number: userData.phoneNumber,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Registration failed');
      }

      // Create user profile in the database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone_number: userData.phoneNumber,
          email_verified: data.user.email_confirmed_at ? true : false,
          kyc_status: 'pending',
          onboarding_complete: false,
          biometric_enabled: false,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw here, as the user was created successfully
      }

      const userProfile: User = profileData ? this.mapProfileToUser(profileData) : {
        id: data.user.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailVerified: data.user.email_confirmed_at ? true : false,
        kycStatus: 'pending',
        onboardingComplete: false,
        biometricEnabled: false,
        phoneNumber: userData.phoneNumber,
      };

      // If there's a session (email confirmation not required)
      if (data.session) {
        return {
          user: userProfile,
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_in: data.session.expires_in,
            expires_at: data.session.expires_at,
          },
        };
      }

      // If email confirmation is required, return response with empty session
      throw new Error('Please check your email to confirm your account');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get current user session
   */
  async getCurrentSession(): Promise<AuthResponse | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        return null;
      }

      const userProfile = await this.getOrCreateUserProfile(session.user);

      return {
        user: userProfile,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          expires_at: session.expires_at,
        },
      };
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<AuthResponse | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session?.user) {
        return null;
      }

      const userProfile = await this.getOrCreateUserProfile(data.session.user);

      return {
        user: userProfile,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at,
        },
      };
    } catch (error) {
      console.error('Refresh session error:', error);
      return null;
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<User>): Promise<User> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update auth metadata if needed
      const authUpdates: any = {};
      if (updates.firstName) authUpdates.first_name = updates.firstName;
      if (updates.lastName) authUpdates.last_name = updates.lastName;
      if (updates.phoneNumber) authUpdates.phone_number = updates.phoneNumber;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({
          data: authUpdates,
        });

        if (authError) {
          console.error('Auth update error:', authError);
        }
      }

      // Update profile table
      const profileUpdates: any = {};
      if (updates.firstName) profileUpdates.first_name = updates.firstName;
      if (updates.lastName) profileUpdates.last_name = updates.lastName;
      if (updates.phoneNumber) profileUpdates.phone_number = updates.phoneNumber;
      if (updates.profileImage !== undefined) profileUpdates.profile_image = updates.profileImage;
      if (updates.kycStatus) profileUpdates.kyc_status = updates.kycStatus;
      if (updates.onboardingComplete !== undefined) profileUpdates.onboarding_complete = updates.onboardingComplete;
      if (updates.biometricEnabled !== undefined) profileUpdates.biometric_enabled = updates.biometricEnabled;

      if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Profile update error:', error);
          throw new Error('Failed to update profile');
        }

        return this.mapProfileToUser(data);
      }

      // If no updates to profile table, return current profile
      return await this.getOrCreateUserProfile(user);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Get or create user profile from Supabase user
   */
  async getOrCreateUserProfile(supabaseUser: SupabaseUser): Promise<User> {
    try {
      // Try to get existing profile
      const { data: existingProfile, error: getError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (existingProfile && !getError) {
        return this.mapProfileToUser(existingProfile);
      }

      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          first_name: supabaseUser.user_metadata?.first_name || '',
          last_name: supabaseUser.user_metadata?.last_name || '',
          phone_number: supabaseUser.user_metadata?.phone_number,
          email_verified: supabaseUser.email_confirmed_at ? true : false,
          kyc_status: 'pending',
          onboarding_complete: false,
          biometric_enabled: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        // Return a fallback user object
        return {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          firstName: supabaseUser.user_metadata?.first_name || '',
          lastName: supabaseUser.user_metadata?.last_name || '',
          emailVerified: supabaseUser.email_confirmed_at ? true : false,
          kycStatus: 'pending',
          onboardingComplete: false,
          biometricEnabled: false,
          phoneNumber: supabaseUser.user_metadata?.phone_number,
        };
      }

      return this.mapProfileToUser(newProfile);
    } catch (error) {
      console.error('Get or create profile error:', error);
      // Return a fallback user object
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: supabaseUser.user_metadata?.first_name || '',
        lastName: supabaseUser.user_metadata?.last_name || '',
        emailVerified: supabaseUser.email_confirmed_at ? true : false,
        kycStatus: 'pending',
        onboardingComplete: false,
        biometricEnabled: false,
        phoneNumber: supabaseUser.user_metadata?.phone_number,
      };
    }
  }

  /**
   * Map database profile to User interface
   */
  mapProfileToUser(profile: any): User {
    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      profileImage: profile.profile_image,
      emailVerified: profile.email_verified,
      kycStatus: profile.kyc_status,
      onboardingComplete: profile.onboarding_complete,
      biometricEnabled: profile.biometric_enabled,
      phoneNumber: profile.phone_number,
    };
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const supabaseAuthService = new SupabaseAuthService();