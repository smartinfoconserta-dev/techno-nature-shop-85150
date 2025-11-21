import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { preloadInstallmentRates } from "@/lib/installmentHelper";

// Preload não-bloqueante com timeout de segurança
const safePreload = async () => {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Preload timeout')), 5000)
    );
    
    await Promise.race([
      preloadInstallmentRates(),
      timeoutPromise
    ]);
    
    console.log('✅ Taxas de parcelamento pré-carregadas');
  } catch (error) {
    console.warn('⚠️ Preload falhou, usando valores padrão:', error);
  }
};

// Executa preload em background mas NÃO bloqueia renderização
safePreload();

// Renderiza imediatamente
createRoot(document.getElementById("root")!).render(<App />);
