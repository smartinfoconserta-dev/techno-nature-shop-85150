const APP_CACHE_VERSION = "5";

const CACHE_KEYS = [
  "products_data",
  "quick_sales_data",
  "receivables_data",
  "monthly_reports_data",
  "last_month_check",
  "app_settings",
  "customer_session",
];

export function ensureFreshCache() {
  try {
    const savedVersion = localStorage.getItem("app_cache_version");
    
    if (savedVersion !== APP_CACHE_VERSION) {
      console.log("Cache version mismatch. Clearing old data...");
      
      CACHE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });
      
      localStorage.setItem("app_cache_version", APP_CACHE_VERSION);
      console.log("Cache cleared and version updated to", APP_CACHE_VERSION);
    }

    // One-shot: force clear products_data for version 5
    if (!localStorage.getItem("cleared_products_v5")) {
      console.log("One-shot: Clearing products_data for v5...");
      localStorage.removeItem("products_data");
      localStorage.setItem("cleared_products_v5", "true");
    }
    
    // Force clear ALL PWA caches on v5
    if (!localStorage.getItem("pwa_killed_v5")) {
      console.log("Killing PWA caches v5...");
      CACHE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });
      localStorage.setItem("pwa_killed_v5", "true");
    }
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}
