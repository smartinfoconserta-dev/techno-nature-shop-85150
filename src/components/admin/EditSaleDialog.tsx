import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product } from "@/lib/productsStore";
import { ExternalLink, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EditSaleDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    buyerName: string,
    buyerCpf: string,
    salePrice: number,
    saleDate: string,
    invoiceUrl: string,
    cash?: number,
    pix?: number,
    card?: number
  ) => void;
}

const EditSaleDialog = ({
  product,
  open,
  onOpenChange,
  onConfirm,
}: EditSaleDialogProps) => {
  const [buyerName, setBuyerName] = useState("");
  const [buyerCpf, setBuyerCpf] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [saleDateOpen, setSaleDateOpen] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [cash, setCash] = useState("");
  const [pix, setPix] = useState("");
  const [card, setCard] = useState("");

  useEffect(() => {
    if (open && product) {
      setBuyerName(product.buyerName || "");
      setBuyerCpf(product.buyerCpf || "");
      setSalePrice(product.salePrice?.toString() || "");
      setSaleDate(product.saleDate ? product.saleDate.split("T")[0] : "");
      setInvoiceUrl(product.invoiceUrl || "");
      setCash(product.paymentBreakdown?.cash?.toString() || "");
      setPix(product.paymentBreakdown?.pix?.toString() || "");
      setCard(product.paymentBreakdown?.card?.toString() || "");
    }
  }, [open, product]);

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(salePrice);
    const cashValue = parseFloat(cash) || undefined;
    const pixValue = parseFloat(pix) || undefined;
    const cardValue = parseFloat(card) || undefined;
    const trimmedCpf = buyerCpf.replace(/\D/g, '');
    
    if (!buyerName.trim()) {
      alert("Por favor, informe o nome do comprador");
      return;
    }

    if (!trimmedCpf || trimmedCpf.length !== 11) {
      alert("Por favor, informe um CPF válido com 11 dígitos");
      return;
    }
    
    if (isNaN(price) || price <= 0) {
      alert("Preço de venda inválido");
      return;
    }

    if (!saleDate) {
      alert("Por favor, informe a data da venda");
      return;
    }

    onConfirm(
      buyerName.trim(),
      buyerCpf,
      price,
      new Date(saleDate).toISOString(),
      invoiceUrl.trim(),
      cashValue,
      pixValue,
      cardValue
    );
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>✏️ Editar Venda</DialogTitle>
          <DialogDescription>
            Atualize as informações da venda de {product?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buyerName">Nome do comprador</Label>
            <Input
              id="buyerName"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyerCpf">CPF do comprador</Label>
            <Input
              id="buyerCpf"
              placeholder="000.000.000-00"
              value={buyerCpf}
              onChange={(e) => setBuyerCpf(formatCpf(e.target.value))}
              maxLength={14}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salePrice">Preço de venda</Label>
            <Input
              id="salePrice"
              type="number"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Data da venda</Label>
            <Popover open={saleDateOpen} onOpenChange={setSaleDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !saleDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {saleDate ? format(new Date(saleDate), "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={saleDate ? new Date(saleDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setSaleDate(format(date, "yyyy-MM-dd"));
                      setSaleDateOpen(false);
                    }
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceUrl">Nota Fiscal (URL)</Label>
            <Input
              id="invoiceUrl"
              type="url"
              value={invoiceUrl}
              onChange={(e) => setInvoiceUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
            {product?.invoiceUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open(product.invoiceUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Nota Fiscal Atual
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Formas de Pagamento (opcional)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="cash" className="text-xs">💵 Dinheiro</Label>
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
              <div>
                <Label htmlFor="pix" className="text-xs">📱 PIX</Label>
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
              <div>
                <Label htmlFor="card" className="text-xs">💳 Cartão</Label>
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

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSaleDialog;
