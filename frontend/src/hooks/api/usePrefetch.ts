import { useEffect, useRef, useCallback } from 'react';
import { usePrefetch as usePrefetchOptimization } from '@/services/api/optimizations';

interface UsePrefetchOptions {
  onHover?: boolean;
  onVisible?: boolean;
  delay?: number;
}

/**
 * Hook for prefetching API data
 */
export function usePrefetch(
  url: string | (() => string),
  params?: any,
  options: UsePrefetchOptions = {}
) {
  const { prefetch, prefetchLow, observe, unobserve } = usePrefetchOptimization();
  const elementRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prefetch function
  const doPrefetch = useCallback(() => {
    const targetUrl = typeof url === 'function' ? url() : url;
    if (targetUrl) {
      prefetch(targetUrl, params);
    }
  }, [url, params, prefetch]);

  // Low priority prefetch
  const doPrefetchLow = useCallback(() => {
    const targetUrl = typeof url === 'function' ? url() : url;
    if (targetUrl) {
      prefetchLow(targetUrl, params);
    }
  }, [url, params, prefetchLow]);

  // Handle hover prefetch
  const handleMouseEnter = useCallback(() => {
    if (options.onHover) {
      if (options.delay) {
        timeoutRef.current = setTimeout(doPrefetch, options.delay);
      } else {
        doPrefetch();
      }
    }
  }, [options.onHover, options.delay, doPrefetch]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Setup ref for element
  const setElementRef = useCallback((element: HTMLElement | null) => {
    // Cleanup previous element
    if (elementRef.current && options.onVisible) {
      unobserve(elementRef.current);
    }

    elementRef.current = element;

    // Setup new element
    if (element) {
      if (options.onVisible) {
        // Add data attribute for viewport prefetching
        const targetUrl = typeof url === 'function' ? url() : url;
        element.dataset.prefetch = targetUrl;
        observe(element);
      }

      if (options.onHover) {
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
      }
    }
  }, [url, options.onVisible, options.onHover, observe, unobserve, handleMouseEnter, handleMouseLeave]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (elementRef.current) {
        if (options.onVisible) {
          unobserve(elementRef.current);
        }
        if (options.onHover) {
          elementRef.current.removeEventListener('mouseenter', handleMouseEnter);
          elementRef.current.removeEventListener('mouseleave', handleMouseLeave);
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [options.onVisible, options.onHover, unobserve, handleMouseEnter, handleMouseLeave]);

  return {
    ref: setElementRef,
    prefetch: doPrefetch,
    prefetchLow: doPrefetchLow
  };
}

/**
 * Hook for prefetching on route change
 */
export function useRoutePrefetch(routes: Array<{ path: string; prefetch: string[] }>) {
  const { prefetch } = usePrefetchOptimization();

  useEffect(() => {
    const handleRouteChange = () => {
      const currentPath = window.location.pathname;
      
      routes.forEach(route => {
        if (currentPath.includes(route.path)) {
          route.prefetch.forEach(url => {
            prefetch(url);
          });
        }
      });
    };

    // Initial prefetch
    handleRouteChange();

    // Listen for route changes (if using React Router)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [routes, prefetch]);
}

/**
 * Hook for conditional prefetching based on user behavior
 */
export function useConditionalPrefetch(
  condition: boolean,
  urls: string[],
  delay = 1000
) {
  const { prefetchLow } = usePrefetchOptimization();

  useEffect(() => {
    if (condition) {
      const timeout = setTimeout(() => {
        urls.forEach(url => prefetchLow(url));
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [condition, urls, delay, prefetchLow]);
}