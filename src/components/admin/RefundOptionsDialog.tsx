import { useState } from "react";
import { Receivable } from "@/lib/receivablesStore";
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

interface RefundOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivable: Receivable;
  onConfirm: (keepAsCredit: boolean) => void;
}

export const RefundOptionsDialog = ({
  open,
  onOpenChange,
  receivable,
  onConfirm,
}: RefundOptionsDialogProps) => {
  const [refundOption, setRefundOption] = useState<"credit" | "no-credit">("credit");

  const handleConfirm = () => {
    onConfirm(refundOption === "credit");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔄 Opções de Devolução
          </DialogTitle>
          <DialogDescription>
            Este produto já possui pagamentos registrados. Como deseja proceder?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do Produto */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Produto</p>
              <p className="font-semibold">{receivable.productName}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-semibold">R$ {receivable.totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pago</p>
                <p className="text-sm font-semibold text-green-600">R$ {receivable.paidAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Restante</p>
                <p className="text-sm font-semibold text-red-600">R$ {receivable.remainingAmount.toFixed(2)}</p>
              </div>
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
                    O valor pago (R$ {receivable.paidAmount.toFixed(2)}) ficará disponível para o cliente usar em compras futuras
                  </p>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="no-credit" id="no-credit" className="mt-1" />
                <Label htmlFor="no-credit" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="font-semibold">Excluir SEM crédito</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Remove tudo, sem gerar crédito para o cliente
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
