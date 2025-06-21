// Service Worker Registration with Auth Route Protection
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    // Check if we're on an auth-related page or callback
    const isAuthRoute = window.location.pathname.includes('/auth/') || 
                       window.location.pathname.includes('/api/auth/');
    
    // Don't register service worker on auth routes
    if (isAuthRoute) {
      console.info('Service worker registration skipped on auth route');
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                // New service worker activated, refresh may be needed
                console.log('New service worker activated');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'AUTH_REDIRECT') {
        // If service worker detects auth redirect, handle it
        window.location.href = event.data.url;
      }
    });
  });
}

// Utility function to skip service worker for specific requests
export function shouldSkipServiceWorker(url) {
  const authPatterns = [
    /\/auth\//,
    /\/api\/auth\//,
    /\/signin/,
    /\/signout/,
    /\/callback/,
    /supabase\.auth/
  ];
  
  return authPatterns.some(pattern => pattern.test(url));
}