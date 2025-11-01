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
import { ExternalLink } from "lucide-react";

interface EditSaleDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (buyerName: string, salePrice: number, saleDate: string, invoiceUrl: string) => void;
}

const EditSaleDialog = ({
  product,
  open,
  onOpenChange,
  onConfirm,
}: EditSaleDialogProps) => {
  const [buyerName, setBuyerName] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState("");

  useEffect(() => {
    if (open && product) {
      setBuyerName(product.buyerName || "");
      setSalePrice(product.salePrice?.toString() || "");
      setSaleDate(product.saleDate ? product.saleDate.split("T")[0] : "");
      setInvoiceUrl(product.invoiceUrl || "");
    }
  }, [open, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(salePrice);
    
    if (!buyerName.trim()) {
      alert("Por favor, informe o nome do comprador");
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

    onConfirm(buyerName.trim(), price, new Date(saleDate).toISOString(), invoiceUrl.trim());
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
            <Label htmlFor="saleDate">Data da venda</Label>
            <Input
              id="saleDate"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              required
            />
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
