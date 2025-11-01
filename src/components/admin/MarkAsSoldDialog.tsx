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
import { Product, productsStore } from "@/lib/productsStore";
import { settingsStore } from "@/lib/settingsStore";
import { couponsStore } from "@/lib/couponsStore";
import { receivablesStore } from "@/lib/receivablesStore";
import { Customer } from "@/lib/customersStore";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CustomerSelector from "./CustomerSelector";
import NewCustomerDialog from "./NewCustomerDialog";

interface MarkAsSoldDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (buyerName: string, buyerCpf: string, cash: number, pix: number, card: number) => void;
  onUpdate: () => void;
}

const MarkAsSoldDialog = ({
  product,
  open,
  onOpenChange,
  onConfirm,
  onUpdate,
}: MarkAsSoldDialogProps) => {
  const { toast } = useToast();
  const [saleType, setSaleType] = useState<"immediate" | "receivable">("immediate");
  const [buyerName, setBuyerName] = useState("");
  const [buyerCpf, setBuyerCpf] = useState("");
  const [cash, setCash] = useState("");
  const [pix, setPix] = useState("");
  const [card, setCard] = useState("");
  
  const [couponCode, setCouponCode] = useState("");
  const [couponValidated, setCouponValidated] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [initialPayment, setInitialPayment] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);

  useEffect(() => {
    if (!open) {
      setSaleType("immediate");
      setBuyerName("");
      setBuyerCpf("");
      setCash("");
      setPix("");
      setCard("");
      setCouponCode("");
      setCouponValidated(false);
      setCouponDiscount(0);
      setCouponError("");
      setSelectedCustomer(null);
      setInitialPayment("");
      setDueDate("");
      setNotes("");
    }
  }, [open]);

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };

  const handleValidateCoupon = () => {
    const trimmedCode = couponCode.trim().toUpperCase();
    
    if (!trimmedCode) {
      setCouponError("Digite um código de cupom");
      return;
    }

    const coupon = couponsStore.getCouponByCode(trimmedCode);
    
    if (!coupon) {
      setCouponError("Cupom não encontrado");
      setCouponValidated(false);
      setCouponDiscount(0);
      return;
    }

    if (!coupon.active) {
      setCouponError("Cupom inativo");
      setCouponValidated(false);
      setCouponDiscount(0);
      return;
    }

    setCouponValidated(true);
    setCouponDiscount(coupon.discount);
    setCouponError("");
  };

  const handleCustomerCreated = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const settings = settingsStore.getSettings();
  const { digitalTaxRate, includeCashInTax } = settings.taxSettings;

  const basePrice = product.price;
  const finalPrice = couponValidated ? basePrice * (1 - couponDiscount / 100) : basePrice;

  const cashValue = parseFloat(cash) || 0;
  const pixValue = parseFloat(pix) || 0;
  const cardValue = parseFloat(card) || 0;
  const totalSale = cashValue + pixValue + cardValue;
  const digitalTotal = pixValue + cardValue;
  
  const taxableAmount = includeCashInTax ? totalSale : digitalTotal;
  const taxAmount = taxableAmount * (digitalTaxRate / 100);

  const initialPaymentValue = parseFloat(initialPayment) || 0;
  const remainingAmount = finalPrice - initialPaymentValue;

  const handleConfirm = () => {
    if (saleType === "immediate") {
      const trimmedName = buyerName.trim();
      const trimmedCpf = buyerCpf.replace(/\D/g, '');
      
      if (!trimmedName) {
        toast({ title: "Erro", description: "Informe o nome do comprador", variant: "destructive" });
        return;
      }

      if (!trimmedCpf || trimmedCpf.length !== 11) {
        toast({ title: "Erro", description: "Informe um CPF válido", variant: "destructive" });
        return;
      }

      if (totalSale <= 0) {
        toast({ title: "Erro", description: "Informe ao menos uma forma de pagamento", variant: "destructive" });
        return;
      }

      onConfirm(trimmedName, buyerCpf, cashValue, pixValue, cardValue);
    } else {
      if (!selectedCustomer) {
        toast({ title: "Erro", description: "Selecione um cliente", variant: "destructive" });
        return;
      }

      try {
        const receivable = receivablesStore.addReceivable({
          customerId: selectedCustomer.id,
          customerCode: selectedCustomer.code,
          customerName: selectedCustomer.name,
          productId: product.id,
          productName: product.name,
          totalAmount: finalPrice,
          paidAmount: initialPaymentValue,
          couponCode: couponValidated ? couponCode.trim().toUpperCase() : undefined,
          couponDiscount: couponValidated ? couponDiscount : undefined,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
          payments: initialPaymentValue > 0 ? [{
            amount: initialPaymentValue,
            paymentDate: new Date().toISOString(),
            paymentMethod: "cash",
            notes: "Pagamento inicial",
          }] : [],
        });

        productsStore.markAsSoldOnCredit(product.id, selectedCustomer.name, selectedCustomer.cpfCnpj, finalPrice, receivable.id);

        toast({ title: "Venda registrada!", description: "Conta a receber criada com sucesso" });
        onUpdate();
        onOpenChange(false);
      } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🎉 Confirmar Venda</DialogTitle>
          <DialogDescription>Complete os dados para registrar a venda</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
            <p className="text-sm"><span className="font-medium">Produto:</span> {product.name}</p>
            <p className="text-sm"><span className="font-medium">Preço Original:</span> R$ {basePrice.toFixed(2)}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">🎟️ Cupom de Desconto</h4>
            <div className="flex gap-2">
              <Input placeholder="Código do cupom" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponValidated(false); setCouponError(""); }} />
              <Button type="button" variant="outline" onClick={handleValidateCoupon}>Validar</Button>
            </div>
            {couponValidated && <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg"><Check className="h-4 w-4" /><span className="text-sm font-medium">Cupom "{couponCode}" válido! {couponDiscount}% de desconto</span></div>}
            {couponError && <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg"><X className="h-4 w-4" /><span className="text-sm font-medium">{couponError}</span></div>}
            {couponValidated && <div className="bg-primary/10 p-3 rounded-lg"><div className="flex justify-between items-center"><span className="font-medium">Novo Valor:</span><span className="text-xl font-bold text-primary">R$ {finalPrice.toFixed(2)}</span></div></div>}
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold">💰 Tipo de Venda</h4>
            <RadioGroup value={saleType} onValueChange={(v) => setSaleType(v as any)}>
              <div className="flex items-center space-x-2"><RadioGroupItem value="immediate" id="immediate" /><Label htmlFor="immediate" className="font-normal cursor-pointer">Pagamento Imediato</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="receivable" id="receivable" /><Label htmlFor="receivable" className="font-normal cursor-pointer">Contas a Receber</Label></div>
            </RadioGroup>
          </div>

          <Separator />

          {saleType === "immediate" ? (
            <>
              <div className="space-y-2"><Label>Nome *</Label><Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="João Silva" /></div>
              <div className="space-y-2"><Label>CPF *</Label><Input value={buyerCpf} onChange={(e) => setBuyerCpf(formatCpf(e.target.value))} maxLength={14} placeholder="000.000.000-00" /></div>
              <div><h4 className="font-semibold mb-3">Formas de Pagamento</h4><div className="space-y-3"><div className="space-y-2"><Label>💵 Dinheiro</Label><Input type="number" step="0.01" min="0" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0.00" /></div><div className="space-y-2"><Label>📱 PIX</Label><Input type="number" step="0.01" min="0" value={pix} onChange={(e) => setPix(e.target.value)} placeholder="0.00" /></div><div className="space-y-2"><Label>💳 Cartão</Label><Input type="number" step="0.01" min="0" value={card} onChange={(e) => setCard(e.target.value)} placeholder="0.00" /></div></div></div>
              <div className="bg-muted p-4 rounded-lg space-y-2"><div className="flex justify-between"><span className="font-semibold">Total:</span><span className="text-xl font-bold text-green-600">R$ {totalSale.toFixed(2)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Imposto ({digitalTaxRate}%):</span><span className="font-semibold text-orange-600">R$ {taxAmount.toFixed(2)}</span></div></div>
            </>
          ) : (
            <><CustomerSelector selectedCustomer={selectedCustomer} onCustomerSelect={setSelectedCustomer} onNewCustomer={() => setShowNewCustomerDialog(true)} /><div className="bg-muted/50 p-4 rounded-lg space-y-3"><div className="flex justify-between"><span className="font-medium">Valor Total:</span><span className="text-xl font-bold">R$ {finalPrice.toFixed(2)}</span></div><div className="space-y-2"><Label>Pagamento Inicial</Label><Input type="number" step="0.01" min="0" max={finalPrice} value={initialPayment} onChange={(e) => setInitialPayment(e.target.value)} placeholder="0.00" /></div><div className="flex justify-between"><span className="text-muted-foreground">Restante:</span><span className="text-lg font-bold text-red-600">R$ {remainingAmount.toFixed(2)}</span></div><div className="space-y-2"><Label>Vencimento</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div><div className="space-y-2"><Label>Observações</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Informações adicionais" /></div></div></>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm}>Confirmar Venda</Button>
        </DialogFooter>
      </DialogContent>

      <NewCustomerDialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog} onCustomerCreated={handleCustomerCreated} />
    </Dialog>
  );
};

export default MarkAsSoldDialog;
