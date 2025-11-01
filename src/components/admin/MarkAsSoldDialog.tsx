import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product } from "@/lib/productsStore";
import { Separator } from "@/components/ui/separator";

interface MarkAsSoldDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (buyerName: string, buyerCpf: string, cash: number, pix: number, card: number) => void;
}

const MarkAsSoldDialog = ({
  product,
  open,
  onOpenChange,
  onConfirm,
}: MarkAsSoldDialogProps) => {
  const [buyerName, setBuyerName] = useState("");
  const [buyerCpf, setBuyerCpf] = useState("");
  const [cash, setCash] = useState("");
  const [pix, setPix] = useState("");
  const [card, setCard] = useState("");

  useEffect(() => {
    if (!open) {
      setBuyerName("");
      setBuyerCpf("");
      setCash("");
      setPix("");
      setCard("");
    }
  }, [open]);

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };

  const cashValue = parseFloat(cash) || 0;
  const pixValue = parseFloat(pix) || 0;
  const cardValue = parseFloat(card) || 0;
  const totalSale = cashValue + pixValue + cardValue;
  const digitalTotal = pixValue + cardValue;
  const taxAmount = digitalTotal * 0.06;

  const handleConfirm = () => {
    const trimmedName = buyerName.trim();
    const trimmedCpf = buyerCpf.replace(/\D/g, '');
    
    if (!trimmedName) {
      alert("Por favor, informe o nome do comprador");
      return;
    }

    if (!trimmedCpf || trimmedCpf.length !== 11) {
      alert("Por favor, informe um CPF válido com 11 dígitos");
      return;
    }

    if (totalSale <= 0) {
      alert("Pelo menos uma forma de pagamento deve ser maior que zero");
      return;
    }

    onConfirm(trimmedName, buyerCpf, cashValue, pixValue, cardValue);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🎉 Confirmar Venda</DialogTitle>
          <DialogDescription>
            Informe o nome do comprador para registrar esta venda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Produto:</span> {product.name}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyerName">Nome do comprador *</Label>
            <Input
              id="buyerName"
              placeholder="Ex: João Silva"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyerCpf">CPF do comprador *</Label>
            <Input
              id="buyerCpf"
              placeholder="000.000.000-00"
              value={buyerCpf}
              onChange={(e) => setBuyerCpf(formatCpf(e.target.value))}
              maxLength={14}
            />
          </div>

          <Separator className="my-4" />

          <div>
            <h4 className="font-semibold mb-3">Formas de Pagamento</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cash">💵 Dinheiro (R$)</Label>
                <Input
                  id="cash"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix">📱 PIX (R$)</Label>
                <Input
                  id="pix"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pix}
                  onChange={(e) => setPix(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="card">💳 Cartão (R$)</Label>
                <Input
                  id="card"
                  type="number"
                  step="0.01"
                  min="0"
                  value={card}
                  onChange={(e) => setCard(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">💰 Total da venda:</span>
              <span className="text-xl font-bold text-green-600">
                R$ {totalSale.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">💻 Digital (PIX + Cartão):</span>
              <span className="font-semibold">R$ {digitalTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">📊 Imposto (6%):</span>
              <span className="font-semibold text-orange-600">
                R$ {taxAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">💵 Dinheiro:</span>
              <span className="font-semibold">R$ {cashValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar Venda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarkAsSoldDialog;
