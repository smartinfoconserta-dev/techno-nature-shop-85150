import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { checkAppVersion } from "./lib/appVersion";

// Verificar versão da aplicação ANTES de renderizar
checkAppVersion();

createRoot(document.getElementById("root")!).render(<App />);
