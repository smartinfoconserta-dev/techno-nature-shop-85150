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
  onSubmit: (code: string, active: boolean) => void;
  editingCoupon?: Coupon | null;
}

const CouponForm = ({ open, onOpenChange, onSubmit, editingCoupon }: CouponFormProps) => {
  const [code, setCode] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (open && editingCoupon) {
      setCode(editingCoupon.code);
      setActive(editingCoupon.active);
    } else if (!open) {
      setCode("");
      setActive(true);
    }
  }, [open, editingCoupon]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      alert("Por favor, informe o código do cupom");
      return;
    }

    onSubmit(code.trim(), active);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCoupon ? "✏️ Editar Cupom" : "🎟️ Novo Cupom B2B"}
          </DialogTitle>
          <DialogDescription>
            {editingCoupon
              ? "Atualize o código do cupom de lojista"
              : "Crie um cupom que dá acesso ao preço de lojista configurado no produto. O cupom não aplica desconto percentual, apenas desbloqueia o 'preço com desconto' do produto."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código do Cupom *</Label>
            <Input
              id="code"
              placeholder="Ex: LOJISTA2025"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={20}
              required
            />
            <p className="text-xs text-muted-foreground">
              Entre 3 e 20 caracteres. Este cupom desbloqueará o preço de lojista nos produtos.
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
