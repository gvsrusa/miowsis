'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authService, type AuthUser, type AuthSession } from '@/lib/auth-supabase'
import type { AuthError } from '@supabase/supabase-js'

interface AuthContextType {
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: AuthError }>
  signInWithGoogle: (redirectTo?: string) => Promise<{ error?: AuthError }>
  signOut: () => Promise<{ error?: AuthError }>
  resetPassword: (email: string) => Promise<{ error?: AuthError }>
  updatePassword: (password: string) => Promise<{ error?: AuthError }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session: initialSession, error } = await authService.getSession()
        if (error) {
          console.error('Error getting initial session:', error.message)
        } else if (initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
        }
      } catch (err) {
        console.error('Exception getting initial session:', err)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange((newSession) => {
      setSession(newSession)
      setUser(newSession?.user || null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await authService.signInWithPassword(email, password)
      if (result.error) {
        return { error: result.error }
      }
      // State will be updated by onAuthStateChange
      return {}
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true)
    try {
      const result = await authService.signUpWithPassword(email, password, name)
      if (result.error) {
        return { error: result.error }
      }
      // For signup, user typically needs to confirm email first
      // State will be updated by onAuthStateChange once confirmed
      return {}
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    setLoading(true)
    try {
      const result = await authService.signInWithOAuth('google', redirectTo)
      if (result.error) {
        return { error: result.error }
      }
      // OAuth redirect will handle the rest
      return {}
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const result = await authService.signOut()
      if (result.error) {
        return { error: result.error }
      }
      // State will be updated by onAuthStateChange
      return {}
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    return authService.resetPassword(email)
  }

  const updatePassword = async (password: string) => {
    return authService.updatePassword(password)
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Backward compatibility hook that mimics NextAuth's useSession
export function useSession() {
  const { user, session, loading } = useAuth()
  
  return {
    data: session ? {
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        image: user?.avatar_url,
        role: user?.role,
      },
      expires: new Date(session.expires_at * 1000).toISOString(),
    } : null,
    status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated'
  }
}

// Additional helper hooks
export function useUser() {
  const { user } = useAuth()
  return user
}

export function useAuthLoading() {
  const { loading } = useAuth()
  return loading
}