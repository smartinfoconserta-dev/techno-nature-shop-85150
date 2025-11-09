import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerPortal from "./pages/CustomerPortal";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PrivateRoute from "./components/PrivateRoute";
import CustomerPrivateRoute from "./components/CustomerPrivateRoute";
import { ComparisonBar } from "./components/ComparisonBar";
import { ComparisonProvider } from "./contexts/ComparisonContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ComparisonProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/install" element={<Install />} />
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
          <ComparisonBar />
        </ComparisonProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
