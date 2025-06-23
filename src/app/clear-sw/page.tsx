'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearServiceWorkerPage() {
  const [status, setStatus] = useState('Clearing service workers...');
  const router = useRouter();

  useEffect(() => {
    async function clearAllServiceWorkers() {
      try {
        // Clear all service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          
          for (const registration of registrations) {
            const success = await registration.unregister();
            console.log(`Service Worker unregistered from ${registration.scope}: ${success}`);
          }
          
          setStatus('Service workers cleared. Clearing caches...');
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
          
          setStatus('All caches cleared. Redirecting...');
        }

        // Clear localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();

        // Redirect after a short delay
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);

      } catch (error) {
        console.error('Error clearing service workers:', error);
        setStatus(`Error: ${error}. Please try manually in browser DevTools.`);
      }
    }

    clearAllServiceWorkers();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Clearing Service Workers</h1>
        <p className="text-gray-600">{status}</p>
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-700 mb-2">Manual steps if automatic clearing fails:</p>
          <ol className="text-left text-sm space-y-2">
            <li>1. Open Chrome DevTools (F12)</li>
            <li>2. Go to Application tab</li>
            <li>3. Click "Service Workers" on the left</li>
            <li>4. Click "Unregister" for all workers</li>
            <li>5. Click "Storage" on the left</li>
            <li>6. Click "Clear site data"</li>
            <li>7. Refresh the page</li>
          </ol>
        </div>
      </div>
    </div>
  );
}