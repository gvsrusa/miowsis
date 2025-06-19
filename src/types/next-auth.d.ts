import { DefaultSession } from 'next-auth'
import type { UserRole } from '@/lib/rbac'

declare module 'next-auth' {
  interface User {
    id: string
  }

  interface Session {
    user: {
      id: string
      role?: UserRole | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email?: string | null
    role?: UserRole | null
    provider?: string
  }
}