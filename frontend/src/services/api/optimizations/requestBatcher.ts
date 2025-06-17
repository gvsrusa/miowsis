import { AxiosRequestConfig } from 'axios';
import { api } from '../apiClient';

interface BatchRequest {
  id: string;
  config: AxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

interface BatchConfig {
  maxBatchSize: number;
  batchDelay: number;
  endpoint: string;
}

/**
 * Request Batcher
 * Batches multiple API requests into single calls
 */
export class RequestBatcher {
  private queue: Map<string, BatchRequest[]> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private configs: Map<string, BatchConfig> = new Map();

  constructor() {
    // Configure batch endpoints
    this.configs.set('portfolio', {
      maxBatchSize: 10,
      batchDelay: 50,
      endpoint: '/api/batch/portfolio'
    });

    this.configs.set('market', {
      maxBatchSize: 20,
      batchDelay: 100,
      endpoint: '/api/batch/market'
    });

    this.configs.set('esg', {
      maxBatchSize: 15,
      batchDelay: 75,
      endpoint: '/api/batch/esg'
    });
  }

  /**
   * Add a request to the batch queue
   */
  batch<T>(
    batchKey: string,
    config: AxiosRequestConfig
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const batchConfig = this.configs.get(batchKey);
      if (!batchConfig) {
        // If no batch config, execute immediately
        api.get<T>(config.url!, config)
          .then(resolve)
          .catch(reject);
        return;
      }

      const request: BatchRequest = {
        id: crypto.randomUUID(),
        config,
        resolve,
        reject
      };

      // Add to queue
      if (!this.queue.has(batchKey)) {
        this.queue.set(batchKey, []);
      }
      this.queue.get(batchKey)!.push(request);

      // Check if we should flush immediately
      const queue = this.queue.get(batchKey)!;
      if (queue.length >= batchConfig.maxBatchSize) {
        this.flush(batchKey);
      } else {
        // Schedule flush
        this.scheduleFlush(batchKey, batchConfig.batchDelay);
      }
    });
  }

  /**
   * Schedule a flush for a batch
   */
  private scheduleFlush(batchKey: string, delay: number): void {
    // Clear existing timer
    const existingTimer = this.timers.get(batchKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.flush(batchKey);
    }, delay);

    this.timers.set(batchKey, timer);
  }

  /**
   * Flush a batch queue
   */
  private async flush(batchKey: string): Promise<void> {
    const queue = this.queue.get(batchKey);
    const config = this.configs.get(batchKey);
    
    if (!queue || queue.length === 0 || !config) {
      return;
    }

    // Clear timer
    const timer = this.timers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(batchKey);
    }

    // Remove from queue
    this.queue.delete(batchKey);
    
    // Prepare batch request
    const batchRequests = queue.map(req => ({
      id: req.id,
      method: req.config.method || 'GET',
      url: req.config.url,
      params: req.config.params,
      data: req.config.data
    }));

    try {
      // Send batch request
      const response = await api.post<{
        results: Array<{
          id: string;
          status: 'success' | 'error';
          data?: any;
          error?: any;
        }>;
      }>(config.endpoint, { requests: batchRequests });

      // Process responses
      const resultMap = new Map(
        response.results.map(r => [r.id, r])
      );

      queue.forEach(req => {
        const result = resultMap.get(req.id);
        if (result) {
          if (result.status === 'success') {
            req.resolve(result.data);
          } else {
            req.reject(result.error || new Error('Batch request failed'));
          }
        } else {
          req.reject(new Error('No result for batch request'));
        }
      });
    } catch (error) {
      // If batch fails, reject all requests
      queue.forEach(req => req.reject(error));
    }
  }

  /**
   * Flush all pending batches
   */
  flushAll(): void {
    this.queue.forEach((_, batchKey) => {
      this.flush(batchKey);
    });
  }

  /**
   * Get batch statistics
   */
  getStats(): {
    queues: Array<{
      key: string;
      size: number;
      config: BatchConfig;
    }>;
    totalPending: number;
  } {
    const queues = Array.from(this.queue.entries()).map(([key, queue]) => ({
      key,
      size: queue.length,
      config: this.configs.get(key)!
    }));

    const totalPending = queues.reduce((sum, q) => sum + q.size, 0);

    return {
      queues,
      totalPending
    };
  }

  /**
   * Clear all pending batches
   */
  clear(): void {
    // Cancel all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Reject all pending requests
    this.queue.forEach(queue => {
      queue.forEach(req => {
        req.reject(new Error('Batch cancelled'));
      });
    });
    this.queue.clear();
  }
}

// Singleton instance
export const requestBatcher = new RequestBatcher();

// Helper function for batched requests
export function batchRequest<T>(
  batchKey: string,
  url: string,
  params?: any
): Promise<T> {
  return requestBatcher.batch<T>(batchKey, {
    method: 'GET',
    url,
    params
  });
}

// Batch helpers for specific services
export const batchHelpers = {
  portfolio: {
    getHolding: (symbol: string) => 
      batchRequest('portfolio', `/api/portfolio/holdings/${symbol}`),
    
    getQuote: (symbol: string) =>
      batchRequest('market', `/api/trading/quotes/${symbol}`),
    
    getESGScore: (symbol: string) =>
      batchRequest('esg', `/api/esg/scores/${symbol}`)
  },
  
  market: {
    getQuotes: (symbols: string[]) => {
      // Instead of N requests, batch them
      return Promise.all(
        symbols.map(symbol => 
          batchRequest('market', `/api/trading/quotes/${symbol}`)
        )
      );
    }
  }
};