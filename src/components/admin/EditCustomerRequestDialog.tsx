import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { customerRequestsStore, CustomerRequest } from "@/lib/customerRequestsStore";
import { receivablesStore } from "@/lib/receivablesStore";
import { categoriesStore } from "@/lib/categoriesStore";
import { brandsStore } from "@/lib/brandsStore";
import { Loader2, CheckCircle2, XCircle, Check } from "lucide-react";
import WarrantySelector from "./WarrantySelector";

interface Props {
  request: CustomerRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditCustomerRequestDialog = ({ request, open, onOpenChange, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    productName: request.product_name,
    salePrice: request.sale_price.toString(),
    costPrice: request.cost_price?.toString() || "",
    brand: request.brand || "",
    category: request.category || "",
    warrantyMonths: (request.warranty_months ?? 90).toString(), // Já está em dias
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
        warranty_months: parseInt(formData.warrantyMonths), // Salvar dias diretamente
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
      await customerRequestsStore.permanentlyDeleteRequest(request.id);
      toast.success("Solicitação rejeitada e excluída");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao rejeitar solicitação");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndConvert = async () => {
    // Validações
    if (!formData.productName.trim()) {
      toast.error("Nome do produto é obrigatório");
      return;
    }
    if (!formData.salePrice || parseFloat(formData.salePrice) <= 0) {
      toast.error("Preço de venda deve ser maior que zero");
      return;
    }
    if (!formData.costPrice || parseFloat(formData.costPrice) <= 0) {
      toast.error("Preço de custo é obrigatório");
      return;
    }
    if (!formData.brand) {
      toast.error("Marca é obrigatória");
      return;
    }
    if (!formData.category) {
      toast.error("Categoria é obrigatória");
      return;
    }
    // Forma de pagamento é opcional - pode ser definida depois

    const salePrice = parseFloat(formData.salePrice);
    const costPrice = parseFloat(formData.costPrice);

    if (costPrice >= salePrice) {
      toast.error("Preço de custo deve ser menor que o preço de venda");
      return;
    }

    setConfirmLoading(true);
    try {
      // Primeiro atualiza a solicitação com todos os dados
      await customerRequestsStore.updateRequest(request.id, {
        product_name: formData.productName,
        sale_price: salePrice,
        cost_price: costPrice,
        brand: formData.brand,
        category: formData.category,
        warranty_months: Math.floor(parseInt(formData.warrantyMonths) / 30),
        payment_method: formData.paymentMethod,
        installments: parseInt(formData.installments),
        installment_rate: parseFloat(formData.installments) > 1 ? 0 : undefined,
        admin_notes: formData.adminNotes || undefined,
        notes: formData.notes || undefined,
      });

      // Calcular total com juros se tiver parcelamento
      const installments = parseInt(formData.installments);
      const installmentRate = installments > 1 ? 0 : 0; // Taxa será 0 por enquanto
      const totalAmount = salePrice * (1 + (installmentRate / 100));

      // Calcular data de vencimento (30 dias a partir de hoje)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Criar receivable
      const receivable = await receivablesStore.addReceivable({
        customerId: request.customer_id,
        customerCode: "", // Será preenchido pelo backend se necessário
        customerName: request.customer_name,
        productId: request.id, // Usando ID da solicitação como productId
        productName: formData.productName,
        costPrice: costPrice,
        salePrice: salePrice,
        totalAmount: totalAmount,
        paidAmount: 0,
        dueDate: dueDate.toISOString().split('T')[0],
        payments: [],
        source: "manual" as any,
        warranty: parseInt(formData.warrantyMonths),
        warrantyMonths: Math.floor(parseInt(formData.warrantyMonths) / 30),
        notes: formData.adminNotes || formData.notes,
      });

      // Marcar solicitação como confirmada e vincular ao receivable
      await customerRequestsStore.confirmAndConvert(request.id, receivable.id);
      
      // Deletar permanentemente a solicitação após converter
      await customerRequestsStore.permanentlyDeleteRequest(request.id);

      toast.success("✅ Solicitação confirmada e convertida em venda!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao confirmar solicitação: " + (error as Error).message);
    } finally {
      setConfirmLoading(false);
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
              <WarrantySelector
                value={parseInt(formData.warrantyMonths)}
                onChange={(days) => {
                  setFormData({ ...formData, warrantyMonths: days.toString() });
                }}
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
                  <SelectValue placeholder="Definir depois (opcional)" />
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
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading || confirmLoading}>
              Cancelar
            </Button>
            {request.status === "pending" && (
              <>
                <Button variant="destructive" onClick={handleReject} disabled={loading || confirmLoading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Rejeitar
                </Button>
                <Button 
                  onClick={handleConfirmAndConvert} 
                  disabled={loading || confirmLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {confirmLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Confirmar e Converter em Venda
                </Button>
              </>
            )}
            <Button onClick={handleUpdate} disabled={loading || confirmLoading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
