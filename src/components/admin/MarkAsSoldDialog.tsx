import { useState } from "react";
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

interface MarkAsSoldDialogProps {
  product: Product;
  salePrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (buyerName: string) => void;
}

const MarkAsSoldDialog = ({
  product,
  salePrice,
  open,
  onOpenChange,
  onConfirm,
}: MarkAsSoldDialogProps) => {
  const [buyerName, setBuyerName] = useState("");

  const handleConfirm = () => {
    const trimmedName = buyerName.trim();
    if (!trimmedName) {
      alert("Por favor, informe o nome do comprador");
      return;
    }
    onConfirm(trimmedName);
    setBuyerName("");
  };

  const handleCancel = () => {
    setBuyerName("");
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
            <p className="text-sm">
              <span className="font-medium">Preço:</span> R${" "}
              {salePrice.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyerName">Nome do comprador *</Label>
            <Input
              id="buyerName"
              placeholder="Ex: João Silva"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirm();
                }
              }}
            />
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
