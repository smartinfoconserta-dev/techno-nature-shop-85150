import { useState, useEffect } from "react";
import { productsStore, Product } from "@/lib/productsStore";
import { monthlyReportsStore } from "@/lib/monthlyReportsStore";
import { quickSalesStore } from "@/lib/quickSalesStore";
import { receivablesStore } from "@/lib/receivablesStore";
import { categoriesStore } from "@/lib/categoriesStore";
import { MetricCard } from "./MetricCard";
import { AlertsSection } from "./AlertsSection";
import { SalesTrendChart } from "./SalesTrendChart";
import CategoryProductsSection from "./CategoryProductsSection";
import {
  DollarSign,
  TrendingUp,
  Package,
  Receipt,
  Calendar,
  ShoppingBag,
  Zap,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardTabProps {
  onTabChange: (tab: string) => void;
}

const DashboardTab = ({ onTabChange }: DashboardTabProps) => {
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
  const [receivablesData, setReceivablesData] = useState({
    totalReceivable: 0,
    overdueTotal: 0,
    paymentsThisMonth: 0,
  });

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
      totalGross: (currentTotals.totalGross || 0) + (quickSalesTotals.totalSales || 0),
      totalCash: (currentTotals.totalCash || 0) + (quickSalesTotals.totalCash || 0),
      totalPix: (currentTotals.totalPix || 0) + (quickSalesTotals.totalPix || 0),
      totalCard: (currentTotals.totalCard || 0) + (quickSalesTotals.totalCard || 0),
      totalDigital: (currentTotals.totalDigital || 0) + ((quickSalesTotals.totalPix || 0) + (quickSalesTotals.totalCard || 0)),
      totalTax: (currentTotals.totalTax || 0) + (quickSalesTotals.totalTax || 0),
      totalExpenses: (currentTotals.totalExpenses || 0) + (quickSalesTotals.totalCost || 0),
      netProfit: (currentTotals.netProfit || 0) + (quickSalesTotals.totalProfit || 0),
      averageMargin: currentTotals.averageMargin || 0,
      soldCount: (currentTotals.soldCount || 0) + quickSales.length,
    });

    // Produtos em estoque
    const available = productsStore.getAvailableProducts();
    setStockCount(available.length);

    // Últimas 3 vendas
    const sold = productsStore.getSoldProducts();
    setRecentSales(sold.slice(0, 3));

    // Dados da caderneta
    const totalReceivable = receivablesStore.getTotalReceivable();
    const overdueReceivables = receivablesStore.getOverdueReceivables();
    const overdueTotal = overdueReceivables.reduce((sum, r) => sum + r.remainingAmount, 0);
    
    // Calcula pagamentos recebidos no mês atual
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const allReceivables = receivablesStore.getAllReceivables();
    let paymentsThisMonth = 0;
    
    allReceivables.forEach(receivable => {
      receivable.payments?.forEach(payment => {
        const paymentDate = new Date(payment.paymentDate);
        if (paymentDate >= monthStart) {
          paymentsThisMonth += payment.amount;
        }
      });
    });

    setReceivablesData({
      totalReceivable,
      overdueTotal,
      paymentsThisMonth,
    });
  };

  const getCurrentMonthName = () => {
    const now = new Date();
    return format(now, "MMMM yyyy", { locale: ptBR });
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-semibold text-gray-900">Dashboard</h2>
          <Badge variant="outline" className="capitalize">
            {getCurrentMonthName()}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Visão geral do seu negócio
        </p>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Cards de Informações Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Vendas Rápidas */}
        {quickSalesCount > 0 && (
          <Card className="relative overflow-hidden border-t-4 border-t-blue-600 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vendas Rápidas (mês)</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-1">
                    {quickSalesCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Produtos não catalogados
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card de Total a Receber */}
        <Card className="relative overflow-hidden border-t-4 border-t-amber-600 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total a Receber</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(receivablesData.totalReceivable)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Vendas na caderneta
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Valores Vencidos */}
        {receivablesData.overdueTotal > 0 && (
          <Card className="relative overflow-hidden border-t-4 border-t-rose-600 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valores Vencidos</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-1">
                    {formatCurrency(receivablesData.overdueTotal)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pagamentos atrasados
                  </p>
                </div>
                <div className="bg-rose-100 p-3 rounded-full">
                  <AlertCircle className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card de Pagamentos Recebidos no Mês */}
        {receivablesData.paymentsThisMonth > 0 && (
          <Card className="relative overflow-hidden border-t-4 border-t-emerald-600 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recebimentos (mês)</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-1">
                    {formatCurrency(receivablesData.paymentsThisMonth)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pagamentos da caderneta
                  </p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-full">
                  <Receipt className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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

      {/* Catálogo por Categoria */}
      <div className="space-y-8 pt-6 border-t border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-foreground">📦 Catálogo em Destaque</h2>
          <Badge variant="secondary">Produtos mais recentes</Badge>
        </div>

        {categories.map((category) => (
          <CategoryProductsSection
            key={category.id}
            categoryName={category.name}
            onViewMore={() => onTabChange("products")}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardTab;
