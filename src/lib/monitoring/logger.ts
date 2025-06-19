import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Format for development
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Format for production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: isDevelopment ? devFormat : prodFormat,
  }),
];

// Add file transports in production
if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Add Google Cloud Logging if configured
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    transports.push(new LoggingWinston());
  }
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  levels,
  transports,
  exitOnError: false,
});

// Create a stream for Morgan HTTP logging
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  logger.info({
    message,
    ...context,
  });
};

export const logWarn = (message: string, context?: Record<string, any>) => {
  logger.warn({
    message,
    ...context,
  });
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  logger.debug({
    message,
    ...context,
  });
};

// Performance logging
export const logPerformance = (
  operation: string,
  duration: number,
  context?: Record<string, any>
) => {
  logger.info({
    message: `Performance: ${operation}`,
    duration,
    ...context,
  });
};

// Security logging
export const logSecurity = (
  event: string,
  userId?: string,
  context?: Record<string, any>
) => {
  logger.warn({
    message: `Security: ${event}`,
    userId,
    type: 'security',
    ...context,
  });
};

// Audit logging
export const logAudit = (
  action: string,
  userId: string,
  resource: string,
  context?: Record<string, any>
) => {
  logger.info({
    message: `Audit: ${action}`,
    userId,
    resource,
    type: 'audit',
    ...context,
  });
};

export default logger;