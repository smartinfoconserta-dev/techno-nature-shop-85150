import { useState, useEffect } from "react";
import { receivablesStore, Receivable } from "@/lib/receivablesStore";
import { customersStore, Customer } from "@/lib/customersStore";
import { productsStore } from "@/lib/productsStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DollarSign, Calendar, Eye, Trash2, AlertCircle, UserPlus, Edit, FileDown, ShoppingCart, CheckCircle2, Archive, TestTube, Search, X, ChevronDown, Users, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateCustomerReportPDF } from "@/lib/generateCustomerReportPDF";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import AddPaymentDialog from "./AddPaymentDialog";
import ReceivableDetailsDialog from "./ReceivableDetailsDialog";
import CustomerReceivablesDialog from "./CustomerReceivablesDialog";
import { AddCustomerPaymentDialog } from "./AddCustomerPaymentDialog";
import NewCustomerDialog from "./NewCustomerDialog";
import EditCustomerDialog from "./EditCustomerDialog";
import QuickSaleDialog from "./QuickSaleDialog";
import ReceivableItem from "./ReceivableItem";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ReceivablesTab = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [filteredReceivables, setFilteredReceivables] = useState<Receivable[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [receivableToDelete, setReceivableToDelete] = useState<string | null>(null);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [showEditCustomerDialog, setShowEditCustomerDialog] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [showCustomerPaymentDialog, setShowCustomerPaymentDialog] = useState(false);
  const [showQuickSaleDialog, setShowQuickSaleDialog] = useState(false);
  const [creatingTestData, setCreatingTestData] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "customer">("list");

  useEffect(() => {
    loadReceivables();
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
  }, [receivables, statusFilter, customerFilter, searchQuery]);

  const loadReceivables = () => {
    const data = activeTab === "active" 
      ? receivablesStore.getActiveReceivables()
      : receivablesStore.getArchivedReceivables();
    setReceivables(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const applyFilters = () => {
    let filtered = [...receivables];

    // Filtro de busca por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.productName.toLowerCase().includes(query) ||
        r.customerName.toLowerCase().includes(query) ||
        (r.notes && r.notes.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (customerFilter !== "all") {
      filtered = filtered.filter(r => r.customerId === customerFilter);
    }

    setFilteredReceivables(filtered);
  };

  const groupByCustomer = () => {
    const groups: Record<string, Receivable[]> = {};
    filteredReceivables.forEach(r => {
      if (!groups[r.customerId]) {
        groups[r.customerId] = [];
      }
      groups[r.customerId].push(r);
    });
    return Object.entries(groups).map(([customerId, receivables]) => ({
      customerId,
      customerName: receivables[0].customerName,
      receivables,
      totalAmount: receivables.reduce((sum, r) => sum + r.totalAmount, 0),
      paidAmount: receivables.reduce((sum, r) => sum + r.paidAmount, 0),
      remainingAmount: receivables.reduce((sum, r) => sum + r.remainingAmount, 0),
    })).sort((a, b) => a.customerName.localeCompare(b.customerName));
  };

  const getStatusCounts = () => {
    const all = receivables.length;
    const pending = receivables.filter(r => r.status === "pending").length;
    const partial = receivables.filter(r => r.status === "partial").length;
    const paid = receivables.filter(r => r.status === "paid").length;
    return { all, pending, partial, paid };
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCustomerFilter("all");
  };

  const getTotals = () => {
    const total = receivables.reduce((sum, r) => sum + r.totalAmount, 0);
    const paid = receivables.reduce((sum, r) => sum + r.paidAmount, 0);
    const remaining = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);
    const overdue = receivablesStore.getOverdueReceivables().reduce((sum, r) => sum + r.remainingAmount, 0);
    
    return { total, paid, remaining, overdue };
  };

  const handleAddPayment = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = async (
    payments: Array<{method: "cash" | "pix" | "card", amount: number}>, 
    date: string, 
    notes?: string
  ) => {
    try {
      if (!selectedReceivable) return;

      // Registrar cada pagamento sequencialmente
      for (const payment of payments) {
        await receivablesStore.addPayment(selectedReceivable.id, {
          amount: payment.amount,
          paymentDate: date,
          paymentMethod: payment.method,
          notes: notes || `Pagamento via ${payment.method === "cash" ? "Dinheiro" : payment.method === "pix" ? "PIX" : "Cartão"}`,
        });
      }

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      toast({
        title: "Pagamento registrado!",
        description: `R$ ${totalPaid.toFixed(2)} adicionado com sucesso`,
      });

      loadReceivables();
      setSelectedReceivable(null);
      setShowPaymentDialog(false);
    } catch (error: any) {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setShowDetailsDialog(true);
  };

  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowCustomerDialog(true);
  };

  const handleDeleteReceivable = async () => {
    if (!receivableToDelete) return;

    try {
      // Buscar o recebível para verificar se está vinculado a um produto
      const receivable = receivablesStore.getReceivableById(receivableToDelete);
      
      // Se tiver productId, cancelar a venda do produto também
      if (receivable?.productId) {
        try {
          await productsStore.cancelSale(receivable.productId);
        } catch (err) {
          console.error("Erro ao cancelar venda do produto:", err);
        }
      }
      
      // Deletar o recebível
      await receivablesStore.deleteReceivable(receivableToDelete);
      toast({
        title: "Conta removida",
        description: "Conta a receber removida com sucesso e produto devolvido ao estoque",
      });
      loadReceivables();
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setReceivableToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="destructive" className="gap-1">🔴 PENDENTE</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500 gap-1">🟡 PARCIAL</Badge>;
      case "paid":
        return <Badge className="bg-green-500 gap-1">🟢 QUITADO</Badge>;
      default:
        return null;
    }
  };

  const isOverdue = (receivable: Receivable) => {
    if (!receivable.dueDate || receivable.status === "paid") return false;
    return new Date(receivable.dueDate) < new Date();
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setShowEditCustomerDialog(true);
  };

  const handleCustomerUpdated = () => {
    loadReceivables();
  };

  const handleCustomerCreated = () => {
    loadReceivables();
  };

  const totals = getTotals();
  const statusCounts = getStatusCounts();
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    customersStore.getActiveCustomers().then(setCustomers);
  }, []);

  const hasActiveFilters = searchQuery || statusFilter !== "all" || customerFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">📒 Caderneta</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie vendas a prazo e pagamentos dos clientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowNewCustomerDialog(true)} variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Cliente
          </Button>
          <Button onClick={() => setShowQuickSaleDialog(true)} className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Nova Venda
          </Button>
        </div>
      </div>

      {/* Tabs Ativas/Arquivadas */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Button
              variant={activeTab === "active" ? "default" : "outline"}
              onClick={() => setActiveTab("active")}
              className="flex-1 gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              ATIVAS ({receivablesStore.getActiveReceivables().length})
            </Button>
            <Button
              variant={activeTab === "archived" ? "default" : "outline"}
              onClick={() => setActiveTab("archived")}
              className="flex-1 gap-2"
            >
              <Archive className="h-4 w-4" />
              HISTÓRICO ({receivablesStore.getArchivedReceivables().length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Barra de Pesquisa */}
            <div className="w-full">
              <label className="text-sm font-medium mb-2 block">Pesquisar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por produto, cliente ou observações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros de Status e Cliente */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas ({statusCounts.all})</SelectItem>
                    <SelectItem value="pending">🔴 Pendente ({statusCounts.pending})</SelectItem>
                    <SelectItem value="partial">🟡 Parcial ({statusCounts.partial})</SelectItem>
                    <SelectItem value="paid">🟢 Quitado ({statusCounts.paid})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Cliente</label>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.code} - {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botão Limpar Filtros */}
              {hasActiveFilters && (
                <div className="flex-1 min-w-[200px] flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full gap-2"
                  >
                    <X className="h-4 w-4" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">R$ {totals.total.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pago</p>
                <p className="text-2xl font-bold text-green-600">R$ {totals.paid.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Receber</p>
                <p className="text-2xl font-bold text-blue-600">R$ {totals.remaining.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencido</p>
                <p className="text-2xl font-bold text-red-600">R$ {totals.overdue.toFixed(2)}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contas */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>📋 Lista de Contas ({filteredReceivables.length})</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4 mr-2" />
                Lista Completa
              </Button>
              <Button
                variant={viewMode === "customer" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("customer")}
              >
                <Users className="w-4 h-4 mr-2" />
                Por Cliente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReceivables.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma conta a receber encontrada</p>
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {filteredReceivables.map((receivable) => (
                <ReceivableItem
                  key={receivable.id}
                  receivable={receivable}
                  isOverdue={isOverdue(receivable)}
                  onViewDetails={(r) => {
                    setSelectedReceivable(r);
                    setShowDetailsDialog(true);
                  }}
                  onAddPayment={handleAddPayment}
                  onEditCustomer={async (customerId) => {
                    const customer = await customersStore.getCustomerById(customerId);
                    if (customer) {
                      setCustomerToEdit(customer);
                      setShowEditCustomerDialog(true);
                    }
                  }}
                  onGeneratePDF={async (customerId) => {
                    const customer = await customersStore.getCustomerById(customerId);
                    if (customer) {
                      const receivables = receivablesStore.getReceivablesByCustomer(customerId);
                      generateCustomerReportPDF(customer, receivables);
                      toast({ title: "PDF gerado com sucesso!" });
                    }
                  }}
                  onDelete={(r) => setReceivableToDelete(r.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {groupByCustomer().map((group) => (
                <Collapsible key={group.customerId} className="border rounded-lg">
                  <div className="p-4">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-medium">{group.customerName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {group.receivables.length} {group.receivables.length === 1 ? 'venda' : 'vendas'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <p className="text-muted-foreground">Total: R$ {group.totalAmount.toFixed(2)}</p>
                            <p className="text-green-600">Pago: R$ {group.paidAmount.toFixed(2)}</p>
                            <p className="text-red-600 font-medium">Resta: R$ {group.remainingAmount.toFixed(2)}</p>
                          </div>
                          <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-4 space-y-2">
                      <div className="flex gap-2 mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const customer = await customersStore.getCustomerById(group.customerId);
                            if (customer) {
                              setCustomerToEdit(customer);
                              setShowEditCustomerDialog(true);
                            }
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar Cliente
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const customer = await customersStore.getCustomerById(group.customerId);
                            if (customer) {
                              const receivables = receivablesStore.getReceivablesByCustomer(group.customerId);
                              generateCustomerReportPDF(customer, receivables);
                              toast({ title: "PDF gerado com sucesso!" });
                            }
                          }}
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          Gerar PDF
                        </Button>
                      </div>
                      {group.receivables.map((receivable) => (
                        <ReceivableItem
                          key={receivable.id}
                          receivable={receivable}
                          isOverdue={isOverdue(receivable)}
                          onViewDetails={(r) => {
                            setSelectedReceivable(r);
                            setShowDetailsDialog(true);
                          }}
                          onAddPayment={handleAddPayment}
                          onEditCustomer={async (customerId) => {
                            const customer = await customersStore.getCustomerById(customerId);
                            if (customer) {
                              setCustomerToEdit(customer);
                              setShowEditCustomerDialog(true);
                            }
                          }}
                          onGeneratePDF={async (customerId) => {
                            const customer = await customersStore.getCustomerById(customerId);
                            if (customer) {
                              const receivables = receivablesStore.getReceivablesByCustomer(customerId);
                              generateCustomerReportPDF(customer, receivables);
                              toast({ title: "PDF gerado com sucesso!" });
                            }
                          }}
                          onDelete={(r) => setReceivableToDelete(r.id)}
                        />
                      ))}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NewCustomerDialog
        open={showNewCustomerDialog}
        onOpenChange={setShowNewCustomerDialog}
        onCustomerCreated={handleCustomerCreated}
      />

      <EditCustomerDialog
        open={showEditCustomerDialog}
        onOpenChange={setShowEditCustomerDialog}
        customer={customerToEdit}
        onCustomerUpdated={handleCustomerUpdated}
      />

      <AddPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        receivable={selectedReceivable}
        onConfirm={handleConfirmPayment}
      />

      <ReceivableDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        receivable={selectedReceivable}
      />

      <CustomerReceivablesDialog
        open={showCustomerDialog}
        onOpenChange={(open) => {
          setShowCustomerDialog(open);
          if (!open) loadReceivables();
        }}
        customerId={selectedCustomerId}
      />

      <AddCustomerPaymentDialog
        open={showCustomerPaymentDialog}
        onOpenChange={setShowCustomerPaymentDialog}
        customerId={selectedCustomerId}
        onSuccess={loadReceivables}
      />

      <QuickSaleDialog
        open={showQuickSaleDialog}
        onOpenChange={setShowQuickSaleDialog}
        onSuccess={loadReceivables}
      />

      <AlertDialog open={!!receivableToDelete} onOpenChange={(open) => !open && setReceivableToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta conta a receber? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReceivable}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReceivablesTab;
