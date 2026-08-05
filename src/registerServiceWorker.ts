// Service worker registration helper. Import and call from your app entry (e.g., src/main.tsx)
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Service worker registered.', reg);
      })
      .catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
  }
}
