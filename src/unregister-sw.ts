// Script temporário para desregistrar service workers antigos e limpar cache
export async function unregisterServiceWorkers() {
  if ('serviceWorker' in navigator) {
    try {
      // Desregistra todos os service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Service Worker desregistrado:', registration);
      }

      // Limpa todos os caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Caches limpos:', cacheNames);
      }

      console.log('✅ Service Workers e caches removidos com sucesso');
    } catch (error) {
      console.error('Erro ao limpar service workers:', error);
    }
  }
}
