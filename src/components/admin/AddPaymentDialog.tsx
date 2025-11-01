import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receivable } from "@/lib/receivablesStore";
import { Separator } from "@/components/ui/separator";

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivable: Receivable | null;
  onConfirm: (amount: number, method: "cash" | "pix" | "card", date: string, notes?: string) => void;
}

const AddPaymentDialog = ({ open, onOpenChange, receivable, onConfirm }: AddPaymentDialogProps) => {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pix" | "card">("pix");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      alert("Informe um valor válido");
      return;
    }

    if (!receivable) return;

    if (amountValue > receivable.remainingAmount) {
      alert("Valor do pagamento é maior que o saldo devedor");
      return;
    }

    onConfirm(amountValue, paymentMethod, paymentDate, notes || undefined);
    handleClose();
  };

  const handleClose = () => {
    setAmount("");
    setPaymentMethod("pix");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    onOpenChange(false);
  };

  if (!receivable) return null;

  const newBalance = receivable.remainingAmount - (parseFloat(amount) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>💵 Registrar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{receivable.customerCode} - {receivable.customerName}</span>
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Já Pago:</span>
              <span className="text-green-600">R$ {receivable.paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Restante:</span>
              <span className="font-bold text-red-600">R$ {receivable.remainingAmount.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Valor do Pagamento (R$) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                max={receivable.remainingAmount}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="method">Forma de Pagamento *</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Dinheiro</SelectItem>
                  <SelectItem value="pix">📱 PIX</SelectItem>
                  <SelectItem value="card">💳 Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Data do Pagamento *</Label>
              <Input
                id="date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais sobre o pagamento"
                rows={2}
              />
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Novo Saldo Devedor:</span>
                  <span className="text-lg font-bold">
                    R$ {Math.max(0, newBalance).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Registrar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentDialog;
