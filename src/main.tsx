import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { unregisterServiceWorkers } from "./unregister-sw";

// Limpar service workers antigos na primeira carga
unregisterServiceWorkers();

createRoot(document.getElementById("root")!).render(<App />);
