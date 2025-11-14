import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receivable, ReceivablePayment } from "@/lib/receivablesStore";
import { Separator } from "@/components/ui/separator";

interface EditPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: ReceivablePayment | null;
  receivable: Receivable | null;
  onConfirm: (paymentId: string, updates: { amount?: number; paymentDate?: string; paymentMethod?: string; notes?: string }) => void;
}

const EditPaymentDialog = ({ open, onOpenChange, payment, receivable, onConfirm }: EditPaymentDialogProps) => {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pix" | "card">("cash");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (payment && open) {
      setAmount(payment.amount.toString());
      setPaymentDate(payment.paymentDate);
      setPaymentMethod(payment.paymentMethod);
      setNotes(payment.notes || "");
    }
  }, [payment, open]);

  const handleConfirm = () => {
    const amountValue = parseFloat(amount);

    if (!amountValue || amountValue <= 0) {
      alert("Informe um valor válido");
      return;
    }

    if (!receivable || !payment) return;

    // Calcular total sem o pagamento atual
    const otherPaymentsTotal = receivable.payments
      .filter(p => p.id !== payment.id)
      .reduce((sum, p) => sum + p.amount, 0);

    // Verificar se novo valor não ultrapassa o total
    if (otherPaymentsTotal + amountValue > receivable.totalAmount) {
      alert("O valor total dos pagamentos não pode ultrapassar o valor da compra");
      return;
    }

    onConfirm(payment.id, {
      amount: amountValue,
      paymentDate,
      paymentMethod,
      notes: notes || undefined
    });

    handleClose();
  };

  const handleClose = () => {
    setAmount("");
    setPaymentDate("");
    setPaymentMethod("cash");
    setNotes("");
    onOpenChange(false);
  };

  if (!receivable || !payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>✏️ Editar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4 py-4">
            <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{receivable.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Produto:</span>
                <span>{receivable.productName}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Total:</span>
                <span className="font-semibold">R$ {receivable.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Pagamento (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data do Pagamento</Label>
              <Input
                id="date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={(value: "cash" | "pix" | "card") => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Dinheiro</SelectItem>
                  <SelectItem value="pix">📱 PIX</SelectItem>
                  <SelectItem value="card">💳 Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Observações sobre este pagamento..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPaymentDialog;
