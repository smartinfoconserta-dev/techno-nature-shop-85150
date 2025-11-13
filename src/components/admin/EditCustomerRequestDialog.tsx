import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { customerRequestsStore, CustomerRequest } from "@/lib/customerRequestsStore";
import { categoriesStore } from "@/lib/categoriesStore";
import { brandsStore } from "@/lib/brandsStore";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  request: CustomerRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditCustomerRequestDialog = ({ request, open, onOpenChange, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    productName: request.product_name,
    salePrice: request.sale_price.toString(),
    costPrice: request.cost_price?.toString() || "",
    brand: request.brand || "",
    category: request.category || "",
    warrantyMonths: request.warranty_months?.toString() || "3",
    paymentMethod: request.payment_method || "",
    installments: request.installments?.toString() || "1",
    adminNotes: request.admin_notes || "",
    notes: request.notes || "",
  });

  useEffect(() => {
    const loadOptions = async () => {
      const cats = await categoriesStore.getAllCategories();
      const brnds = await brandsStore.getAllBrands();
      setCategories(cats.map((c) => c.name));
      setBrands(brnds.map((b) => b.name));
    };
    loadOptions();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await customerRequestsStore.updateRequest(request.id, {
        product_name: formData.productName,
        sale_price: parseFloat(formData.salePrice),
        cost_price: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        brand: formData.brand || undefined,
        category: formData.category || undefined,
        warranty_months: parseInt(formData.warrantyMonths),
        payment_method: formData.paymentMethod || undefined,
        installments: parseInt(formData.installments),
        admin_notes: formData.adminNotes || undefined,
        notes: formData.notes || undefined,
      });

      toast.success("Solicitação atualizada");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar solicitação");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await customerRequestsStore.rejectRequest(request.id, formData.adminNotes);
      toast.success("Solicitação rejeitada");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao rejeitar solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Solicitação - {request.customer_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productName">Nome do Produto</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="salePrice">Valor de Venda (R$)</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div>
              <Label htmlFor="warrantyMonths">Garantia (meses)</Label>
              <Input
                id="warrantyMonths"
                type="number"
                value={formData.warrantyMonths}
                onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Select value={formData.brand} onValueChange={(value) => setFormData({ ...formData, brand: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">À Vista</SelectItem>
                  <SelectItem value="credit">Crediário</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="card">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="installments">Parcelas</Label>
              <Input
                id="installments"
                type="number"
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações do Cliente</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              disabled
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="adminNotes">Notas do Administrador</Label>
            <Textarea
              id="adminNotes"
              value={formData.adminNotes}
              onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
              rows={3}
              placeholder="Adicione notas ou motivo de rejeição..."
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            {request.status === "pending" && (
              <Button variant="destructive" onClick={handleReject} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Rejeitar
              </Button>
            )}
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
