const APP_VERSION = "2.0.0";

export function getCurrentVersion() {
  return APP_VERSION;
}

export function clearAllCache() {
  console.log('🧹 Limpando cache manualmente...');
  
  try {
    // Limpar storages com proteção para modo anônimo
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpar caches do navegador
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Reload com timestamp para evitar cache HTTP
    setTimeout(() => {
      window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
    }, 100);
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    // Fallback simples em caso de erro (modo anônimo)
    window.location.reload();
  }
}
