import { useState, useEffect } from "react";
import { receivablesStore, Receivable } from "@/lib/receivablesStore";
import { customersStore } from "@/lib/customersStore";
import { productsStore } from "@/lib/productsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Calendar, Eye, AlertCircle, Edit, FileDown, Trash2, Pencil } from "lucide-react";
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
import { generateCustomerReportPDF } from "@/lib/generateCustomerReportPDF";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AddPaymentDialog from "./AddPaymentDialog";
import ReceivableDetailsDialog from "./ReceivableDetailsDialog";
import { AddManualReceivableDialog } from "./AddManualReceivableDialog";
import { EditReceivableDialog } from "./EditReceivableDialog";
import { AddCustomerPaymentDialog } from "./AddCustomerPaymentDialog";
import EditCustomerDialog from "./EditCustomerDialog";
import { RefundOptionsDialog } from "./RefundOptionsDialog";
import { creditHistoryStore } from "@/lib/creditHistoryStore";
import { useToast } from "@/hooks/use-toast";
import { RemoveCreditDialog } from "./RemoveCreditDialog";
import { AddCreditDialog } from "./AddCreditDialog";

interface CustomerReceivablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
}

const CustomerReceivablesDialog = ({
  open,
  onOpenChange,
  customerId,
}: CustomerReceivablesDialogProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showNewSaleDialog, setShowNewSaleDialog] = useState(false);
  const [showEditReceivableDialog, setShowEditReceivableDialog] = useState(false);
  const [receivableToEdit, setReceivableToEdit] = useState<Receivable | null>(null);
  const [showCustomerPaymentDialog, setShowCustomerPaymentDialog] = useState(false);
  const [showEditCustomerDialog, setShowEditCustomerDialog] = useState(false);
  const [deleteReceivableId, setDeleteReceivableId] = useState<string | null>(null);
  const [receivableToRefund, setReceivableToRefund] = useState<Receivable | null>(null);
  const [showCreditHistory, setShowCreditHistory] = useState(false);
  const [showRemoveCreditDialog, setShowRemoveCreditDialog] = useState(false);
  const [showAddCreditDialog, setShowAddCreditDialog] = useState(false);

  useEffect(() => {
    if (open && customerId) {
      loadCustomerReceivables();
    }
  }, [open, customerId, activeTab]);

  const loadCustomerReceivables = () => {
    if (!customerId) return;
    
    const allCustomerReceivables = receivablesStore.getReceivablesByCustomer(customerId);
    
    const filtered = activeTab === "active"
      ? allCustomerReceivables.filter(r => !r.archived)
      : allCustomerReceivables.filter(r => r.archived);
    
    setReceivables(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const customer = customerId ? customersStore.getCustomerById(customerId) : null;

  const getTotals = () => {
    const total = receivables.reduce((sum, r) => sum + r.totalAmount, 0);
    const paid = receivables.reduce((sum, r) => sum + r.paidAmount, 0);
    const remaining = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);
    const activeCount = receivables.filter(r => r.status !== "paid").length;
    
    return { total, paid, remaining, activeCount };
  };

  const handleAddPayment = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = (
    payments: Array<{method: "cash" | "pix" | "card", amount: number}>, 
    date: string, 
    notes?: string
  ) => {
    if (!selectedReceivable) return;

    try {
      // Registrar cada pagamento
      let updatedReceivable = selectedReceivable;
      
      payments.forEach(payment => {
        updatedReceivable = receivablesStore.addPayment(updatedReceivable.id, {
          amount: payment.amount,
          paymentDate: date,
          paymentMethod: payment.method,
          notes: notes || `Pagamento via ${payment.method === "cash" ? "Dinheiro" : payment.method === "pix" ? "PIX" : "Cartão"}`,
        });
      });

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      toast({
        title: "Pagamento registrado!",
        description: `R$ ${totalPaid.toFixed(2)} recebido com sucesso`,
      });

      setShowPaymentDialog(false);
      setSelectedReceivable(null);
      loadCustomerReceivables();
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

  const handleEditReceivable = (receivable: Receivable) => {
    setReceivableToEdit(receivable);
    setShowEditReceivableDialog(true);
  };

  const handleDeleteReceivable = (receivable: Receivable) => {
    setDeleteReceivableId(receivable.id);
    setReceivableToRefund(receivable);
  };

  const confirmDelete = (keepAsCredit: boolean) => {
    if (!deleteReceivableId) return;
    
    try {
      const receivable = receivables.find(r => r.id === deleteReceivableId);
      if (!receivable) throw new Error("Produto não encontrado");
      
      // Se tem pagamentos E usuário quer manter crédito
      if (receivable.paidAmount > 0 && keepAsCredit) {
        customersStore.addCredit(
          receivable.customerId, 
          receivable.paidAmount,
          `Devolução: ${receivable.productName}`
        );
        
        // Registrar no histórico
        creditHistoryStore.addTransaction({
          customerId: receivable.customerId,
          type: "add",
          amount: receivable.paidAmount,
          description: `Devolução: ${receivable.productName}`,
        });
        
        toast({
          title: "Crédito adicionado! 💰",
          description: `R$ ${receivable.paidAmount.toFixed(2)} ficou disponível em haver para ${customer?.name}`,
        });
      }
      
      // Se for produto do catálogo, devolve ao estoque
      if (receivable.source === "catalog" && receivable.productId) {
        const product = productsStore.getAllProducts().find(p => p.id === receivable.productId);
        if (product?.soldOnCredit) {
          productsStore.cancelSale(receivable.productId);
        }
      }
      
      receivablesStore.deleteReceivable(deleteReceivableId);
      
      toast({
        title: "Produto devolvido!",
        description: receivable.source === "catalog" 
          ? "Produto devolvido ao catálogo" 
          : "Produto removido da caderneta",
      });
      
      loadCustomerReceivables();
      setDeleteReceivableId(null);
      setReceivableToRefund(null);
    } catch (error: any) {
      toast({
        title: "Erro ao devolver produto",
        description: error.message,
        variant: "destructive",
      });
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {customer ? `📋 ${customer.code} - ${customer.name}` : "Contas do Cliente"}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-8rem)]">
            <div className="space-y-4 pr-4">
              {/* Resumo Financeiro do Cliente */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold">R$ {totals.total.toFixed(2)}</p>
                      </div>
                      <DollarSign className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Pago</p>
                        <p className="text-lg font-bold text-green-600">R$ {totals.paid.toFixed(2)}</p>
                      </div>
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">A Receber</p>
                        <p className="text-lg font-bold text-blue-600">R$ {totals.remaining.toFixed(2)}</p>
                      </div>
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Contas Ativas</p>
                        <p className="text-lg font-bold">{totals.activeCount}</p>
                      </div>
                      <AlertCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Card de Crédito Disponível */}
              {customer && customer.creditBalance && customer.creditBalance > 0 && (
                <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
                  <CardContent className="pt-4 pb-3">
                    <div className="space-y-3">
                      {/* Header com saldo */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-green-700 dark:text-green-400">💰 Crédito Disponível (Haver)</p>
                          <p className="text-2xl font-bold text-green-600">R$ {customer.creditBalance.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowCreditHistory(!showCreditHistory)}
                        >
                          📋 {showCreditHistory ? "Ocultar" : "Ver Histórico"}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowAddCreditDialog(true)}
                        >
                          ➕ Adicionar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => setShowRemoveCreditDialog(true)}
                        >
                          💸 Remover
                        </Button>
                      </div>

                      {/* Histórico (se expandido) */}
                      {showCreditHistory && (
                        <div className="border-t pt-3 space-y-2">
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                            📋 Histórico de Movimentações
                          </p>
                          {creditHistory.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              Nenhuma movimentação registrada
                            </p>
                          ) : (
                            creditHistory
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map(transaction => (
                                <div key={transaction.id} className="text-xs p-2 bg-white dark:bg-gray-900 rounded border">
                                  <div className="flex items-center justify-between">
                                    <span className={transaction.type === "add" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                      {transaction.type === "add" ? "✅ +" : "❌ -"}R$ {transaction.amount.toFixed(2)}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground mt-1">{transaction.description}</p>
                                </div>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabs Ativas/Arquivadas */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant={activeTab === "active" ? "default" : "outline"}
                      onClick={() => setActiveTab("active")}
                      className="flex-1"
                    >
                      📋 ATIVAS
                    </Button>
                    <Button
                      size="sm"
                      variant={activeTab === "archived" ? "default" : "outline"}
                      onClick={() => setActiveTab("archived")}
                      className="flex-1"
                    >
                      📦 HISTÓRICO
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Botões de Ação do Cliente */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setShowNewSaleDialog(true)} variant="default">
                  ➕ Nova Venda/Compra
                </Button>
                <Button onClick={() => setShowCustomerPaymentDialog(true)} variant="outline">
                  💰 Registrar Pagamento
                </Button>
                <Button onClick={() => setShowEditCustomerDialog(true)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Dados
                </Button>
                <Button 
                  onClick={() => {
                    if (customer) {
                      generateCustomerReportPDF(customer, receivables, undefined, true);
                      toast({
                        title: "PDF gerado!",
                        description: "Download iniciado com sucesso (apenas dívidas ativas)",
                      });
                    }
                  }} 
                  variant="outline"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Baixar PDF (Dívidas)
                </Button>
              </div>

              {/* Lista de Contas do Cliente */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Compras ({receivables.length})</h3>
                {receivables.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma conta encontrada para este cliente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receivables.map((receivable) => (
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
                            <h4 className="font-semibold text-base">
                              {receivable.productName}
                            </h4>
                            {receivable.couponCode && (
                              <p className="text-xs text-muted-foreground">
                                🎟️ Cupom: {receivable.couponCode} (-{receivable.couponDiscount}%)
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Total:</span>
                            <p className="font-semibold">R$ {receivable.totalAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Pago:</span>
                            <p className="font-semibold text-green-600">R$ {receivable.paidAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Resta:</span>
                            <p className="font-bold text-red-600">R$ {receivable.remainingAmount.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          {receivable.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Venc: {format(new Date(receivable.dueDate), "dd/MM/yyyy", { locale: ptBR })}
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
                          {receivable.payments.length === 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditReceivable(receivable)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteReceivable(receivable)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Devolver Produto
                          </Button>
                          {receivable.status === "paid" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (activeTab === "active") {
                                  receivablesStore.archiveReceivable(receivable.id);
                                  toast({
                                    title: "Venda arquivada!",
                                    description: "Movida para o histórico",
                                  });
                                } else {
                                  receivablesStore.unarchiveReceivable(receivable.id);
                                  toast({
                                    title: "Venda reativada!",
                                    description: "Voltou para lista ativa",
                                  });
                                }
                                loadCustomerReceivables();
                              }}
                            >
                              {activeTab === "active" ? "📦 Arquivar" : "♻️ Desarquivar"}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

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

      <AddManualReceivableDialog
        open={showNewSaleDialog}
        onOpenChange={setShowNewSaleDialog}
        customerId={customerId}
        onSuccess={loadCustomerReceivables}
      />

      <EditReceivableDialog
        open={showEditReceivableDialog}
        onOpenChange={setShowEditReceivableDialog}
        receivable={receivableToEdit}
        onSuccess={loadCustomerReceivables}
      />

      <AddCustomerPaymentDialog
        open={showCustomerPaymentDialog}
        onOpenChange={setShowCustomerPaymentDialog}
        customerId={customerId}
        onSuccess={loadCustomerReceivables}
      />

      <EditCustomerDialog
        open={showEditCustomerDialog}
        onOpenChange={setShowEditCustomerDialog}
        customer={customer}
        onCustomerUpdated={loadCustomerReceivables}
      />

      {/* Diálogo de Devolução - Condicional baseado em pagamentos */}
      {receivableToRefund && receivableToRefund.paidAmount > 0 ? (
        <RefundOptionsDialog
          open={deleteReceivableId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteReceivableId(null);
              setReceivableToRefund(null);
            }
          }}
          receivable={receivableToRefund}
          onConfirm={(keepAsCredit) => confirmDelete(keepAsCredit)}
        />
      ) : (
        <AlertDialog 
          open={deleteReceivableId !== null} 
          onOpenChange={(open) => {
            if (!open) {
              setDeleteReceivableId(null);
              setReceivableToRefund(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Devolução</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este produto da caderneta? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => confirmDelete(false)} className="bg-red-600">
                Sim, Devolver
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <RemoveCreditDialog
        open={showRemoveCreditDialog}
        onOpenChange={setShowRemoveCreditDialog}
        customer={customer}
        onConfirm={loadCustomerReceivables}
      />

      <AddCreditDialog
        open={showAddCreditDialog}
        onOpenChange={setShowAddCreditDialog}
        customer={customer}
        onConfirm={loadCustomerReceivables}
      />
    </>
  );
};

export default CustomerReceivablesDialog;
