import { useState, useEffect } from "react";
import { monthlyReportsStore, MonthlyReport } from "@/lib/monthlyReportsStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, ShoppingBag, Receipt, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const MonthlyReportsTab = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [currentReport, setCurrentReport] = useState<MonthlyReport | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);

  useEffect(() => {
    loadAvailableMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadReportData(selectedMonth);
    }
  }, [selectedMonth]);

  const loadAvailableMonths = () => {
    const months = monthlyReportsStore.getAvailableMonths();
    setAvailableMonths(months);
    
    if (months.length > 0) {
      setSelectedMonth(months[0]); // Seleciona mês atual por padrão
    }
  };

  const loadReportData = (monthString: string) => {
    const currentMonth = format(new Date(), "yyyy-MM");
    const isCurrent = monthString === currentMonth;
    setIsCurrentMonth(isCurrent);

    let report: MonthlyReport | null;

    if (isCurrent) {
      // Mês atual = dados em tempo real
      report = monthlyReportsStore.getCurrentMonthData();
    } else {
      // Mês anterior = dados salvos (histórico)
      report = monthlyReportsStore.getReportByMonth(monthString);
    }

    setCurrentReport(report);
  };

  const getMonthDisplayName = (monthString: string): string => {
    const [year, month] = monthString.split("-").map(Number);
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  if (availableMonths.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">📊 Relatórios Mensais</h2>
          <p className="text-sm text-muted-foreground">
            Nenhum relatório disponível ainda
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">📊 Relatórios Mensais</h2>
        <p className="text-sm text-muted-foreground">
          Visualize o desempenho financeiro por mês
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">Selecione o mês</CardTitle>
            {isCurrentMonth ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                Mês Atual
              </Badge>
            ) : (
              <Badge variant="secondary">
                Histórico
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha um mês" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month) => {
                const isCurrent = month === format(new Date(), "yyyy-MM");
                return (
                  <SelectItem key={month} value={month}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {getMonthDisplayName(month)}
                      {isCurrent && <span className="text-xs text-green-600">(atual)</span>}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {currentReport && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {currentReport.totalSales.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentReport.soldCount} {currentReport.soldCount === 1 ? "vendido" : "vendidos"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Compras</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {currentReport.totalPurchases.toFixed(2)}
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
                    currentReport.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  R$ {currentReport.netProfit.toFixed(2)}
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
                  {currentReport.averageMargin.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impostos Pagos</CardTitle>
                <Receipt className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  R$ {currentReport.totalTax.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  6% do digital
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>📆 {currentReport.monthName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                {isCurrentMonth ? (
                  <p>✅ Dados atualizados em tempo real - O relatório final será gerado automaticamente no primeiro dia do próximo mês.</p>
                ) : (
                  <p>🔒 Relatório fechado - Dados finais do mês encerrado.</p>
                )}
                <p className="text-xs">
                  Gerado em: {format(new Date(currentReport.generatedAt), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MonthlyReportsTab;
