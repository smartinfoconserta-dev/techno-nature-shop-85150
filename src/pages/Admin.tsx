import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useMigrateFromLocalStorage } from "@/hooks/useMigrateFromLocalStorage";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut, Menu, Loader2 } from "lucide-react";
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

const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { isMigrating, migrationComplete } = useMigrateFromLocalStorage();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (isMigrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h2 className="text-2xl font-bold">Migrando dados...</h2>
          <p className="text-muted-foreground">Aguarde enquanto seus dados são transferidos para o backend.</p>
        </div>
      </div>
    );
  }

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
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:flex hidden" />
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">
                    Painel Administrativo
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout} size="sm">
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
