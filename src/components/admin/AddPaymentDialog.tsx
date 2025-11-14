import { useState } from "react";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { StickyDialogContent, DialogHeader, DialogFooter } from "@/components/ui/sticky-dialog";
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
  onConfirm: (payments: Array<{method: "cash" | "pix" | "card", amount: number}>, date: string, notes?: string) => void;
}

const AddPaymentDialog = ({ open, onOpenChange, receivable, onConfirm }: AddPaymentDialogProps) => {
  const [cash, setCash] = useState("");
  const [pix, setPix] = useState("");
  const [card, setCard] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    const cashValue = parseFloat(cash) || 0;
    const pixValue = parseFloat(pix) || 0;
    const cardValue = parseFloat(card) || 0;
    const totalPayment = cashValue + pixValue + cardValue;

    if (totalPayment <= 0) {
      alert("Informe ao menos uma forma de pagamento");
      return;
    }

    if (!receivable) return;

    if (totalPayment > receivable.remainingAmount) {
      alert("Valor total é maior que o saldo devedor");
      return;
    }

    // Criar múltiplos pagamentos (um para cada método usado)
    const payments: Array<{method: "cash" | "pix" | "card", amount: number}> = [];
    
    if (cashValue > 0) payments.push({ method: "cash", amount: cashValue });
    if (pixValue > 0) payments.push({ method: "pix", amount: pixValue });
    if (cardValue > 0) payments.push({ method: "card", amount: cardValue });

    onConfirm(payments, paymentDate, notes || undefined);
    handleClose();
  };

  const handleClose = () => {
    setCash("");
    setPix("");
    setCard("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    onOpenChange(false);
  };

  if (!receivable) return null;

  const totalPayment = (parseFloat(cash) || 0) + (parseFloat(pix) || 0) + (parseFloat(card) || 0);
  const newBalance = receivable.remainingAmount - totalPayment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <StickyDialogContent
        maxWidth="md"
        header={
          <DialogHeader>
            <DialogTitle>💵 Registrar Pagamento</DialogTitle>
          </DialogHeader>
        }
        footer={
          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>
              Registrar Pagamento
            </Button>
          </DialogFooter>
        }
      >
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
              <h4 className="font-semibold">Formas de Pagamento</h4>
              
              <div className="space-y-2">
                <Label>💵 Dinheiro</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label>📱 PIX</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pix}
                  onChange={(e) => setPix(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label>💳 Cartão</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={card}
                  onChange={(e) => setCard(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                  placeholder="0.00"
                />
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-semibold">Total do Pagamento:</span>
                  <span className="text-xl font-bold text-green-600">
                    R$ {totalPayment.toFixed(2)}
                  </span>
                </div>
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

              {totalPayment > 0 && (
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
      </StickyDialogContent>
    </Dialog>
  );
};

export default AddPaymentDialog;
