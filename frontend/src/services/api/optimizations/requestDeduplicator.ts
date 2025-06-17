import { AxiosRequestConfig } from 'axios';

/**
 * Request Deduplicator
 * Prevents duplicate simultaneous requests to the same endpoint
 */
export class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  /**
   * Generate a unique key for a request
   */
  private generateKey(config: AxiosRequestConfig): string {
    const method = config.method || 'GET';
    const url = config.url || '';
    const params = JSON.stringify(config.params || {});
    const data = config.data ? JSON.stringify(config.data) : '';
    
    return `${method}:${url}:${params}:${data}`;
  }

  /**
   * Check if a request is already pending
   */
  isPending(config: AxiosRequestConfig): boolean {
    const key = this.generateKey(config);
    return this.pendingRequests.has(key);
  }

  /**
   * Get the pending request promise
   */
  getPendingRequest<T>(config: AxiosRequestConfig): Promise<T> | null {
    const key = this.generateKey(config);
    return this.pendingRequests.get(key) || null;
  }

  /**
   * Add a request to the pending map
   */
  addPending<T>(config: AxiosRequestConfig, promise: Promise<T>): void {
    const key = this.generateKey(config);
    this.pendingRequests.set(key, promise);

    // Remove from pending when complete
    promise
      .finally(() => {
        this.pendingRequests.delete(key);
      })
      .catch(() => {
        // Silently catch to prevent unhandled rejection
      });
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get statistics about pending requests
   */
  getStats(): {
    pendingCount: number;
    pendingUrls: string[];
  } {
    const pendingUrls = Array.from(this.pendingRequests.keys()).map(key => {
      const [method, url] = key.split(':');
      return `${method} ${url}`;
    });

    return {
      pendingCount: this.pendingRequests.size,
      pendingUrls
    };
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator();