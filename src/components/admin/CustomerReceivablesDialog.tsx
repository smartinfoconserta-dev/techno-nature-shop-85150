import { useState, useEffect } from "react";
import { receivablesStore, Receivable } from "@/lib/receivablesStore";
import { customersStore } from "@/lib/customersStore";
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
import { DollarSign, Calendar, Eye, AlertCircle, Edit, FileDown } from "lucide-react";
import { generateCustomerReportPDF } from "@/lib/generateCustomerReportPDF";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AddPaymentDialog from "./AddPaymentDialog";
import ReceivableDetailsDialog from "./ReceivableDetailsDialog";
import { AddManualReceivableDialog } from "./AddManualReceivableDialog";
import { AddCustomerPaymentDialog } from "./AddCustomerPaymentDialog";
import EditCustomerDialog from "./EditCustomerDialog";
import { useToast } from "@/hooks/use-toast";

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
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showNewSaleDialog, setShowNewSaleDialog] = useState(false);
  const [showCustomerPaymentDialog, setShowCustomerPaymentDialog] = useState(false);
  const [showEditCustomerDialog, setShowEditCustomerDialog] = useState(false);

  useEffect(() => {
    if (open && customerId) {
      loadCustomerReceivables();
    }
  }, [open, customerId]);

  const loadCustomerReceivables = () => {
    if (!customerId) return;
    const data = receivablesStore.getReceivablesByCustomer(customerId);
    setReceivables(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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

      loadCustomerReceivables();
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
                      generateCustomerReportPDF(customer, receivables);
                      toast({
                        title: "PDF gerado!",
                        description: "Download iniciado com sucesso",
                      });
                    }
                  }} 
                  variant="outline"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Baixar PDF
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
    </>
  );
};

export default CustomerReceivablesDialog;
