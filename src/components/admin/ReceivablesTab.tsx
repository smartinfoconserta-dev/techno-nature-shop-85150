import { useState, useEffect } from "react";
import { receivablesStore, Receivable } from "@/lib/receivablesStore";
import { customersStore } from "@/lib/customersStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Calendar, Eye, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import AddPaymentDialog from "./AddPaymentDialog";
import ReceivableDetailsDialog from "./ReceivableDetailsDialog";
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

const ReceivablesTab = () => {
  const { toast } = useToast();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [filteredReceivables, setFilteredReceivables] = useState<Receivable[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [receivableToDelete, setReceivableToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadReceivables();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [receivables, statusFilter, customerFilter]);

  const loadReceivables = () => {
    const data = receivablesStore.getAllReceivables();
    setReceivables(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const applyFilters = () => {
    let filtered = [...receivables];

    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (customerFilter !== "all") {
      filtered = filtered.filter(r => r.customerId === customerFilter);
    }

    setFilteredReceivables(filtered);
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

  const handleConfirmPayment = (amount: number, method: "cash" | "pix" | "card", date: string, notes?: string) => {
    try {
      if (!selectedReceivable) return;

      receivablesStore.addPayment(selectedReceivable.id, {
        amount,
        paymentMethod: method,
        paymentDate: date,
        notes,
      });

      toast({
        title: "Pagamento registrado!",
        description: `R$ ${amount.toFixed(2)} adicionado com sucesso`,
      });

      loadReceivables();
      setSelectedReceivable(null);
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

  const handleDeleteReceivable = () => {
    if (!receivableToDelete) return;

    try {
      receivablesStore.deleteReceivable(receivableToDelete);
      toast({
        title: "Conta removida",
        description: "Conta a receber removida com sucesso",
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

  const totals = getTotals();
  const customers = customersStore.getActiveCustomers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">💰 Contas a Receber</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie vendas a prazo e pagamentos parciais
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pending">🔴 Pendente</SelectItem>
                  <SelectItem value="partial">🟡 Parcial</SelectItem>
                  <SelectItem value="paid">🟢 Quitado</SelectItem>
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
        <CardHeader>
          <CardTitle>📋 Lista de Contas ({filteredReceivables.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReceivables.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma conta a receber encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReceivables.map((receivable) => (
                <div
                  key={receivable.id}
                  className={`p-4 rounded-lg border-2 ${
                    isOverdue(receivable) ? "border-red-300 bg-red-50 dark:bg-red-950/20" : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(receivable.status)}
                        {isOverdue(receivable) && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            VENCIDO
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">
                        {receivable.customerCode} - {receivable.customerName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Produto: {receivable.productName}
                      </p>
                      {receivable.couponCode && (
                        <p className="text-sm text-muted-foreground">
                          🎟️ Cupom aplicado: {receivable.couponCode} (-{receivable.couponDiscount}%)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <p className="font-semibold">R$ {receivable.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pago:</span>
                      <p className="font-semibold text-green-600">R$ {receivable.paidAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Resta:</span>
                      <p className="font-bold text-red-600">R$ {receivable.remainingAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    {receivable.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Vencimento: {format(new Date(receivable.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Criado: {format(new Date(receivable.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {receivable.status !== "paid" && (
                      <Button
                        size="sm"
                        onClick={() => handleAddPayment(receivable)}
                      >
                        💵 Registrar Pagamento
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(receivable)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setReceivableToDelete(receivable.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
