import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerPortal from "./pages/CustomerPortal";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PrivateRoute from "./components/PrivateRoute";
import CustomerPrivateRoute from "./components/CustomerPrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { getCurrentVersion, clearAllCache } from "./lib/appVersion";

const queryClient = new QueryClient();

// Verifica versão e limpa cache se necessário
const useVersionCheck = () => {
  useEffect(() => {
    const currentVersion = getCurrentVersion();
    const storedVersion = localStorage.getItem('app-version');
    
    if (storedVersion && storedVersion !== currentVersion) {
      console.log(`🔄 Nova versão detectada: ${storedVersion} → ${currentVersion}`);
      localStorage.setItem('app-version', currentVersion);
      clearAllCache();
    } else if (!storedVersion) {
      localStorage.setItem('app-version', currentVersion);
    }
  }, []);
};

const App = () => {
  useVersionCheck();
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<CustomerLogin />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/portal" element={
                <CustomerPrivateRoute>
                  <CustomerPortal />
                </CustomerPrivateRoute>
              } />
              <Route path="/admin" element={
                <PrivateRoute>
                  <Admin />
                </PrivateRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
