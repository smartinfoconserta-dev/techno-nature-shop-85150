import { useState } from "react";
import { Product } from "@/lib/productsStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign, XCircle } from "lucide-react";

interface ProductRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onConfirm: (keepAsCredit: boolean) => void;
}

export const ProductRefundDialog = ({
  open,
  onOpenChange,
  product,
  onConfirm,
}: ProductRefundDialogProps) => {
  const [refundOption, setRefundOption] = useState<"credit" | "no-credit">("credit");

  const handleConfirm = () => {
    onConfirm(refundOption === "credit");
    onOpenChange(false);
  };

  // Calcular total pago - usar paymentBreakdown se disponível, senão usar salePrice
  const totalPaid = product.paymentBreakdown
    ? (product.paymentBreakdown.cash || 0) +
      (product.paymentBreakdown.pix || 0) +
      (product.paymentBreakdown.card || 0)
    : (product.salePrice || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔄 Opções de Devolução
          </DialogTitle>
          <DialogDescription>
            Este produto possui pagamentos registrados. Como deseja proceder com o cancelamento?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do Produto */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Produto</p>
              <p className="font-semibold">{product.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Comprador</p>
              <p className="font-semibold">{product.buyerName || "Não informado"}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">💵 Dinheiro</p>
                <p className="text-sm font-semibold">R$ {(product.paymentBreakdown?.cash || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">📱 PIX</p>
                <p className="text-sm font-semibold">R$ {(product.paymentBreakdown?.pix || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">💳 Cartão</p>
                <p className="text-sm font-semibold">R$ {(product.paymentBreakdown?.card || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">Total Pago</p>
              <p className="text-lg font-bold text-green-600">R$ {totalPaid.toFixed(2)}</p>
            </div>
          </div>

          {/* Opções de Devolução */}
          <div className="space-y-3">
            <p className="text-sm font-medium">⚠️ Como deseja proceder?</p>
            <RadioGroup value={refundOption} onValueChange={(value) => setRefundOption(value as "credit" | "no-credit")}>
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="credit" id="credit" className="mt-1" />
                <Label htmlFor="credit" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">Deixar em HAVER (Crédito)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O valor pago (R$ {totalPaid.toFixed(2)}) ficará disponível como crédito para o cliente usar em compras futuras
                  </p>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="no-credit" id="no-credit" className="mt-1" />
                <Label htmlFor="no-credit" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="font-semibold">Cancelar SEM crédito</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cancela a venda e retorna o produto ao catálogo, sem gerar crédito para o cliente
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar Devolução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};