import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a Registry
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// HTTP metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Database metrics
export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const databaseConnectionErrors = new Counter({
  name: 'database_connection_errors_total',
  help: 'Total number of database connection errors',
  registers: [register],
});

export const databaseConnectionPool = new Gauge({
  name: 'database_connection_pool_size',
  help: 'Current size of the database connection pool',
  labelNames: ['state'],
  registers: [register],
});

// Authentication metrics
export const authAttempts = new Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['method', 'status'],
  registers: [register],
});

export const authFailures = new Counter({
  name: 'auth_failures_total',
  help: 'Total number of authentication failures',
  labelNames: ['method', 'reason'],
  registers: [register],
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  registers: [register],
});

// Business metrics
export const portfolioCreations = new Counter({
  name: 'portfolio_creations_total',
  help: 'Total number of portfolios created',
  registers: [register],
});

export const transactionVolume = new Counter({
  name: 'transaction_volume_total',
  help: 'Total transaction volume in USD',
  labelNames: ['type'],
  registers: [register],
});

export const portfolioValue = new Gauge({
  name: 'portfolio_value_total',
  help: 'Total value of all portfolios in USD',
  registers: [register],
});

// AI Assistant metrics
export const aiAssistantRequests = new Counter({
  name: 'ai_assistant_requests_total',
  help: 'Total number of AI assistant requests',
  labelNames: ['type'],
  registers: [register],
});

export const aiAssistantResponseTime = new Histogram({
  name: 'ai_assistant_response_time_seconds',
  help: 'Response time of AI assistant in seconds',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Error tracking
export const applicationErrors = new Counter({
  name: 'application_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'severity'],
  registers: [register],
});

// Helper functions
export const recordHttpRequest = (
  method: string,
  path: string,
  status: number,
  duration: number
) => {
  httpRequestsTotal.labels(method, path, status.toString()).inc();
  httpRequestDuration.labels(method, path, status.toString()).observe(duration);
};

export const recordDatabaseQuery = (
  operation: string,
  table: string,
  duration: number
) => {
  databaseQueryDuration.labels(operation, table).observe(duration);
};

export const recordAuthAttempt = (method: string, success: boolean) => {
  authAttempts.labels(method, success ? 'success' : 'failure').inc();
  if (!success) {
    authFailures.labels(method, 'invalid_credentials').inc();
  }
};

export const recordError = (type: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
  applicationErrors.labels(type, severity).inc();
};

// Middleware for automatic HTTP metrics collection
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const path = req.route?.path || req.path || 'unknown';
    recordHttpRequest(req.method, path, res.statusCode, duration);
  });
  
  next();
};