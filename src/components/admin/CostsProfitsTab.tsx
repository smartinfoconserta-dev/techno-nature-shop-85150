import { useState, useEffect } from "react";
import { productsStore, Product } from "@/lib/productsStore";
import ProductExpenseRow from "./ProductExpenseRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, ShoppingBag, Receipt } from "lucide-react";

const CostsProfitsTab = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [totals, setTotals] = useState({
    totalGross: 0,
    totalCash: 0,
    totalPix: 0,
    totalCard: 0,
    totalDigital: 0,
    totalTax: 0,
    totalExpenses: 0,
    netProfit: 0,
    averageMargin: 0,
    soldCount: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(productsStore.getAvailableProducts());
    setTotals(productsStore.computeTotals());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Custos e Lucros</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie os gastos e acompanhe o lucro de cada produto
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {totals.totalGross.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.soldCount} {totals.soldCount === 1 ? "vendido" : "vendidos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totals.totalExpenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totals.netProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              R$ {totals.netProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totals.averageMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">📊 Impostos Pagos</CardTitle>
            <Receipt className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {totals.totalTax.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              6% do digital
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Produtos Disponíveis</h3>
        {products.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">
              Nenhum produto disponível para gerenciar custos.
            </p>
          </div>
        ) : (
          products.map((product) => (
            <ProductExpenseRow
              key={product.id}
              product={product}
              onUpdate={loadData}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CostsProfitsTab;
