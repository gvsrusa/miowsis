import { useSession, signIn, signOut } from 'next-auth/react'
import { useCallback } from 'react'

export function useAuth() {
  const { data: session, status } = useSession()

  const login = useCallback(
    async (provider?: string) => {
      try {
        await signIn(provider || 'google', {
          callbackUrl: '/dashboard',
        })
      } catch (error) {
        console.error('Login error:', error)
      }
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      await signOut({
        callbackUrl: '/',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [])

  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'

  return {
    user: session?.user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  }
}