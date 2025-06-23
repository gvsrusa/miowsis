import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(`
<!DOCTYPE html>
<html>
<head>
  <title>Clear Service Worker</title>
  <meta charset="utf-8">
</head>
<body>
  <div style="max-width: 600px; margin: 50px auto; padding: 20px; font-family: sans-serif;">
    <h1>Clearing Service Workers...</h1>
    <div id="status">Starting cleanup process...</div>
    
    <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px;">
      <h3>Manual Cleanup Instructions:</h3>
      <ol>
        <li>Open Chrome DevTools (Right-click → Inspect or F12)</li>
        <li>Go to the "Application" tab</li>
        <li>Find "Service Workers" in the left sidebar</li>
        <li>Click "Unregister" for all service workers</li>
        <li>Go to "Storage" in the left sidebar</li>
        <li>Click "Clear site data" button</li>
        <li>Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)</li>
      </ol>
    </div>
  </div>

  <script>
    (async function() {
      const statusEl = document.getElementById('status');
      
      try {
        // Unregister all service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          statusEl.textContent = 'Found ' + registrations.length + ' service worker(s)...';
          
          for (const registration of registrations) {
            await registration.unregister();
            console.log('Unregistered:', registration.scope);
          }
          
          statusEl.textContent = 'Service workers cleared. Clearing caches...';
        }
        
        // Clear all caches
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map(name => caches.delete(name)));
          statusEl.textContent = 'Caches cleared. Clearing storage...';
        }
        
        // Clear storage
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.error('Storage clear error:', e);
        }
        
        statusEl.innerHTML = '<strong style="color: green;">✓ All cleanup complete!</strong><br><br>You can now <a href="/auth/signin">go to sign in</a> or close this tab.';
        
        // Also try to stop any active service workers
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
        
      } catch (error) {
        statusEl.innerHTML = '<strong style="color: red;">Error: ' + error.message + '</strong><br><br>Please follow the manual instructions above.';
      }
    })();
  </script>
</body>
</html>
  `, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}