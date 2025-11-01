import { useState, useEffect } from "react";
import { productsStore, Product } from "@/lib/productsStore";
import { monthlyReportsStore } from "@/lib/monthlyReportsStore";
import { quickSalesStore } from "@/lib/quickSalesStore";
import { MetricCard } from "./MetricCard";
import { AlertsSection } from "./AlertsSection";
import { SalesTrendChart } from "./SalesTrendChart";
import {
  DollarSign,
  TrendingUp,
  Package,
  Receipt,
  Calendar,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DashboardTab = () => {
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
  const [stockCount, setStockCount] = useState(0);
  const [recentSales, setRecentSales] = useState<Product[]>([]);
  const [quickSalesCount, setQuickSalesCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Dados do mês atual
    const currentTotals = productsStore.computeCurrentMonthTotals();
    
    // Busca vendas rápidas do mês atual
    const currentMonth = format(new Date(), "yyyy-MM");
    const quickSales = quickSalesStore.getQuickSalesByMonth(currentMonth);
    const quickSalesTotals = quickSalesStore.getMonthlyTotals(currentMonth);
    
    setQuickSalesCount(quickSales.length);
    
    // Consolida totais (catálogo + vendas rápidas)
    setTotals({
      totalGross: currentTotals.totalGross + quickSalesTotals.totalSales,
      totalCash: currentTotals.totalCash + quickSalesTotals.totalCash,
      totalPix: currentTotals.totalPix + quickSalesTotals.totalPix,
      totalCard: currentTotals.totalCard + quickSalesTotals.totalCard,
      totalDigital: currentTotals.totalDigital + (quickSalesTotals.totalPix + quickSalesTotals.totalCard),
      totalTax: currentTotals.totalTax + quickSalesTotals.totalTax,
      totalExpenses: currentTotals.totalExpenses + quickSalesTotals.totalCost,
      netProfit: currentTotals.netProfit + quickSalesTotals.totalProfit,
      averageMargin: currentTotals.averageMargin, // Mantém do catálogo
      soldCount: currentTotals.soldCount + quickSales.length,
    });

    // Produtos em estoque
    const available = productsStore.getAvailableProducts();
    setStockCount(available.length);

    // Últimas 3 vendas
    const sold = productsStore.getSoldProducts();
    setRecentSales(sold.slice(0, 3));
  };

  const getCurrentMonthName = () => {
    const now = new Date();
    return format(now, "MMMM yyyy", { locale: ptBR });
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <Badge variant="outline" className="capitalize">
            {getCurrentMonthName()}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral do seu negócio
        </p>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total em Vendas"
          value={formatCurrency(totals.totalGross)}
          subtitle={`${totals.soldCount} ${totals.soldCount === 1 ? "produto vendido" : "produtos vendidos"}`}
          icon={DollarSign}
          variant="success"
        />

        <MetricCard
          title="Lucro Líquido"
          value={formatCurrency(totals.netProfit)}
          subtitle={`Margem: ${totals.averageMargin.toFixed(1)}%`}
          icon={TrendingUp}
          variant={totals.netProfit >= 0 ? "success" : "danger"}
        />

        <MetricCard
          title="Produtos em Estoque"
          value={stockCount.toString()}
          subtitle="Disponíveis para venda"
          icon={Package}
          variant="info"
        />

        <MetricCard
          title="Impostos Pagos"
          value={formatCurrency(totals.totalTax)}
          subtitle="6% das vendas digitais"
          icon={Receipt}
          variant="warning"
        />
      </div>

      {/* Card de Vendas Rápidas */}
      {quickSalesCount > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Rápidas (mês)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {quickSalesCount} {quickSalesCount === 1 ? "venda" : "vendas"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Produtos não catalogados
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Vendas */}
      <SalesTrendChart />

      {/* Alertas e Últimas Vendas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsSection />

        {/* Últimas Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Últimas Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma venda registrada ainda
              </div>
            ) : (
              <div className="space-y-3">
                {recentSales.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      {product.saleDate && (
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {format(new Date(product.saleDate), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(product.salePrice || product.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;
