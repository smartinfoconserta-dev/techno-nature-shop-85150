const APP_VERSION = "2.0.0"; // Incrementado automaticamente a cada deploy
const VERSION_KEY = "app_version";

export function checkAppVersion() {
  const stored = localStorage.getItem(VERSION_KEY);
  
  if (stored !== APP_VERSION) {
    console.log(`🔄 Nova versão ${APP_VERSION} detectada (anterior: ${stored || 'nenhuma'})`);
    
    // Limpar TODOS os storages
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpar caches do navegador
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Salvar nova versão
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    
    // Force reload SEM cache
    window.location.reload();
  }
}

export function getCurrentVersion() {
  return APP_VERSION;
}

export function clearAllCache() {
  console.log('🧹 Limpando cache manualmente...');
  
  // Limpar storages
  localStorage.clear();
  sessionStorage.clear();
  
  // Limpar caches do navegador
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  
  // Reload com timestamp para evitar cache HTTP
  window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
}
