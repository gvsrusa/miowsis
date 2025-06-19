import { SupabaseAdapter } from '@auth/supabase-adapter'
import { type NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import nodemailer from 'nodemailer'
import { logAuthValidation } from './auth-validation'
import { getUserRole } from './rbac'
import type { UserRole } from './rbac'

// Validate auth configuration on startup
if (process.env.NODE_ENV === 'development') {
  logAuthValidation()
}

// Helper functions to check if credentials are properly configured
function isValidCredential(value: string | undefined): boolean {
  return !!(value && value !== 'placeholder' && !value.includes('placeholder') && value.length > 10)
}

function hasValidGoogleCredentials(): boolean {
  return isValidCredential(process.env.GOOGLE_CLIENT_ID) && 
         isValidCredential(process.env.GOOGLE_CLIENT_SECRET)
}

function hasValidEmailCredentials(): boolean {
  // For email, check specific requirements since "resend" is a valid username
  const hasUser = !!(process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_USER.length > 0)
  const hasPassword = isValidCredential(process.env.EMAIL_SERVER_PASSWORD)
  const hasHost = !!(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_HOST.length > 0)
  return hasUser && hasPassword && hasHost
}

function hasValidSupabaseCredentials(): boolean {
  return isValidCredential(process.env.NEXT_PUBLIC_SUPABASE_URL) && 
         isValidCredential(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// Build providers array conditionally based on available credentials
const providers = []

// Add Google provider only if credentials are available
if (hasValidGoogleCredentials()) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code'
      }
    },
    // Ensure profile data is properly mapped
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      }
    },
  }))
  console.log('✅ Google OAuth provider enabled')
} else {
  console.log('⚠️  Google OAuth provider disabled - missing or invalid credentials')
}

// Add Email provider only if credentials are available
if (hasValidEmailCredentials()) {
  providers.push(EmailProvider({
    server: {
      host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: process.env.EMAIL_SERVER_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_SERVER_USER!,
        pass: process.env.EMAIL_SERVER_PASSWORD!,
      },
      tls: {
        rejectUnauthorized: false, // For development only
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@miowsis.com',
    maxAge: 24 * 60 * 60, // 24 hours
    generateVerificationToken: () => {
      // Use globalThis.crypto for Edge Runtime compatibility
      return globalThis.crypto.randomUUID().replace(/-/g, '')
    },
    sendVerificationRequest: async ({ identifier: email, url }) => {
      const { host } = new URL(url)
      
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        secure: process.env.EMAIL_SERVER_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      })

      try {
        const result = await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@miowsis.com',
          to: email,
          subject: `Sign in to ${host}`,
          text: `Sign in to ${host}\n${url}\n\nIf you did not request this email you can safely ignore it.`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
              <h2 style="color: #333; text-align: center;">Sign in to ${host}</h2>
              <p style="color: #666; font-size: 16px;">Click the button below to sign in to your account:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign In</a>
              </div>
              <p style="color: #999; font-size: 14px;">If you did not request this email you can safely ignore it.</p>
              <p style="color: #999; font-size: 14px;">This link will expire in 24 hours.</p>
            </div>
          `,
        })
        
        console.log('Verification email sent successfully:', result.messageId)
      } catch (error) {
        console.error('Failed to send verification email:', error)
        if (error instanceof Error) {
          throw new Error(`Email delivery failed: ${error.message}`)
        }
        throw new Error('Failed to send verification email')
      }
    },
  }))
  console.log('✅ Email provider enabled')
} else {
  console.log('⚠️  Email provider disabled - missing or invalid credentials')
}

// Warn if no providers are available
if (providers.length === 0) {
  console.error('❌ No authentication providers available! Please configure at least one provider.')
}

export const authOptions: NextAuthOptions = {
  providers,
  // Only use Supabase adapter if credentials are available
  ...(hasValidSupabaseCredentials() ? {
    adapter: SupabaseAdapter({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    })
  } : {}),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        // Fetch user role when user signs in
        const role = await getUserRole(user.id)
        token.role = role
      }
      if (account) {
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        // Add provider info to session for debugging
        if (process.env.NODE_ENV === 'development') {
          ;(session as any).provider = token.provider
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      try {
        // Add validation for email provider
        if (account?.provider === 'email') {
          if (!user.email) {
            console.error('Email sign-in attempted without email address')
            return false
          }
        }
        
        // Add validation for OAuth providers
        if (account?.provider === 'google') {
          if (!user.email) {
            console.error('Google sign-in attempted without email address')
            return false
          }
          // Log OAuth callback for debugging
          console.log('Google OAuth sign-in:', {
            email: user.email,
            provider: account.provider,
            accountId: account.providerAccountId
          })
        }
        
        return true
      } catch (error) {
        console.error('Error during sign-in callback:', error)
        return false
      }
    },
    async redirect({ url, baseUrl }) {
      // Ensure redirects are to the same site
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/onboarding',
  },
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('Sign-in event:', {
        userId: user?.id,
        provider: account?.provider,
        isNewUser,
        timestamp: new Date().toISOString()
      })
    },
    async signOut({ session, token }) {
      console.log('Sign-out event:', {
        userId: token?.id || session?.user?.id,
        timestamp: new Date().toISOString()
      })
    },
    async linkAccount({ user, account, profile }) {
      console.log('Account linked:', {
        userId: user.id,
        provider: account.provider,
        timestamp: new Date().toISOString()
      })
    },
    async session({ session, token }) {
      // Can be used for session tracking
    },
  },
}