import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ShoppingBag, DollarSign, Clock, Loader2, ChevronDown } from "lucide-react";
import { SummaryCard } from "@/components/customer/SummaryCard";
import { AddNotebookItemDialog } from "@/components/customer/AddNotebookItemDialog";
import { DeletePortalReceivableDialog } from "@/components/customer/DeletePortalReceivableDialog";
import { CustomerReceivableItem } from "@/components/customer/CustomerReceivableItem";
import { CustomerPortalHeader } from "@/components/customer/CustomerPortalHeader";
import { CustomerStatsChart } from "@/components/customer/CustomerStatsChart";
import { FilterBar } from "@/components/admin/FilterBar";
import { ActiveFilterChip } from "@/components/admin/ActiveFilterChip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateCustomerPortalPDF } from "@/lib/generateCustomerPortalPDF";

interface Receivable {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  productId: string;
  productName: string;
  brand?: string;
  category?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installments: number;
  installmentRate: number;
  status: "pending" | "partial" | "paid";
  payments: any[];
  warranty?: number;
  archived: boolean;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  autoArchived?: boolean;
}

const CustomerPortal = () => {
  const navigate = useNavigate();
  const { customer, logout } = useCustomerAuth();
  const { toast } = useToast();
  const [activeReceivables, setActiveReceivables] = useState<Receivable[]>([]);
  const [archivedReceivables, setArchivedReceivables] = useState<Receivable[]>([]);
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [warrantyFilter, setWarrantyFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statsOpen, setStatsOpen] = useState(false);

  useEffect(() => {
    if (!customer) {
      navigate("/login");
      return;
    }
    loadReceivables("active");
    loadReceivables("archived");
  }, [customer, navigate]);

  const loadReceivables = async (view: "active" | "archived" = "active") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("customer_token");
      
      if (!token) {
        toast({ title: "Sessão expirada", description: "Por favor, faça login novamente", variant: "destructive" });
        navigate("/login");
        return;
      }

      const { data, error } = await supabase.functions.invoke("portal-get-receivables", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { view },
      });

      if (error) throw error;
      if (view === "active") setActiveReceivables(data.receivables || []);
      else setArchivedReceivables(data.receivables || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar compras", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handlePrintPDF = () => {
    if (customer) {
      generateCustomerPortalPDF(
        customer,
        [...activeReceivables, ...archivedReceivables],
        "Todos os períodos",
        "Loja"
      );
    }
  };

  const handleDeleteClick = (id: string) => {
    const receivable = archivedReceivables.find((r) => r.id === id);
    if (receivable) {
      setSelectedReceivable(receivable);
      setShowDeleteDialog(true);
    }
  };

  const currentReceivables = activeTab === "active" ? activeReceivables : archivedReceivables;
  
  const filteredReceivables = currentReceivables.filter(rec => {
    const matchesSearch = rec.productName.toLowerCase().includes(searchTerm.toLowerCase()) || rec.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || rec.status === statusFilter;
    const matchesBrand = brandFilter === "all" || rec.brand === brandFilter;
    
    let matchesPeriod = true;
    if (periodFilter !== "all") {
      const daysDiff = Math.floor((new Date().getTime() - new Date(rec.saleDate).getTime()) / (1000 * 60 * 60 * 24));
      if (periodFilter === "30days") matchesPeriod = daysDiff <= 30;
      else if (periodFilter === "90days") matchesPeriod = daysDiff <= 90;
      else if (periodFilter === "180days") matchesPeriod = daysDiff <= 180;
    }
    
    return matchesSearch && matchesStatus && matchesBrand && matchesPeriod;
  });

  const totalComprado = currentReceivables.reduce((sum, rec) => sum + rec.totalAmount, 0);
  const totalPago = currentReceivables.reduce((sum, rec) => sum + rec.paidAmount, 0);
  const totalDevedor = currentReceivables.reduce((sum, rec) => sum + rec.remainingAmount, 0);

  const proximosVencimentos = activeReceivables.filter(rec => {
    if (!rec.dueDate || rec.status === "paid") return false;
    const diasRestantes = Math.ceil((new Date(rec.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diasRestantes <= 7 && diasRestantes >= 0;
  });

  const uniqueBrands = Array.from(new Set(currentReceivables.map(r => r.brand).filter(Boolean)));
  const activeFiltersCount = [searchTerm !== "", statusFilter !== "all", periodFilter !== "all", brandFilter !== "all", warrantyFilter !== "all"].filter(Boolean).length;

  const getStatusBadge = (status: "pending" | "partial" | "paid") => {
    const variants = {
      pending: { variant: "destructive" as const, label: "Pendente" },
      partial: { variant: "default" as const, label: "Parcial" },
      paid: { variant: "secondary" as const, label: "Quitado" },
    };
    return <Badge variant={variants[status].variant}>{variants[status].label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerPortalHeader
        customerName={customer?.name || ""}
        onLogout={handleLogout}
        onPrintPDF={handlePrintPDF}
        onAddNotebook={() => setShowAddDialog(true)}
        creditBalance={customer?.creditBalance}
      />

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SummaryCard title="Total Comprado" value={`R$ ${totalComprado.toFixed(2)}`} icon={ShoppingBag} valueColor="text-primary" />
          <SummaryCard title="Total Pago" value={`R$ ${totalPago.toFixed(2)}`} icon={DollarSign} valueColor="text-green-600" />
          <SummaryCard title="Saldo Devedor" value={`R$ ${totalDevedor.toFixed(2)}`} icon={Clock} valueColor="text-destructive"
            alert={proximosVencimentos.length > 0 ? { show: true, text: `${proximosVencimentos.length} vencendo em breve` } : undefined} />
        </div>

        {customer?.creditBalance && customer.creditBalance > 0 && (
          <Card className="border-l-4 border-l-primary bg-primary/5">
            <CardContent className="p-3 md:p-4">
              <p className="text-xs text-muted-foreground mb-1">Crédito Disponível</p>
              <p className="text-lg font-bold text-primary">{customer.creditBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="gap-2">✅ Ativas <Badge variant="secondary" className="h-5 px-1.5">{activeReceivables.length}</Badge></TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">📦 Arquivadas <Badge variant="secondary" className="h-5 px-1.5">{archivedReceivables.length}</Badge></TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            <FilterBar searchValue={searchTerm} onSearchChange={setSearchTerm} searchPlaceholder="Buscar produto, marca..."
              resultsCount={{ showing: filteredReceivables.length, total: currentReceivables.length }}>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="paid">Quitado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Período" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="30days">30 dias</SelectItem>
                  <SelectItem value="90days">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </FilterBar>

            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {searchTerm && <ActiveFilterChip label="Busca" value={searchTerm} onRemove={() => setSearchTerm("")} />}
                {statusFilter !== "all" && <ActiveFilterChip label="Status" value={statusFilter} onRemove={() => setStatusFilter("all")} />}
                {periodFilter !== "all" && <ActiveFilterChip label="Período" value={periodFilter === "30days" ? "30 dias" : "90 dias"} onRemove={() => setPeriodFilter("all")} />}
                {brandFilter !== "all" && <ActiveFilterChip label="Marca" value={brandFilter} onRemove={() => setBrandFilter("all")} />}
              </div>
            )}

            <div className="space-y-3">
              {filteredReceivables.length === 0 ? (
                <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">Nenhuma compra encontrada</p></CardContent></Card>
              ) : (
                filteredReceivables.map((rec) => (
                  <CustomerReceivableItem key={rec.id} receivable={rec} isArchived={activeTab === "archived"}
                    onDelete={activeTab === "archived" ? handleDeleteClick : undefined} getStatusBadge={getStatusBadge} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {filteredReceivables.length > 0 && (
          <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4">
                  <span className="font-semibold">📊 Ver Estatísticas</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${statsOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent><CardContent className="pt-0"><CustomerStatsChart receivables={currentReceivables} /></CardContent></CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </main>

      <AddNotebookItemDialog open={showAddDialog} onOpenChange={setShowAddDialog}
        onSuccess={() => { setRefreshKey(prev => prev + 1); loadReceivables("active"); loadReceivables("archived"); }} />
      <DeletePortalReceivableDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} receivable={selectedReceivable}
        onDeleted={() => { loadReceivables("archived"); setSelectedReceivable(null); }} />
    </div>
  );
};

export default CustomerPortal;
