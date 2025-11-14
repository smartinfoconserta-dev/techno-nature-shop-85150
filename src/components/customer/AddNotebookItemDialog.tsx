import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { customerRequestsStore } from "@/lib/customerRequestsStore";
import { Loader2 } from "lucide-react";
import WarrantySelector from "@/components/admin/WarrantySelector";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddNotebookItemDialog = ({ open, onOpenChange, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [notes, setNotes] = useState("");
  const [warrantyDays, setWarrantyDays] = useState(90);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim() || !salePrice) {
      toast.error("Preencha o nome do produto e o valor");
      return;
    }

    const price = parseFloat(salePrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Valor inválido");
      return;
    }

    setLoading(true);
    try {
      await customerRequestsStore.createRequest({
        productName: productName.trim(),
        salePrice: price,
        notes: notes.trim() || undefined,
        warrantyMonths: Math.floor(warrantyDays / 30),
      });

      toast.success("Solicitação enviada com sucesso!");
      setProductName("");
      setSalePrice("");
      setNotes("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Item na Caderneta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="productName">Nome do Produto *</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Pendrive Kingston 32GB"
              required
            />
          </div>

          <div>
            <Label htmlFor="salePrice">Valor de Venda (R$) *</Label>
            <Input
              id="salePrice"
              type="number"
              step="0.01"
              min="0"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={3}
            />
          </div>

          <div>
            <WarrantySelector value={warrantyDays} onChange={setWarrantyDays} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar Solicitação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
