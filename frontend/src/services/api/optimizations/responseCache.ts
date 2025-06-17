import { AxiosRequestConfig, AxiosResponse } from 'axios';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  etag?: string;
  headers?: Record<string, string>;
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  enableEtag: boolean;
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

/**
 * Response Cache
 * Caches API responses with configurable TTLs
 */
export class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private accessOrder: string[] = [];

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      enableEtag: true,
      storage: 'memory',
      ...config
    };

    // Load from persistent storage if configured
    if (this.config.storage !== 'memory') {
      this.loadFromStorage();
    }
  }

  /**
   * Generate a cache key from request config
   */
  private generateKey(config: AxiosRequestConfig): string {
    const method = config.method || 'GET';
    const url = config.url || '';
    const params = JSON.stringify(config.params || {});
    
    // Only cache GET requests by default
    if (method !== 'GET') {
      return '';
    }
    
    return `${method}:${url}:${params}`;
  }

  /**
   * Check if a cached response is still valid
   */
  private isValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return now - entry.timestamp < entry.ttl;
  }

  /**
   * Get cached response
   */
  get(config: AxiosRequestConfig): AxiosResponse | null {
    const key = this.generateKey(config);
    if (!key) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);

    // Return cached response
    return {
      data: entry.data,
      status: 200,
      statusText: 'OK',
      headers: entry.headers || {},
      config,
      request: {}
    } as AxiosResponse;
  }

  /**
   * Store response in cache
   */
  set(config: AxiosRequestConfig, response: AxiosResponse, ttl?: number): void {
    const key = this.generateKey(config);
    if (!key) return;

    // Check cache size limit
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    // Convert headers to plain object
    const headers: Record<string, string> = {};
    if (response.headers) {
      Object.keys(response.headers).forEach(key => {
        const value = response.headers[key];
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    const entry: CacheEntry = {
      data: response.data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      etag: response.headers?.etag as string | undefined,
      headers
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);

    // Save to persistent storage if configured
    if (this.config.storage !== 'memory') {
      this.saveToStorage();
    }
  }

  /**
   * Clear specific cache entry
   */
  delete(config: AxiosRequestConfig): void {
    const key = this.generateKey(config);
    if (key) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    
    if (this.config.storage !== 'memory') {
      this.clearStorage();
    }
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (!this.isValid(entry)) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    });

    if (this.config.storage !== 'memory' && expiredKeys.length > 0) {
      this.saveToStorage();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{
      key: string;
      size: number;
      age: number;
      ttl: number;
    }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: JSON.stringify(entry.data).length,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl
    }));

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Would need to track hits/misses for this
      entries
    };
  }

  /**
   * Get ETag for a request if available
   */
  getEtag(config: AxiosRequestConfig): string | null {
    const key = this.generateKey(config);
    if (!key) return null;

    const entry = this.cache.get(key);
    return entry?.etag || null;
  }

  /**
   * Update cache with 304 Not Modified response
   */
  updateTimestamp(config: AxiosRequestConfig): void {
    const key = this.generateKey(config);
    if (!key) return;

    const entry = this.cache.get(key);
    if (entry) {
      entry.timestamp = Date.now();
      this.updateAccessOrder(key);
    }
  }

  /**
   * LRU eviction
   */
  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0];
      this.cache.delete(lruKey);
      this.accessOrder.shift();
    }
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Save cache to persistent storage
   */
  private saveToStorage(): void {
    try {
      const storage = this.getStorage();
      if (!storage) return;

      const data = {
        cache: Array.from(this.cache.entries()),
        accessOrder: this.accessOrder
      };

      storage.setItem('api_response_cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Load cache from persistent storage
   */
  private loadFromStorage(): void {
    try {
      const storage = this.getStorage();
      if (!storage) return;

      const data = storage.getItem('api_response_cache');
      if (!data) return;

      const parsed = JSON.parse(data);
      this.cache = new Map(parsed.cache);
      this.accessOrder = parsed.accessOrder || [];

      // Clear expired entries
      this.clearExpired();
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * Clear persistent storage
   */
  private clearStorage(): void {
    try {
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem('api_response_cache');
      }
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }

  /**
   * Get storage instance
   */
  private getStorage(): Storage | null {
    switch (this.config.storage) {
      case 'localStorage':
        return typeof window !== 'undefined' ? window.localStorage : null;
      case 'sessionStorage':
        return typeof window !== 'undefined' ? window.sessionStorage : null;
      default:
        return null;
    }
  }
}

// Create cache instances for different services with different TTLs
export const cacheInstances = {
  default: new ResponseCache({
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100
  }),
  portfolio: new ResponseCache({
    defaultTTL: 2 * 60 * 1000, // 2 minutes for portfolio data
    maxSize: 50,
    storage: 'sessionStorage'
  }),
  market: new ResponseCache({
    defaultTTL: 30 * 1000, // 30 seconds for market data
    maxSize: 200
  }),
  static: new ResponseCache({
    defaultTTL: 60 * 60 * 1000, // 1 hour for static data
    maxSize: 50,
    storage: 'localStorage'
  })
};

// Helper to get appropriate cache instance
export function getCacheInstance(endpoint: string): ResponseCache {
  if (endpoint.includes('/portfolio')) return cacheInstances.portfolio;
  if (endpoint.includes('/market') || endpoint.includes('/quotes')) return cacheInstances.market;
  if (endpoint.includes('/companies') || endpoint.includes('/scores')) return cacheInstances.static;
  return cacheInstances.default;
}