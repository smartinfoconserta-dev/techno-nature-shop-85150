import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receivable, ReceivablePayment } from "@/lib/receivablesStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, CreditCard, DollarSign, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReceivableDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivable: Receivable | null;
  onEditPayment?: (payment: ReceivablePayment) => void;
  onDeletePayment?: (paymentId: string) => void;
}

const ReceivableDetailsDialog = ({ open, onOpenChange, receivable, onEditPayment, onDeletePayment }: ReceivableDetailsDialogProps) => {
  if (!receivable) return null;

  const getStatusBadge = () => {
    switch (receivable.status) {
      case "pending":
        return <Badge variant="destructive">🔴 PENDENTE</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500">🟡 PARCIAL</Badge>;
      case "paid":
        return <Badge className="bg-green-500">🟢 QUITADO</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash": return "💵";
      case "pix": return "📱";
      case "card": return "💳";
      default: return "💰";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes da Conta</DialogTitle>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações do Cliente */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>👤</span> Cliente
            </h3>
            <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Código:</span>
                <span className="font-semibold">{receivable.customerCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span>{receivable.customerName}</span>
              </div>
            </div>
          </div>

          {/* Informações do Produto */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>📦</span> Produto
            </h3>
            <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{receivable.productName}</span>
              </div>
              {receivable.couponCode && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cupom Aplicado:</span>
                    <Badge variant="outline">
                      🎟️ {receivable.couponCode} (-{receivable.couponDiscount}%)
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Valores */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Valores
            </h3>
            <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold">R$ {receivable.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Pago:</span>
                <span className="font-semibold">R$ {receivable.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Restante:</span>
                <span className="font-bold">R$ {receivable.remainingAmount.toFixed(2)}</span>
              </div>
              {receivable.dueDate && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Vencimento:</span>
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(receivable.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Histórico de Pagamentos */}
          {receivable.payments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Histórico de Pagamentos
              </h3>
              <div className="space-y-2">
                {receivable.payments.map((payment, index) => (
                  <div key={payment.id} className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-muted-foreground">
                        Pagamento #{index + 1}
                      </span>
                      <span className="font-bold text-green-600">
                        R$ {payment.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <span>{getPaymentMethodIcon(payment.paymentMethod)}</span>
                        <span className="capitalize">{payment.paymentMethod === "cash" ? "Dinheiro" : payment.paymentMethod === "pix" ? "PIX" : "Cartão"}</span>
                      </span>
                      <span className="text-muted-foreground">
                        {format(new Date(payment.paymentDate), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    {payment.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {payment.notes}
                      </p>
                    )}
                    
                    {/* Botões de ação */}
                    {onEditPayment && onDeletePayment && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditPayment(payment)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDeletePayment(payment.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          {receivable.notes && (
            <div>
              <h3 className="font-semibold mb-3">📝 Observações</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm">{receivable.notes}</p>
              </div>
            </div>
          )}

          {/* Datas */}
          <div>
            <h3 className="font-semibold mb-3">📅 Datas</h3>
            <div className="space-y-2 bg-muted/50 p-4 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em:</span>
                <span>{format(new Date(receivable.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Última atualização:</span>
                <span>{format(new Date(receivable.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceivableDetailsDialog;
