import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { api } from '../apiClient';
import { getCacheInstance } from './responseCache';

interface PrefetchRule {
  trigger: string | RegExp;
  prefetch: Array<{
    url: string | ((triggerUrl: string) => string);
    params?: any | ((triggerUrl: string) => any);
    ttl?: number;
  }>;
  delay?: number;
}

interface PrefetchOptions {
  priority?: 'high' | 'low';
  force?: boolean;
}

/**
 * Request Prefetcher
 * Intelligently prefetches data based on user actions
 */
export class RequestPrefetcher {
  private rules: PrefetchRule[] = [];
  private prefetchQueue: Set<string> = new Set();
  private observer: IntersectionObserver | null = null;

  constructor() {
    this.setupDefaultRules();
    this.setupIntersectionObserver();
  }

  /**
   * Setup default prefetch rules
   */
  private setupDefaultRules(): void {
    // Dashboard prefetch rules
    this.addRule({
      trigger: '/dashboard',
      prefetch: [
        { url: '/api/portfolio/portfolios', ttl: 5 * 60 * 1000 },
        { url: '/api/portfolio/performance', params: { period: '1M' } },
        { url: '/api/esg/impact', ttl: 10 * 60 * 1000 }
      ]
    });

    // Portfolio page prefetch rules
    this.addRule({
      trigger: '/portfolio',
      prefetch: [
        { url: '/api/portfolio/holdings', params: { page: 0, size: 20 } },
        { url: '/api/portfolio/allocation' },
        { url: '/api/analytics/risk' }
      ],
      delay: 100
    });

    // Transaction page prefetch rules
    this.addRule({
      trigger: '/transactions',
      prefetch: [
        { url: '/api/portfolio/transactions', params: { page: 0, size: 20 } }
      ]
    });

    // Hover prefetch for portfolio items
    this.addRule({
      trigger: /\/portfolio\/([^/]+)/,
      prefetch: [
        { 
          url: (triggerUrl) => {
            const symbol = triggerUrl.match(/\/portfolio\/([^/]+)/)?.[1];
            return `/api/trading/quotes/${symbol}`;
          }
        },
        {
          url: (triggerUrl) => {
            const symbol = triggerUrl.match(/\/portfolio\/([^/]+)/)?.[1];
            return `/api/esg/scores/${symbol}`;
          }
        }
      ],
      delay: 200
    });

    // Settings page prefetch
    this.addRule({
      trigger: '/settings',
      prefetch: [
        { url: '/api/notifications/preferences' },
        { url: '/api/users/profile' }
      ]
    });
  }

  /**
   * Setup intersection observer for viewport-based prefetching
   */
  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const prefetchUrl = element.dataset.prefetch;
            
            if (prefetchUrl) {
              this.prefetch(prefetchUrl, { priority: 'low' });
            }
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );
  }

  /**
   * Add a prefetch rule
   */
  addRule(rule: PrefetchRule): void {
    this.rules.push(rule);
  }

  /**
   * Trigger prefetch based on URL
   */
  async triggerPrefetch(url: string): Promise<void> {
    const matchingRules = this.rules.filter(rule => {
      if (typeof rule.trigger === 'string') {
        return url.includes(rule.trigger);
      } else {
        return rule.trigger.test(url);
      }
    });

    for (const rule of matchingRules) {
      if (rule.delay) {
        setTimeout(() => this.executePrefetchRule(rule, url), rule.delay);
      } else {
        this.executePrefetchRule(rule, url);
      }
    }
  }

  /**
   * Execute a prefetch rule
   */
  private async executePrefetchRule(rule: PrefetchRule, triggerUrl: string): Promise<void> {
    for (const prefetchConfig of rule.prefetch) {
      const url = typeof prefetchConfig.url === 'function' 
        ? prefetchConfig.url(triggerUrl) 
        : prefetchConfig.url;
      
      const params = typeof prefetchConfig.params === 'function'
        ? prefetchConfig.params(triggerUrl)
        : prefetchConfig.params;

      await this.prefetch(url, {
        priority: 'low',
        force: false
      }, params, prefetchConfig.ttl);
    }
  }

  /**
   * Prefetch a URL
   */
  async prefetch(
    url: string,
    options: PrefetchOptions = {},
    params?: any,
    ttl?: number
  ): Promise<void> {
    const cacheKey = `${url}:${JSON.stringify(params || {})}`;
    
    // Check if already prefetching
    if (this.prefetchQueue.has(cacheKey)) {
      return;
    }

    // Check if already cached
    const cache = getCacheInstance(url);
    const cachedResponse = cache.get({ method: 'GET', url, params });
    
    if (cachedResponse && !options.force) {
      return;
    }

    // Add to prefetch queue
    this.prefetchQueue.add(cacheKey);

    try {
      // Use requestIdleCallback for low priority prefetches
      if (options.priority === 'low' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          this.executePrefetch(url, params, ttl);
        });
      } else {
        await this.executePrefetch(url, params, ttl);
      }
    } finally {
      this.prefetchQueue.delete(cacheKey);
    }
  }

  /**
   * Execute the actual prefetch
   */
  private async executePrefetch(url: string, params?: any, ttl?: number): Promise<void> {
    try {
      const response: AxiosResponse = await api.get(url, { params });
      
      // Cache the response
      const cache = getCacheInstance(url);
      cache.set({ method: 'GET', url, params }, response, ttl);
    } catch (error) {
      // Silently fail prefetch requests
      console.debug('Prefetch failed:', url, error);
    }
  }

  /**
   * Observe an element for viewport-based prefetching
   */
  observe(element: HTMLElement): void {
    if (this.observer && element.dataset.prefetch) {
      this.observer.observe(element);
    }
  }

  /**
   * Unobserve an element
   */
  unobserve(element: HTMLElement): void {
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }

  /**
   * Prefetch data for links on hover
   */
  setupLinkPrefetching(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href.startsWith(window.location.origin)) {
        const path = new URL(link.href).pathname;
        this.triggerPrefetch(path);
      }
    });
  }

  /**
   * Get prefetch statistics
   */
  getStats(): {
    rulesCount: number;
    queueSize: number;
    rules: Array<{
      trigger: string;
      prefetchCount: number;
    }>;
  } {
    return {
      rulesCount: this.rules.length,
      queueSize: this.prefetchQueue.size,
      rules: this.rules.map(rule => ({
        trigger: rule.trigger.toString(),
        prefetchCount: rule.prefetch.length
      }))
    };
  }

  /**
   * Clear prefetch queue
   */
  clear(): void {
    this.prefetchQueue.clear();
  }

  /**
   * Cleanup observer
   */
  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.clear();
  }
}

// Singleton instance
export const requestPrefetcher = new RequestPrefetcher();

// React hook for prefetching
export function usePrefetch() {
  return {
    prefetch: (url: string, params?: any) => 
      requestPrefetcher.prefetch(url, { priority: 'high' }, params),
    
    prefetchLow: (url: string, params?: any) =>
      requestPrefetcher.prefetch(url, { priority: 'low' }, params),
    
    observe: (element: HTMLElement) =>
      requestPrefetcher.observe(element),
    
    unobserve: (element: HTMLElement) =>
      requestPrefetcher.unobserve(element)
  };
}