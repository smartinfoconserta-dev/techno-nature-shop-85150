import { useState } from "react";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { StickyDialogContent, DialogHeader, DialogFooter } from "@/components/ui/sticky-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign, CreditCard, Smartphone } from "lucide-react";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    label: string,
    value: number,
    paymentMethod: "cash" | "pix" | "card",
    description?: string,
    sellerCpf?: string
  ) => void;
}

const AddExpenseDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: AddExpenseDialogProps) => {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pix" | "card">("pix");
  const [description, setDescription] = useState("");
  const [sellerCpf, setSellerCpf] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);

    if (!label.trim()) {
      alert("Por favor, informe o nome do gasto");
      return;
    }

    if (isNaN(numValue) || numValue <= 0) {
      alert("Valor inválido");
      return;
    }

    // Validar CPF se preenchido
    if (sellerCpf.trim()) {
      const cpfClean = sellerCpf.replace(/\D/g, "");
      if (cpfClean.length !== 11) {
        alert("CPF inválido. Deve ter 11 dígitos.");
        return;
      }
    }

    onConfirm(
      label.trim(),
      numValue,
      paymentMethod,
      description.trim() || undefined,
      sellerCpf.trim() || undefined
    );

    // Reset form
    setLabel("");
    setValue("");
    setPaymentMethod("pix");
    setDescription("");
    setSellerCpf("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLabel("");
    setValue("");
    setPaymentMethod("pix");
    setDescription("");
    setSellerCpf("");
    onOpenChange(false);
  };

  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/);
    if (match) {
      return [match[1], match[2], match[3], match[4]]
        .filter((x) => x)
        .join(".")
        .replace(/\.(\d{2})$/, "-$1");
    }
    return value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <StickyDialogContent
        maxWidth="md"
        header={
          <DialogHeader>
            <DialogTitle>💸 Adicionar Gasto</DialogTitle>
            <DialogDescription>
              Registre um novo gasto relacionado ao produto
            </DialogDescription>
          </DialogHeader>
        }
        footer={
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" form="expense-form">Adicionar</Button>
          </DialogFooter>
        }
      >
        <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Nome do gasto *</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Viagem, Hospedagem, Conserto"
              maxLength={50}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor (R$) *</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Forma de pagamento *</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as "cash" | "pix" | "card")}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                  <DollarSign className="w-4 h-4" />
                  Dinheiro
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer">
                  <Smartphone className="w-4 h-4" />
                  PIX
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="w-4 h-4" />
                  Cartão
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sellerCpf">CPF do vendedor</Label>
            <Input
              id="sellerCpf"
              value={sellerCpf}
              onChange={(e) => setSellerCpf(formatCpf(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
            />
            <p className="text-xs text-muted-foreground">Opcional</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição detalhada</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Comprado de João Silva via PIX para buscar o produto em SP"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 caracteres
            </p>
          </div>
        </form>
      </StickyDialogContent>
    </Dialog>
  );
};

export default AddExpenseDialog;
