'use client';

import { useEffect } from 'react';

export function ClearServiceWorker() {
  useEffect(() => {
    async function clearServiceWorkerAndCaches() {
      if ('serviceWorker' in navigator) {
        try {
          // Get all service worker registrations
          const registrations = await navigator.serviceWorker.getRegistrations();
          
          // Unregister all service workers
          for (const registration of registrations) {
            await registration.unregister();
            console.log('Service worker unregistered:', registration.scope);
          }
          
          // Clear all caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map(cacheName => {
                console.log('Deleting cache:', cacheName);
                return caches.delete(cacheName);
              })
            );
          }
          
          console.log('All service workers and caches cleared');
          
          // Reload the page after clearing
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          console.error('Error clearing service worker:', error);
        }
      }
    }
    
    // Only run if there's a query parameter to clear SW
    const params = new URLSearchParams(window.location.search);
    if (params.get('clearSW') === 'true') {
      clearServiceWorkerAndCaches();
    }
  }, []);
  
  return null;
}

// Utility function to manually clear service worker
export async function clearServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  }
}