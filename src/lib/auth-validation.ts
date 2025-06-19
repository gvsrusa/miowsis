/**
 * Authentication configuration validation utility
 * Validates that all required environment variables are properly set
 */

export interface AuthValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateAuthConfiguration(): AuthValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required environment variables
  const requiredVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (!value || value.includes('placeholder')) {
      errors.push(`Missing or invalid ${varName}`)
    }
  }

  // Email provider validation
  const emailVars = [
    'EMAIL_SERVER_USER',
    'EMAIL_SERVER_PASSWORD',
    'EMAIL_SERVER_HOST',
    'EMAIL_FROM'
  ]

  let emailConfigured = true
  for (const varName of emailVars) {
    const value = process.env[varName]
    if (!value || value.includes('placeholder')) {
      emailConfigured = false
      warnings.push(`Email provider: Missing or invalid ${varName}`)
    }
  }

  // OAuth provider validation
  const googleVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
  let googleConfigured = true
  for (const varName of googleVars) {
    const value = process.env[varName]
    if (!value || value.includes('placeholder')) {
      googleConfigured = false
      warnings.push(`Google OAuth: Missing or invalid ${varName}`)
    }
  }

  if (!emailConfigured && !googleConfigured) {
    errors.push('No authentication providers are properly configured')
  }

  // NEXTAUTH_SECRET validation
  const nextAuthSecret = process.env.NEXTAUTH_SECRET
  if (nextAuthSecret && nextAuthSecret.length < 32) {
    warnings.push('NEXTAUTH_SECRET should be at least 32 characters long for security')
  }

  // URL validation
  const nextAuthUrl = process.env.NEXTAUTH_URL
  if (nextAuthUrl && !nextAuthUrl.startsWith('http')) {
    errors.push('NEXTAUTH_URL must be a valid URL starting with http:// or https://')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function logAuthValidation(): void {
  const validation = validateAuthConfiguration()
  
  if (!validation.isValid) {
    console.error('🚨 Authentication Configuration Errors:')
    validation.errors.forEach(error => console.error(`  ❌ ${error}`))
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Authentication Configuration Warnings:')
    validation.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`))
  }

  if (validation.isValid && validation.warnings.length === 0) {
    console.log('✅ Authentication configuration is valid')
  }
}