import { SupabaseAdapter } from '@auth/supabase-adapter'
import { type NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import nodemailer from 'nodemailer'
import { logAuthValidation } from './auth-validation'

// Validate auth configuration on startup
if (process.env.NODE_ENV === 'development') {
  logAuthValidation()
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        secure: process.env.EMAIL_SERVER_SECURE === 'true' || false, // Use TLS
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
        // Generate a more secure token using crypto
        return crypto.randomUUID().replace(/-/g, '')
      },
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const { host } = new URL(url)
        
        // Validate required environment variables
        if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
          console.error('Email authentication failed: Missing EMAIL_SERVER_USER or EMAIL_SERVER_PASSWORD')
          throw new Error('Email configuration incomplete')
        }
        
        const transporter = nodemailer.createTransporter({
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
          // Provide more specific error information
          if (error instanceof Error) {
            throw new Error(`Email delivery failed: ${error.message}`)
          }
          throw new Error('Failed to send verification email')
        }
      },
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      if (account) {
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.id as string
        // Add provider info to session for debugging
        if (process.env.NODE_ENV === 'development') {
          ;(session as any).provider = token.provider
        }
      }
      return session
    },
    async signIn({ user, account, email }) {
      // Add validation for email provider
      if (account?.provider === 'email') {
        if (!user.email) {
          console.error('Email sign-in attempted without email address')
          return false
        }
      }
      return true
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
}