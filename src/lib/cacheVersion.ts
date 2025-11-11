const APP_CACHE_VERSION = "2";

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
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}
