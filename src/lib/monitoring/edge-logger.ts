// Edge Runtime compatible logger
// This is a simplified logger that can be used in Edge Runtime environments

const isDevelopment = process.env.NODE_ENV === 'development'

// Simple log function that works in Edge Runtime
const log = (level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: Record<string, any>) => {
  const timestamp = new Date().toISOString()
  const logData = {
    timestamp,
    level,
    message,
    ...context
  }

  // In production, you could send this to an external logging service
  // For now, we'll just use console methods
  switch (level) {
    case 'error':
      console.error(`[${timestamp}] ERROR:`, message, context || '')
      break
    case 'warn':
      console.warn(`[${timestamp}] WARN:`, message, context || '')
      break
    case 'info':
      if (isDevelopment) {
        console.info(`[${timestamp}] INFO:`, message, context || '')
      }
      break
    case 'debug':
      if (isDevelopment) {
        console.debug(`[${timestamp}] DEBUG:`, message, context || '')
      }
      break
  }
}

export const logError = (error: Error | string, context?: Record<string, any>) => {
  const message = error instanceof Error ? error.message : error
  const errorContext = error instanceof Error ? { stack: error.stack, ...context } : context
  log('error', message, errorContext)
}

export const logWarn = (message: string, context?: Record<string, any>) => {
  log('warn', message, context)
}

export const logInfo = (message: string, context?: Record<string, any>) => {
  log('info', message, context)
}

export const logDebug = (message: string, context?: Record<string, any>) => {
  log('debug', message, context)
}

// For compatibility with the full logger
export const logPerformance = (
  operation: string,
  duration: number,
  context?: Record<string, any>
) => {
  log('info', `Performance: ${operation}`, { duration, ...context })
}

export const logSecurity = (
  event: string,
  userId?: string,
  context?: Record<string, any>
) => {
  log('warn', `Security: ${event}`, { userId, type: 'security', ...context })
}

export const logAudit = (
  action: string,
  userId: string,
  resource: string,
  context?: Record<string, any>
) => {
  log('info', `Audit: ${action}`, { userId, resource, type: 'audit', ...context })
}