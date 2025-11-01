import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, CreditCard, Smartphone } from "lucide-react";
import { Product, productsStore, ProductExpense } from "@/lib/productsStore";
import { useToast } from "@/hooks/use-toast";
import MarkAsSoldDialog from "./MarkAsSoldDialog";
import AddExpenseDialog from "./AddExpenseDialog";
import ExpenseDetailsDialog from "./ExpenseDetailsDialog";

interface ProductExpenseRowProps {
  product: Product;
  onUpdate: () => void;
}

const ProductExpenseRow = ({ product, onUpdate }: ProductExpenseRowProps) => {
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [showExpenseDetailsDialog, setShowExpenseDetailsDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ProductExpense | null>(null);
  const [showSoldDialog, setShowSoldDialog] = useState(false);
  const { toast } = useToast();

  const totalExpenses = product.expenses.reduce((sum, e) => sum + e.value, 0);
  const currentSalePrice = product.salePrice || 0;
  const profit = currentSalePrice - totalExpenses;
  const margin = currentSalePrice > 0 ? (profit / currentSalePrice) * 100 : 0;

  const handleAddExpense = (
    label: string,
    value: number,
    paymentMethod: "cash" | "pix" | "card",
    description?: string,
    sellerCpf?: string
  ) => {
    productsStore.addExpense(product.id, label, value, paymentMethod, description, sellerCpf);
    toast({
      title: "Gasto adicionado",
      description: `${label} de R$ ${value.toFixed(2)}`,
    });
    onUpdate();
  };

  const handleExpenseClick = (expense: ProductExpense) => {
    setSelectedExpense(expense);
    setShowExpenseDetailsDialog(true);
  };

  const handleDeleteExpense = () => {
    if (!selectedExpense) return;
    productsStore.removeExpense(product.id, selectedExpense.id);
    toast({
      title: "Gasto removido",
    });
    setShowExpenseDetailsDialog(false);
    setSelectedExpense(null);
    onUpdate();
  };

  const handleConfirmSale = (buyerName: string, buyerCpf: string, cash: number, pix: number, card: number) => {
    productsStore.markAsSold(product.id, buyerName, buyerCpf, cash, pix, card);
    toast({
      title: "Produto vendido! 🎉",
      description: `${product.name} foi vendido para ${buyerName}.`,
    });
    setShowSoldDialog(false);
    onUpdate();
  };

  const getPaymentIcon = (paymentMethod?: "cash" | "pix" | "card") => {
    switch (paymentMethod) {
      case "cash":
        return <DollarSign className="w-3 h-3" />;
      case "pix":
        return <Smartphone className="w-3 h-3" />;
      case "card":
        return <CreditCard className="w-3 h-3" />;
      default:
        return null;
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
              <Badge
                key={expense.id}
                variant="secondary"
                className="gap-2 cursor-pointer hover:bg-secondary/80"
                onClick={() => handleExpenseClick(expense)}
              >
                {getPaymentIcon(expense.paymentMethod)}
                {expense.label}: R$ {expense.value.toFixed(2)}
              </Badge>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddExpenseDialog(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-2">
            Total de gastos: R$ {totalExpenses.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
            <Button onClick={() => setShowSoldDialog(true)} className="w-full">
              Marcar como Vendido
            </Button>
          </div>
        </div>
      </div>

      <MarkAsSoldDialog
        product={product}
        open={showSoldDialog}
        onOpenChange={setShowSoldDialog}
        onConfirm={handleConfirmSale}
        onUpdate={onUpdate}
      />

      <AddExpenseDialog
        open={showAddExpenseDialog}
        onOpenChange={setShowAddExpenseDialog}
        onConfirm={handleAddExpense}
      />

      <ExpenseDetailsDialog
        expense={selectedExpense}
        open={showExpenseDetailsDialog}
        onOpenChange={setShowExpenseDetailsDialog}
        onDelete={handleDeleteExpense}
      />
    </div>
  );
};

export default ProductExpenseRow;

