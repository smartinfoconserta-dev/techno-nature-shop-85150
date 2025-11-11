import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { unregisterServiceWorkers } from "./unregister-sw";
import { ensureFreshCache } from "./lib/cacheVersion";

// Limpar service workers antigos na primeira carga
unregisterServiceWorkers();

// Invalidar cache antigo automaticamente
ensureFreshCache();

createRoot(document.getElementById("root")!).render(<App />);
