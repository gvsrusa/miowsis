/**
 * API Optimization Modules
 * Export all optimization utilities
 */

// Import instances to use in this file
import { requestDeduplicator } from './requestDeduplicator';
import { cacheInstances } from './responseCache';
import { requestBatcher } from './requestBatcher';
import { requestPrefetcher } from './requestPrefetcher';
import { performanceMonitor } from './performanceMonitor';

// Re-export all modules
export { RequestDeduplicator, requestDeduplicator } from './requestDeduplicator';
export { 
  ResponseCache, 
  cacheInstances, 
  getCacheInstance 
} from './responseCache';
export { 
  RequestBatcher, 
  requestBatcher, 
  batchRequest,
  batchHelpers 
} from './requestBatcher';
export { 
  RequestPrefetcher, 
  requestPrefetcher,
  usePrefetch 
} from './requestPrefetcher';
export { 
  PerformanceMonitor, 
  performanceMonitor 
} from './performanceMonitor';

// Composite optimization utilities
export interface OptimizationConfig {
  enableDeduplication?: boolean;
  enableCaching?: boolean;
  enableBatching?: boolean;
  enablePrefetching?: boolean;
  enableMonitoring?: boolean;
  cacheConfig?: {
    defaultTTL?: number;
    maxSize?: number;
    storage?: 'memory' | 'localStorage' | 'sessionStorage';
  };
  batchConfig?: {
    maxBatchSize?: number;
    batchDelay?: number;
  };
}

/**
 * Initialize all optimization modules
 */
export function initializeOptimizations(config: OptimizationConfig = {}): void {
  const {
    enableDeduplication = true,
    enableCaching = true,
    enableBatching = true,
    enablePrefetching = true,
    enableMonitoring = true
  } = config;

  if (enablePrefetching) {
    // Setup link prefetching
    requestPrefetcher.setupLinkPrefetching();
  }

  // Log initialization
  console.log('API Optimizations initialized:', {
    deduplication: enableDeduplication,
    caching: enableCaching,
    batching: enableBatching,
    prefetching: enablePrefetching,
    monitoring: enableMonitoring
  });
}

/**
 * Get optimization statistics
 */
export function getOptimizationStats() {
  return {
    deduplication: requestDeduplicator.getStats(),
    cache: {
      default: cacheInstances.default.getStats(),
      portfolio: cacheInstances.portfolio.getStats(),
      market: cacheInstances.market.getStats(),
      static: cacheInstances.static.getStats()
    },
    batching: requestBatcher.getStats(),
    prefetching: requestPrefetcher.getStats(),
    performance: performanceMonitor.getStats()
  };
}

/**
 * Clear all optimization caches and queues
 */
export function clearOptimizations(): void {
  requestDeduplicator.clear();
  Object.values(cacheInstances).forEach(cache => cache.clear());
  requestBatcher.clear();
  requestPrefetcher.clear();
  performanceMonitor.clear();
}

/**
 * Cleanup optimization resources
 */
export function cleanupOptimizations(): void {
  requestPrefetcher.cleanup();
  clearOptimizations();
}