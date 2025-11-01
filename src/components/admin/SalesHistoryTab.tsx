import { useEffect, useState } from "react";
import { productsStore, Product } from "@/lib/productsStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, DollarSign, Package, Percent } from "lucide-react";

const SalesHistoryTab = () => {
  const [soldProducts, setSoldProducts] = useState<Product[]>([]);
  const [totals, setTotals] = useState({
    totalGross: 0,
    totalExpenses: 0,
    netProfit: 0,
    averageMargin: 0,
    soldCount: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const products = productsStore.getSoldProducts();
    const computedTotals = productsStore.computeTotals();
    setSoldProducts(products);
    setTotals(computedTotals);
  };

  const calculateProductProfit = (product: Product) => {
    const totalExpenses = product.expenses.reduce((sum, e) => sum + e.value, 0);
    const salePrice = product.salePrice || 0;
    const profit = salePrice - totalExpenses;
    const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
    return { profit, margin, totalExpenses };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">📊 Histórico de Vendas</h2>
        <p className="text-muted-foreground">
          Acompanhe todas as vendas realizadas e seus respectivos compradores.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totals.totalGross.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.soldCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totals.netProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.averageMargin.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de vendas */}
      <div className="space-y-4">
        {soldProducts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhuma venda registrada ainda</CardTitle>
              <CardDescription>
                Quando você vender um produto, ele aparecerá aqui no histórico.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          soldProducts.map((product) => {
            const { profit, margin, totalExpenses } = calculateProductProfit(product);
            
            return (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded border border-border"
                    />
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Marca: {product.brand}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Comprador</p>
                          <p className="font-semibold text-foreground">
                            {product.buyerName || "Não informado"}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Data da venda</p>
                          <p className="font-semibold text-foreground">
                            {product.saleDate
                              ? format(new Date(product.saleDate), "dd 'de' MMM. yyyy", {
                                  locale: ptBR,
                                })
                              : "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Preço de venda</p>
                          <p className="font-semibold text-green-600">
                            R$ {(product.salePrice || 0).toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Gastos</p>
                          <p className="font-semibold text-orange-600">
                            R$ {totalExpenses.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 pt-2 border-t border-border">
                        <div>
                          <p className="text-sm text-muted-foreground">Lucro</p>
                          <p
                            className={`text-xl font-bold ${
                              profit >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            R$ {profit.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Margem</p>
                          <p className="text-xl font-bold text-foreground">
                            {margin.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SalesHistoryTab;
