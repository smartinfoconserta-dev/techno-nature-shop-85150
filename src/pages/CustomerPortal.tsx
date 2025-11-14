import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, ShoppingBag, DollarSign, Clock, Shield, Loader2, FileText, Notebook, Plus, Trash2, XCircle, CheckCircle2, Archive } from "lucide-react";
import { calculateWarranty } from "@/lib/warrantyHelper";
import { format } from "date-fns";
import { CustomerStatsChart } from "@/components/customer/CustomerStatsChart";
import { SummaryCard } from "@/components/customer/SummaryCard";
import { PurchaseFilters } from "@/components/customer/PurchaseFilters";
import { AddNotebookItemDialog } from "@/components/customer/AddNotebookItemDialog";
import { CustomerRequestsList } from "@/components/customer/CustomerRequestsList";
import { DeletePortalReceivableDialog } from "@/components/customer/DeletePortalReceivableDialog";
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
  warrantyMonths?: number;
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [warrantyFilter, setWarrantyFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
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
        description: "Nenhuma compra encontrada para o período selecionado.",
        variant: "destructive",
      });
      return;
    }

    // Mapear valor do filtro para texto legível
    const periodLabels: Record<string, string> = {
      all: "Todos os períodos",
      "30days": "Último mês",
      "90days": "Últimos 3 meses",
      "180days": "Últimos 6 meses",
    };

    const periodLabel = periodLabels[periodFilter] || "Todos os períodos";

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
      periodLabel
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

  // Extrair marcas únicas para o filtro
  const uniqueBrands = Array.from(new Set(
    receivables.map(r => r.brand).filter(Boolean)
  )) as string[];

  // Filtrar compras
  const filteredReceivables = receivables.filter(r => {
    // Busca por nome, valor ou marca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = r.productName.toLowerCase().includes(search);
      const matchesBrand = r.brand?.toLowerCase().includes(search);
      const matchesValue = r.totalAmount.toString().includes(search);
      
      if (!matchesName && !matchesBrand && !matchesValue) return false;
    }
    
    // Filtro por status
    if (statusFilter !== "all" && r.status !== statusFilter) {
      return false;
    }
    
    // Filtro por período
    if (periodFilter !== "all") {
      const now = new Date();
      const createdDate = new Date(r.createdAt);
      const daysAgo = Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (periodFilter === "30days" && daysAgo > 30) return false;
      if (periodFilter === "90days" && daysAgo > 90) return false;
      if (periodFilter === "180days" && daysAgo > 180) return false;
    }
    
    // Filtro por marca
    if (brandFilter !== "all" && r.brand !== brandFilter) {
      return false;
    }
    
    // Filtro por garantia
    if (warrantyFilter !== "all" && r.warranty && r.createdAt) {
      const warranty = calculateWarranty(r.createdAt, r.warranty);
      
      if (warrantyFilter === "active" && !warranty.isActive) return false;
      if (warrantyFilter === "expiring" && (!warranty.isActive || warranty.daysRemaining > 7)) return false;
      if (warrantyFilter === "expired" && warranty.isActive) return false;
    }
    
    return true;
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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Portal do Cliente</h1>
            <p className="text-sm text-muted-foreground">{customer.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrintPDF} size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Imprimir PDF
            </Button>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
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

        {/* Gráficos */}
        <CustomerStatsChart receivables={receivables} />

        {/* Card de Crédito Disponível */}
        {customer.creditBalance && customer.creditBalance > 0 && (
          <Card className="border-green-500">
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

        {/* Minha Caderneta */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Notebook className="w-5 h-5" />
                Minha Caderneta
              </CardTitle>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CustomerRequestsList key={refreshKey} refreshKey={refreshKey} />
          </CardContent>
        </Card>

        {/* Lista de Compras */}
        <Card>
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
                {/* Filtros */}
                <PurchaseFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  periodFilter={periodFilter}
                  onPeriodFilterChange={setPeriodFilter}
                  warrantyFilter={warrantyFilter}
                  onWarrantyFilterChange={setWarrantyFilter}
                  brandFilter={brandFilter}
                  onBrandFilterChange={setBrandFilter}
                  brands={uniqueBrands}
                />

                {filteredReceivables.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {activeReceivables.length === 0 ? "Nenhuma compra ativa" : "Nenhuma compra encontrada com os filtros aplicados"}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredReceivables.map(receivable => {
                      return (
                        <Card key={receivable.id} className="border">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{receivable.productName}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Data: {format(new Date(receivable.createdAt), "dd/MM/yyyy")}
                                </p>
                              </div>
                              {getStatusBadge(receivable.status)}
                            </div>

                            {/* Badge de Garantia - SEMPRE EXIBIR */}
                            <div className="flex items-center gap-2 mb-3 p-3 bg-muted/50 rounded-lg">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground mr-2">Garantia:</span>
                              {receivable.warrantyMonths && receivable.warrantyMonths > 0 ? (
                                <WarrantyBadge 
                                  saleDate={receivable.createdAt}
                                  warrantyDays={convertMonthsToDays(receivable.warrantyMonths)}
                                  size="default"
                                />
                              ) : (
                                <Badge variant="outline" className="gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Sem garantia
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="font-semibold">R$ {receivable.totalAmount.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Pago</p>
                                <p className="font-semibold text-green-600">R$ {receivable.paidAmount.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Restante</p>
                                <p className="font-semibold text-red-600">R$ {receivable.remainingAmount.toFixed(2)}</p>
                              </div>
                              {receivable.dueDate && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Vencimento</p>
                                  <p className="font-semibold">{format(new Date(receivable.dueDate), "dd/MM/yyyy")}</p>
                                </div>
                              )}
                            </div>

                            {/* Histórico de Pagamentos */}
                            {receivable.payments.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm font-semibold mb-2">Pagamentos</p>
                                <div className="space-y-2">
                                  {receivable.payments.map(payment => (
                                    <div key={payment.id} className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">
                                        {format(new Date(payment.paymentDate), "dd/MM/yyyy")} - 
                                        {payment.paymentMethod === "cash" ? " Dinheiro" : 
                                         payment.paymentMethod === "pix" ? " PIX" : " Cartão"}
                                      </span>
                                      <span className="font-semibold text-green-600">
                                        R$ {payment.amount.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="archived" className="mt-0">
                {archivedReceivables.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma compra arquivada
                  </p>
                ) : (
                  <div className="space-y-4">
                    {archivedReceivables.map(receivable => {
                      return (
                        <Card key={receivable.id} className="border">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{receivable.productName}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Data: {format(new Date(receivable.createdAt), "dd/MM/yyyy")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(receivable.status)}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReceivable(receivable);
                                    setShowDeleteDialog(true);
                                  }}
                                  title="Excluir compra"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>

                            {/* Badge de Garantia - SEMPRE EXIBIR */}
                            <div className="flex items-center gap-2 mb-3 p-3 bg-muted/50 rounded-lg">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground mr-2">Garantia:</span>
                              {receivable.warrantyMonths && receivable.warrantyMonths > 0 ? (
                                <WarrantyBadge 
                                  saleDate={receivable.createdAt}
                                  warrantyDays={convertMonthsToDays(receivable.warrantyMonths)}
                                  size="default"
                                />
                              ) : (
                                <Badge variant="outline" className="gap-1 text-muted-foreground">
                                  <XCircle className="w-3 h-3" />
                                  Sem garantia
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="font-semibold">R$ {receivable.totalAmount.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Pago</p>
                                <p className="font-semibold text-green-600">R$ {receivable.paidAmount.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Restante</p>
                                <p className="font-semibold text-red-600">R$ {receivable.remainingAmount.toFixed(2)}</p>
                              </div>
                              {receivable.dueDate && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Vencimento</p>
                                  <p className="font-semibold">{format(new Date(receivable.dueDate), "dd/MM/yyyy")}</p>
                                </div>
                              )}
                            </div>

                            {/* Histórico de Pagamentos */}
                            {receivable.payments.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm font-semibold mb-2">Pagamentos</p>
                                <div className="space-y-2">
                                  {receivable.payments.map(payment => (
                                    <div key={payment.id} className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">
                                        {format(new Date(payment.paymentDate), "dd/MM/yyyy")} - 
                                        {payment.paymentMethod === "cash" ? " Dinheiro" : 
                                         payment.paymentMethod === "pix" ? " PIX" : " Cartão"}
                                      </span>
                                      <span className="font-semibold text-green-600">
                                        R$ {payment.amount.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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
