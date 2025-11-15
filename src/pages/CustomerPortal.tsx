import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LogOut, ShoppingBag, DollarSign, Clock, Shield, Loader2, FileText, Notebook, Plus, Trash2, XCircle, CheckCircle2, Archive, ChevronDown, Printer } from "lucide-react";
import { calculateWarranty } from "@/lib/warrantyHelper";
import { format } from "date-fns";
import { CustomerStatsChart } from "@/components/customer/CustomerStatsChart";
import { SummaryCard } from "@/components/customer/SummaryCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AddNotebookItemDialog } from "@/components/customer/AddNotebookItemDialog";
import { CustomerRequestsList } from "@/components/customer/CustomerRequestsList";
import { DeletePortalReceivableDialog } from "@/components/customer/DeletePortalReceivableDialog";
import { CustomerReceivableItem } from "@/components/customer/CustomerReceivableItem";
import SearchBar from "@/components/SearchBar";
import WarrantyBadge from "@/components/admin/WarrantyBadge";
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
  costPrice?: number;
  basePrice?: number;
  salePrice?: number;
  profit?: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installments: number;
  installmentRate: number;
  dueDate?: string;
  status: "pending" | "partial" | "paid";
  payments: any[];
  warranty?: number;
  warrantyExpiresAt?: string;
  notes?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  autoArchived?: boolean;
}

// Helper para converter meses em dias
const convertMonthsToDays = (months?: number): number => {
  if (!months || months === 0) return 0;
  return months * 30;
};

const CustomerPortal = () => {
  const navigate = useNavigate();
  const { customer, logout } = useCustomerAuth();
  const { toast } = useToast();
  const [activeReceivables, setActiveReceivables] = useState<Receivable[]>([]);
  const [archivedReceivables, setArchivedReceivables] = useState<Receivable[]>([]);
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [archivedSearchTerm, setArchivedSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!customer) {
      navigate("/login");
      return;
    }

    // Carregar compras ativas e arquivadas
    loadReceivables("active");
    loadReceivables("archived");
  }, [customer, navigate]);

  const loadReceivables = async (view: "active" | "archived" = "active") => {
    try {
      setLoading(true);
      
      // Obter token do localStorage
      const token = localStorage.getItem("customer_token");
      
      if (!token) {
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para acessar seu histórico.",
          variant: "destructive",
        });
        logout();
        navigate("/login");
        return;
      }

      // Chamar função de backend portal-get-receivables
      const { data, error } = await supabase.functions.invoke('portal-get-receivables', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { view },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'FETCH_FAILED');
      }

      if (view === "active") {
        setActiveReceivables(data.receivables || []);
      } else {
        setArchivedReceivables(data.receivables || []);
      }

    } catch (error: any) {
      const errorCode = error?.message || error?.error || 'UNKNOWN_ERROR';
      
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'UNAUTHORIZED' || errorCode === 'INVALID_TOKEN') {
        toast({
          title: "Sessão expirada",
          description: "Sua sessão expirou. Faça login novamente.",
          variant: "destructive",
        });
        logout();
        navigate("/login");
      } else {
        toast({
          title: "Erro ao carregar histórico",
          description: "Não foi possível carregar suas compras. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handlePrintPDF = () => {
    if (filteredReceivables.length === 0) {
      toast({
        title: "Nenhuma compra para imprimir",
        description: "Nenhuma compra encontrada.",
        variant: "destructive",
      });
      return;
    }

    // Calcular totais baseados nos filtros
    const pdfTotals = {
      totalComprado: filteredReceivables.reduce((sum, r) => sum + r.totalAmount, 0),
      totalPago: filteredReceivables.reduce((sum, r) => sum + r.paidAmount, 0),
      totalDevedor: filteredReceivables.reduce((sum, r) => sum + r.remainingAmount, 0),
    };

    generateCustomerPortalPDF(
      {
        code: customer.code,
        name: customer.name,
        cpfCnpj: customer.cpfCnpj,
        phone: customer.phone,
      },
      filteredReceivables,
      "Todas as compras"
    );

    toast({
      title: "PDF gerado com sucesso",
      description: "O extrato foi baixado para seu computador.",
    });
  };

  if (!customer) return null;

  // Usar receivables corretos baseado na tab ativa
  const receivables = activeTab === "active" ? activeReceivables : archivedReceivables;

  const totalComprado = receivables.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPago = receivables.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalDevedor = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);

  // Filtrar compras apenas pela busca
  const filteredReceivables = receivables.filter(r => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const matchesName = r.productName.toLowerCase().includes(search);
    const matchesBrand = r.brand?.toLowerCase().includes(search);
    const matchesValue = r.totalAmount.toString().includes(search);
    
    return matchesName || matchesBrand || matchesValue;
  });

  // Calcular progresso de pagamento
  const progressoPagamento = totalComprado > 0 ? (totalPago / totalComprado) * 100 : 0;

  // Verificar vencimentos próximos (7 dias)
  const proximosVencimentos = receivables.filter(r => {
    if (!r.dueDate || r.status === "paid") return false;
    const daysUntilDue = Math.ceil((new Date(r.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  });

  const getStatusBadge = (status: Receivable["status"]) => {
    const variants = {
      pending: { label: "Pendente", variant: "destructive" as const },
      partial: { label: "Parcial", variant: "default" as const },
      paid: { label: "Quitado", variant: "secondary" as const },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando seu histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4">
          {/* Título no topo */}
          <div className="pt-3 pb-2 border-b">
            <h1 className="text-lg font-semibold text-center">Portal do Cliente</h1>
          </div>
          
          {/* Nome + Botões */}
          <div className="py-3 flex justify-between items-center gap-3">
            <p className="text-xs text-muted-foreground truncate">{customer.name}</p>
            
            <div className="flex gap-1.5 flex-shrink-0">
              {/* Novo Item - com texto */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-3">
                    <Notebook className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">Novo Item</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Minha Caderneta</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 mt-4">
                    <CustomerRequestsList refreshKey={refreshKey} />
                    <Button 
                      onClick={() => setShowAddDialog(true)} 
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Novo Item
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              
              {/* PDF - apenas ícone */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrintPDF}
                className="h-8 w-8 p-0"
                title="Imprimir PDF"
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>
              
              {/* Sair - apenas ícone */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="h-8 w-8 p-0"
                title="Sair"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="container mx-auto px-4 py-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <SummaryCard
            title="Total Comprado"
            value={`R$ ${totalComprado.toFixed(2)}`}
            icon={ShoppingBag}
            animated
          />
          
          <SummaryCard
            title="Total Pago"
            value={`R$ ${totalPago.toFixed(2)}`}
            icon={DollarSign}
            valueColor="text-green-600"
            progress={progressoPagamento}
            animated
          />
          
          <SummaryCard
            title="Saldo Devedor"
            value={`R$ ${totalDevedor.toFixed(2)}`}
            icon={Clock}
            valueColor="text-red-600"
            alert={
              proximosVencimentos.length > 0
                ? {
                    show: true,
                    text: `⚠️ ${proximosVencimentos.length} conta(s) vencendo em até 7 dias`
                  }
                : undefined
            }
            animated
          />
        </div>

        {/* Card de Crédito Disponível */}
        {customer.creditBalance && customer.creditBalance > 0 && (
          <Card className="border-green-500 mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Crédito Disponível (Haver)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                R$ {customer.creditBalance.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Disponível para suas próximas compras
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lista de Compras */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Minhas Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Ativas
                </TabsTrigger>
                <TabsTrigger value="archived" className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Arquivadas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-0">
                {/* Campo de busca */}
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto, valor, marca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {filteredReceivables.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {activeReceivables.length === 0 ? "Nenhuma compra ativa" : "Nenhuma compra encontrada com os filtros aplicados"}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {filteredReceivables.map(receivable => (
                      <CustomerReceivableItem
                        key={receivable.id}
                        receivable={receivable}
                        isArchived={false}
                        getStatusBadge={getStatusBadge}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="archived" className="mt-0">
                {archivedReceivables.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma compra arquivada
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {archivedReceivables.map(receivable => (
                      <CustomerReceivableItem
                        key={receivable.id}
                        receivable={receivable}
                        isArchived={true}
                        onDelete={(id) => {
                          const rec = archivedReceivables.find(r => r.id === id);
                          if (rec) {
                            setSelectedReceivable(rec);
                            setShowDeleteDialog(true);
                          }
                        }}
                        getStatusBadge={getStatusBadge}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Gráficos - Collapsible (fechado por padrão) */}
        <Collapsible defaultOpen={false}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    📊 Estatísticas e Histórico
                  </CardTitle>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <CustomerStatsChart receivables={receivables} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

      </main>

      <AddNotebookItemDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
      
      <DeletePortalReceivableDialog
        receivable={selectedReceivable}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDeleted={() => {
          loadReceivables("active");
          loadReceivables("archived");
        }}
      />
    </div>
  );
};

export default CustomerPortal;
