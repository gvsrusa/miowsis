import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthError, Provider } from '@supabase/supabase-js'
import type { UserRole } from './rbac'

// Types for our authentication system
export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role: UserRole
  email_confirmed_at?: string
  created_at: string
  updated_at: string
}

export interface AuthSession {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface SignInResult {
  user?: AuthUser
  session?: AuthSession
  error?: AuthError
}

export interface SignUpResult {
  user?: User
  session?: Session
  error?: AuthError
}

// Client-side authentication service
export class SupabaseAuthService {
  private supabase = createClient()

  // Sign in with email and password
  async signInWithPassword(email: string, password: string): Promise<SignInResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error.message)
        return { error }
      }

      if (data.user && data.session) {
        const authUser = await this.enrichUserWithProfile(data.user)
        return {
          user: authUser,
          session: {
            user: authUser,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at || 0
          }
        }
      }

      return { error: { message: 'Invalid response from server' } as AuthError }
    } catch (err) {
      console.error('Sign in exception:', err)
      return { error: { message: 'Authentication failed' } as AuthError }
    }
  }

  // Sign up with email and password
  async signUpWithPassword(email: string, password: string, name?: string): Promise<SignUpResult> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          }
        }
      })

      if (error) {
        console.error('Sign up error:', error.message)
        return { error }
      }

      return { user: data.user, session: data.session }
    } catch (err) {
      console.error('Sign up exception:', err)
      return { error: { message: 'Registration failed' } as AuthError }
    }
  }

  // Sign in with OAuth provider (Google)
  async signInWithOAuth(provider: Provider, redirectTo?: string): Promise<{ error?: AuthError }> {
    try {
      // Create callback URL with the final destination in the state parameter
      const callbackUrl = new URL(`${window.location.origin}/auth/callback`)
      if (redirectTo) {
        callbackUrl.searchParams.set('state', redirectTo)
      }

      const { error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
        }
      })

      if (error) {
        console.error('OAuth sign in error:', error.message)
        return { error }
      }

      return {}
    } catch (err) {
      console.error('OAuth sign in exception:', err)
      return { error: { message: 'OAuth authentication failed' } as AuthError }
    }
  }

  // Sign out
  async signOut(): Promise<{ error?: AuthError }> {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error.message)
        return { error }
      }
      return {}
    } catch (err) {
      console.error('Sign out exception:', err)
      return { error: { message: 'Sign out failed' } as AuthError }
    }
  }

  // Get current session
  async getSession(): Promise<{ session?: AuthSession, error?: AuthError }> {
    try {
      const { data, error } = await this.supabase.auth.getSession()
      
      if (error) {
        console.error('Get session error:', error.message)
        return { error }
      }

      if (data.session) {
        const authUser = await this.enrichUserWithProfile(data.session.user)
        return {
          session: {
            user: authUser,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at || 0
          }
        }
      }

      return {}
    } catch (err) {
      console.error('Get session exception:', err)
      return { error: { message: 'Failed to get session' } as AuthError }
    }
  }

  // Get current user
  async getCurrentUser(): Promise<{ user?: AuthUser, error?: AuthError }> {
    try {
      const { data, error } = await this.supabase.auth.getUser()
      
      if (error) {
        console.error('Get user error:', error.message)
        return { error }
      }

      if (data.user) {
        const authUser = await this.enrichUserWithProfile(data.user)
        return { user: authUser }
      }

      return {}
    } catch (err) {
      console.error('Get user exception:', err)
      return { error: { message: 'Failed to get user' } as AuthError }
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<{ error?: AuthError }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        console.error('Reset password error:', error.message)
        return { error }
      }

      return {}
    } catch (err) {
      console.error('Reset password exception:', err)
      return { error: { message: 'Password reset failed' } as AuthError }
    }
  }

  // Update password
  async updatePassword(password: string): Promise<{ error?: AuthError }> {
    try {
      const { error } = await this.supabase.auth.updateUser({ password })

      if (error) {
        console.error('Update password error:', error.message)
        return { error }
      }

      return {}
    } catch (err) {
      console.error('Update password exception:', err)
      return { error: { message: 'Password update failed' } as AuthError }
    }
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (session: AuthSession | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (session) {
        const authUser = await this.enrichUserWithProfile(session.user)
        callback({
          user: authUser,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || 0
        })
      } else {
        callback(null)
      }
    })
  }

  // Private helper to enrich user with profile data
  private async enrichUserWithProfile(user: User): Promise<AuthUser> {
    try {
      // Get user profile from profiles table
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('role, name, avatar_url')
        .eq('id', user.id)
        .single()

      return {
        id: user.id,
        email: user.email || '',
        name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || '',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
        role: profile?.role || 'user',
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    } catch (err) {
      console.error('Error enriching user profile:', err)
      // Return basic user data if profile fetch fails
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || '',
        avatar_url: user.user_metadata?.avatar_url,
        role: 'user' as UserRole,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    }
  }
}

// Export singleton instances
export const authService = new SupabaseAuthService()

// Note: Server-side authentication service moved to separate file to avoid client/server bundling issues

// Helper functions for backward compatibility
export async function getCurrentUser() {
  return authService.getCurrentUser()
}

export async function getSession() {
  return authService.getSession()
}

export async function signOut() {
  return authService.signOut()
}