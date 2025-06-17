import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

interface RequestMetrics {
  id: string;
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  size?: number;
  cache?: boolean;
  error?: string;
  tags?: string[];
}

interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  totalDataTransferred: number;
  cacheHitRate: number;
  errorRate: number;
  requestsPerMinute: number;
}

interface EndpointStats {
  endpoint: string;
  count: number;
  averageTime: number;
  errorCount: number;
  cacheHitCount: number;
}

/**
 * API Performance Monitor
 * Tracks and analyzes API call performance
 */
export class PerformanceMonitor {
  private metrics: Map<string, RequestMetrics> = new Map();
  private history: RequestMetrics[] = [];
  private maxHistorySize = 1000;
  private listeners: Array<(metrics: RequestMetrics) => void> = [];

  constructor() {
    // Setup performance observer if available
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }
  }

  /**
   * Start tracking a request
   */
  startRequest(config: AxiosRequestConfig): string {
    const id = config.headers?.['X-Request-ID'] || crypto.randomUUID();
    
    const metrics: RequestMetrics = {
      id,
      url: config.url || '',
      method: config.method || 'GET',
      startTime: performance.now(),
      tags: this.extractTags(config)
    };

    this.metrics.set(id, metrics);
    return id;
  }

  /**
   * End tracking a successful request
   */
  endRequest(
    id: string,
    response: AxiosResponse,
    fromCache = false
  ): void {
    const metrics = this.metrics.get(id);
    if (!metrics) return;

    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.status = response.status;
    metrics.size = this.calculateResponseSize(response);
    metrics.cache = fromCache;

    this.finalizeMetrics(metrics);
  }

  /**
   * End tracking a failed request
   */
  endRequestWithError(
    id: string,
    error: AxiosError
  ): void {
    const metrics = this.metrics.get(id);
    if (!metrics) return;

    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.status = error.response?.status || 0;
    metrics.error = error.message;

    this.finalizeMetrics(metrics);
  }

  /**
   * Finalize and store metrics
   */
  private finalizeMetrics(metrics: RequestMetrics): void {
    this.metrics.delete(metrics.id);
    this.history.push(metrics);

    // Maintain history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(metrics));

    // Send to analytics if configured
    this.sendToAnalytics(metrics);
  }

  /**
   * Calculate response size
   */
  private calculateResponseSize(response: AxiosResponse): number {
    try {
      const contentLength = response.headers?.['content-length'];
      if (contentLength) {
        return parseInt(contentLength, 10);
      }

      // Estimate size from data
      const data = response.data;
      if (typeof data === 'string') {
        return new Blob([data]).size;
      } else if (data) {
        return new Blob([JSON.stringify(data)]).size;
      }
    } catch {
      // Ignore size calculation errors
    }
    return 0;
  }

  /**
   * Extract tags from request config
   */
  private extractTags(config: AxiosRequestConfig): string[] {
    const tags: string[] = [];
    const url = config.url || '';

    // Service tags
    if (url.includes('/portfolio')) tags.push('portfolio');
    if (url.includes('/trading')) tags.push('trading');
    if (url.includes('/esg')) tags.push('esg');
    if (url.includes('/ai')) tags.push('ai');
    if (url.includes('/auth')) tags.push('auth');

    // Operation tags
    if (config.method === 'GET') tags.push('read');
    if (['POST', 'PUT', 'PATCH'].includes(config.method || '')) tags.push('write');
    if (config.method === 'DELETE') tags.push('delete');

    return tags;
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow?: number): PerformanceStats {
    const now = performance.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    
    const relevantMetrics = this.history.filter(
      m => m.startTime >= windowStart
    );

    if (relevantMetrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        totalDataTransferred: 0,
        cacheHitRate: 0,
        errorRate: 0,
        requestsPerMinute: 0
      };
    }

    const successfulRequests = relevantMetrics.filter(
      m => m.status && m.status >= 200 && m.status < 300
    );
    
    const failedRequests = relevantMetrics.filter(
      m => !m.status || m.status >= 400
    );

    const durations = relevantMetrics
      .filter(m => m.duration)
      .map(m => m.duration!)
      .sort((a, b) => a - b);

    const totalDataTransferred = relevantMetrics.reduce(
      (sum, m) => sum + (m.size || 0), 0
    );

    const cacheHits = relevantMetrics.filter(m => m.cache).length;

    const timeRange = (now - relevantMetrics[0].startTime) / 60000; // minutes

    return {
      totalRequests: relevantMetrics.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      averageResponseTime: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      p95ResponseTime: this.percentile(durations, 0.95),
      p99ResponseTime: this.percentile(durations, 0.99),
      totalDataTransferred,
      cacheHitRate: relevantMetrics.length > 0
        ? (cacheHits / relevantMetrics.length) * 100
        : 0,
      errorRate: relevantMetrics.length > 0
        ? (failedRequests.length / relevantMetrics.length) * 100
        : 0,
      requestsPerMinute: timeRange > 0
        ? relevantMetrics.length / timeRange
        : 0
    };
  }

  /**
   * Get statistics by endpoint
   */
  getEndpointStats(): EndpointStats[] {
    const endpointMap = new Map<string, {
      count: number;
      totalTime: number;
      errorCount: number;
      cacheHitCount: number;
    }>();

    this.history.forEach(metrics => {
      const endpoint = this.normalizeEndpoint(metrics.url);
      const stats = endpointMap.get(endpoint) || {
        count: 0,
        totalTime: 0,
        errorCount: 0,
        cacheHitCount: 0
      };

      stats.count++;
      stats.totalTime += metrics.duration || 0;
      
      if (metrics.error || (metrics.status && metrics.status >= 400)) {
        stats.errorCount++;
      }
      
      if (metrics.cache) {
        stats.cacheHitCount++;
      }

      endpointMap.set(endpoint, stats);
    });

    return Array.from(endpointMap.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        averageTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
        errorCount: stats.errorCount,
        cacheHitCount: stats.cacheHitCount
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get slow requests
   */
  getSlowRequests(threshold = 1000): RequestMetrics[] {
    return this.history
      .filter(m => m.duration && m.duration > threshold)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);
  }

  /**
   * Get failed requests
   */
  getFailedRequests(): RequestMetrics[] {
    return this.history
      .filter(m => m.error || (m.status && m.status >= 400))
      .slice(-20);
  }

  /**
   * Add a listener for metrics
   */
  addListener(listener: (metrics: RequestMetrics) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil(values.length * p) - 1;
    return values[Math.min(index, values.length - 1)];
  }

  /**
   * Normalize endpoint for grouping
   */
  private normalizeEndpoint(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      // Remove query params and IDs
      return urlObj.pathname
        .replace(/\/\d+/g, '/:id')
        .replace(/\/[a-f0-9-]{36}/g, '/:uuid');
    } catch {
      return url;
    }
  }

  /**
   * Setup performance observer
   */
  private setupPerformanceObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && 
              entry.name.includes('/api/')) {
            // Additional performance data
            console.debug('Resource timing:', {
              url: entry.name,
              duration: entry.duration,
              transferSize: (entry as any).transferSize,
              decodedBodySize: (entry as any).decodedBodySize
            });
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.debug('Performance observer not available');
    }
  }

  /**
   * Send metrics to analytics
   */
  private sendToAnalytics(metrics: RequestMetrics): void {
    // Only send aggregated data periodically
    if (Math.random() < 0.01) { // 1% sampling
      // Send to analytics service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'api_request', {
          event_category: 'performance',
          event_label: this.normalizeEndpoint(metrics.url),
          value: Math.round(metrics.duration || 0)
        });
      }
    }
  }

  /**
   * Export metrics for debugging
   */
  exportMetrics(): {
    history: RequestMetrics[];
    stats: PerformanceStats;
    endpoints: EndpointStats[];
  } {
    return {
      history: this.history,
      stats: this.getStats(),
      endpoints: this.getEndpointStats()
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.history = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Console utilities for debugging
if (typeof window !== 'undefined') {
  (window as any).apiPerformance = {
    getStats: () => performanceMonitor.getStats(),
    getEndpoints: () => performanceMonitor.getEndpointStats(),
    getSlowRequests: () => performanceMonitor.getSlowRequests(),
    getFailedRequests: () => performanceMonitor.getFailedRequests(),
    exportMetrics: () => performanceMonitor.exportMetrics()
  };
}