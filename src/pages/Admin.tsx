import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut, Menu, Loader2, Database } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import DashboardTab from "@/components/admin/DashboardTab";
import ProductsMainTab from "@/components/admin/ProductsMainTab";
import FinanceMainTab from "@/components/admin/FinanceMainTab";
import SalesHistoryTab from "@/components/admin/SalesHistoryTab";
import CouponsTab from "@/components/admin/CouponsTab";
import SettingsTab from "@/components/admin/SettingsTab";
import ReceivablesTab from "@/components/admin/ReceivablesTab";
import QuickSalesTab from "@/components/admin/QuickSalesTab";
import CustomersTab from "@/components/admin/CustomersTab";
import NotebookRequestsTab from "@/components/admin/NotebookRequestsTab";
import { productsStore } from "@/lib/productsStore";
import { quickSalesStore } from "@/lib/quickSalesStore";
import { receivablesStore } from "@/lib/receivablesStore";
import { customerRequestsStore } from "@/lib/customerRequestsStore";

const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('admin.activeTab') || "dashboard";
  });
  const [productCount, setProductCount] = useState<number>(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  // Refresh inicial dos dados em background quando a tela abre
  useEffect(() => {
    const loadData = async () => {
      await productsStore.refreshFromBackend();
      await quickSalesStore.refreshFromBackend();
      await receivablesStore.refreshFromBackend();
      updateProductCount();
      updatePendingRequestsCount();
    };
    loadData();
  }, []);

  const updateProductCount = () => {
    setProductCount(productsStore.getAllProducts().length);
  };

  const updatePendingRequestsCount = async () => {
    try {
      const requests = await customerRequestsStore.getAllRequests();
      setPendingRequestsCount(requests.filter(r => r.status === "pending").length);
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
    }
  };

  // Atualizar contagem periodicamente (polling simples)
  useEffect(() => {
    const interval = setInterval(() => {
      updateProductCount();
      updatePendingRequestsCount();
    }, 5000); // A cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Persistir aba ativa
  useEffect(() => {
    sessionStorage.setItem('admin.activeTab', activeTab);
  }, [activeTab]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar - Apenas Desktop */}
        <div className="hidden md:block">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border bg-card sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <SidebarTrigger className="md:flex hidden" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">
                      Painel Administrativo
                    </h1>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Database className="h-3 w-3" />
                      Backend conectado ({productCount} produtos)
                    </Badge>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    {user?.email} • {window.location.host}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout} size="sm" className="flex-shrink-0">
                <LogOut className="h-4 w-4 mr-2" />
                <span>Sair</span>
              </Button>
            </div>
          </header>

          {/* Tabs Mobile - Apenas em telas pequenas */}
          <div className="md:hidden border-b border-border bg-card sticky top-[73px] z-10">
            <div className="overflow-x-auto">
              <div className="inline-flex p-1 gap-1 min-w-full">
                {[
                  { value: "dashboard", label: "📊 Dashboard" },
                  { value: "products", label: "📦 Produtos" },
                  { value: "quick-sales", label: "⚡ Vendas Rápidas" },
                  { value: "receivables", label: "📒 Caderneta" },
                  { value: "notebook", label: `📓 Solicitações${pendingRequestsCount > 0 ? ` (${pendingRequestsCount})` : ""}` },
                  { value: "customers", label: "👥 Clientes" },
                  { value: "finance", label: "💰 Financeiro" },
                  { value: "history", label: "📜 Histórico" },
                  { value: "coupons", label: "🎟️ Cupons" },
                  { value: "settings", label: "⚙️ Configurações" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conteúdo das Tabs */}
          <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
            {activeTab === "dashboard" && <DashboardTab onTabChange={setActiveTab} />}
            {activeTab === "products" && <ProductsMainTab />}
            {activeTab === "quick-sales" && <QuickSalesTab />}
            {activeTab === "receivables" && <ReceivablesTab />}
            {activeTab === "notebook" && <NotebookRequestsTab />}
            {activeTab === "customers" && <CustomersTab />}
            {activeTab === "finance" && <FinanceMainTab />}
            {activeTab === "history" && <SalesHistoryTab />}
            {activeTab === "coupons" && <CouponsTab />}
            {activeTab === "settings" && <SettingsTab />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
