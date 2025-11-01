import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Check, DollarSign } from "lucide-react";
import { Product, productsStore } from "@/lib/productsStore";
import { useToast } from "@/hooks/use-toast";

interface ProductExpenseRowProps {
  product: Product;
  onUpdate: () => void;
}

const ProductExpenseRow = ({ product, onUpdate }: ProductExpenseRowProps) => {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseLabel, setExpenseLabel] = useState("");
  const [expenseValue, setExpenseValue] = useState("");
  const [salePrice, setSalePrice] = useState(product.salePrice?.toString() || "");
  const [isEditingSalePrice, setIsEditingSalePrice] = useState(false);
  const { toast } = useToast();

  const totalExpenses = product.expenses.reduce((sum, e) => sum + e.value, 0);
  const currentSalePrice = parseFloat(salePrice) || 0;
  const profit = currentSalePrice - totalExpenses;
  const margin = currentSalePrice > 0 ? (profit / currentSalePrice) * 100 : 0;

  const handleAddExpense = () => {
    if (!expenseLabel.trim() || !expenseValue) {
      alert("Preencha o nome e o valor do gasto");
      return;
    }

    productsStore.addExpense(product.id, expenseLabel.trim(), parseFloat(expenseValue));
    toast({
      title: "Gasto adicionado",
      description: `${expenseLabel} de R$ ${parseFloat(expenseValue).toFixed(2)}`,
    });
    
    setExpenseLabel("");
    setExpenseValue("");
    setIsAddingExpense(false);
    onUpdate();
  };

  const handleRemoveExpense = (expenseId: string) => {
    productsStore.removeExpense(product.id, expenseId);
    toast({
      title: "Gasto removido",
    });
    onUpdate();
  };

  const handleSaveSalePrice = () => {
    if (salePrice) {
      productsStore.updateProduct(product.id, { salePrice: parseFloat(salePrice) });
      toast({
        title: "Preço de venda atualizado",
      });
      setIsEditingSalePrice(false);
      onUpdate();
    }
  };

  const handleMarkAsSold = () => {
    if (!salePrice) {
      alert("Informe o preço de venda antes de marcar como vendido");
      return;
    }

    if (confirm(`Marcar "${product.name}" como vendido por R$ ${parseFloat(salePrice).toFixed(2)}?`)) {
      productsStore.markAsSold(product.id, parseFloat(salePrice));
      toast({
        title: "Produto vendido! 🎉",
        description: `${product.name} foi marcado como vendido.`,
      });
      onUpdate();
    }
  };

  return (
    <div className="p-4 bg-card border border-border rounded-lg space-y-4">
      <div className="flex items-start gap-4">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-20 h-20 object-cover rounded border border-border"
        />
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{product.name}</h4>
          <p className="text-sm text-muted-foreground">{product.brand}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Preço base: R$ {product.price.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Gastos
          </label>
          <div className="flex flex-wrap gap-2">
            {product.expenses.map((expense) => (
              <Badge key={expense.id} variant="secondary" className="gap-2">
                {expense.label}: R$ {expense.value.toFixed(2)}
                <button
                  onClick={() => handleRemoveExpense(expense.id)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {!isAddingExpense ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingExpense(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                <Input
                  placeholder="Ex: Viagem"
                  value={expenseLabel}
                  onChange={(e) => setExpenseLabel(e.target.value)}
                  className="flex-1 h-8"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={expenseValue}
                  onChange={(e) => setExpenseValue(e.target.value)}
                  className="w-24 h-8"
                />
                <Button size="sm" onClick={handleAddExpense}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddingExpense(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-2">
            Total de gastos: R$ {totalExpenses.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Preço de Venda
            </label>
            {!isEditingSalePrice ? (
              <Button
                variant="outline"
                onClick={() => setIsEditingSalePrice(true)}
                className="w-full justify-start"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {salePrice ? `R$ ${parseFloat(salePrice).toFixed(2)}` : "Definir preço"}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0.00"
                />
                <Button size="icon" onClick={handleSaveSalePrice}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Lucro</label>
            <p
              className={`text-2xl font-bold ${
                profit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              R$ {profit.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              Margem: {margin.toFixed(1)}%
            </p>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleMarkAsSold}
              disabled={!salePrice}
              className="w-full"
            >
              Marcar como Vendido
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductExpenseRow;
