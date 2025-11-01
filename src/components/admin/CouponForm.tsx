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
import { Switch } from "@/components/ui/switch";
import { Coupon } from "@/lib/couponsStore";

interface CouponFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (code: string, discountPercent: number, active: boolean) => void;
  editingCoupon?: Coupon | null;
}

const CouponForm = ({ open, onOpenChange, onSubmit, editingCoupon }: CouponFormProps) => {
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (open && editingCoupon) {
      setCode(editingCoupon.code);
      setDiscountPercent(editingCoupon.discountPercent.toString());
      setActive(editingCoupon.active);
    } else if (!open) {
      setCode("");
      setDiscountPercent("");
      setActive(true);
    }
  }, [open, editingCoupon]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const percent = parseFloat(discountPercent);

    if (!code.trim()) {
      alert("Por favor, informe o código do cupom");
      return;
    }

    if (isNaN(percent) || percent <= 0 || percent > 50) {
      alert("O desconto deve ser entre 1% e 50%");
      return;
    }

    onSubmit(code.trim(), percent, active);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCoupon ? "✏️ Editar Cupom" : "🎟️ Novo Cupom"}
          </DialogTitle>
          <DialogDescription>
            {editingCoupon
              ? "Atualize as informações do cupom de desconto"
              : "Crie um novo cupom de desconto para seus clientes"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código do Cupom *</Label>
            <Input
              id="code"
              placeholder="Ex: NATAL2025"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={20}
              required
            />
            <p className="text-xs text-muted-foreground">
              Entre 4 e 20 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount">Desconto (%)</Label>
            <Input
              id="discount"
              type="number"
              step="0.1"
              min="1"
              max="50"
              placeholder="Ex: 5"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Entre 1% e 50%
            </p>
          </div>

          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="active">Cupom Ativo</Label>
              <p className="text-xs text-muted-foreground">
                Apenas cupons ativos podem ser usados
              </p>
            </div>
            <Switch
              id="active"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingCoupon ? "Salvar" : "Criar Cupom"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CouponForm;
