import { useState, useEffect } from "react";
import { monthlyReportsStore, MonthlyReport } from "@/lib/monthlyReportsStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown, ShoppingBag, Receipt, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const MonthlyReportsTab = () => {
  const [reports, setReports] = useState<MonthlyReport[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const availableMonths = monthlyReportsStore.getAvailableMonths();
    const currentMonth = format(new Date(), "yyyy-MM");
    
    const allReports: MonthlyReport[] = availableMonths.map((monthString) => {
      if (monthString === currentMonth) {
        return monthlyReportsStore.getCurrentMonthData();
      } else {
        return monthlyReportsStore.getReportByMonth(monthString);
      }
    }).filter((report): report is MonthlyReport => report !== null);
    
    setReports(allReports);
  };

  const getMonthDisplayName = (monthString: string): string => {
    const [year, month] = monthString.split("-").map(Number);
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  const currentMonth = format(new Date(), "yyyy-MM");

  if (reports.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">📊 Comparação Mensal</h2>
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
        <h2 className="text-2xl font-bold text-foreground">📊 Comparação Mensal</h2>
        <p className="text-sm text-muted-foreground">
          Compare o desempenho financeiro entre os meses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Desempenho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Mês</TableHead>
                  <TableHead className="text-right min-w-[120px]">
                    <div className="flex items-center justify-end gap-2">
                      <DollarSign className="h-4 w-4" />
                      Total Vendas
                    </div>
                  </TableHead>
                  <TableHead className="text-right min-w-[120px]">
                    <div className="flex items-center justify-end gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Compras
                    </div>
                  </TableHead>
                  <TableHead className="text-right min-w-[120px]">
                    <div className="flex items-center justify-end gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Lucro Líquido
                    </div>
                  </TableHead>
                  <TableHead className="text-right min-w-[100px]">
                    <div className="flex items-center justify-end gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Margem
                    </div>
                  </TableHead>
                  <TableHead className="text-right min-w-[120px]">
                    <div className="flex items-center justify-end gap-2">
                      <Receipt className="h-4 w-4" />
                      Impostos
                    </div>
                  </TableHead>
                  <TableHead className="text-center min-w-[80px]">Qtd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const isCurrentMonth = report.month === currentMonth;
                  return (
                    <TableRow key={report.month} className={isCurrentMonth ? "bg-muted/50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {getMonthDisplayName(report.month)}
                          {isCurrentMonth && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">
                              Atual
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        R$ {report.totalSales.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        R$ {report.totalPurchases.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${report.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        R$ {report.netProfit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {report.averageMargin.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">
                        R$ {report.totalTax.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {report.soldCount}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium">📌 Sobre os dados:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>O mês <strong className="text-green-600">Atual</strong> mostra dados em tempo real</li>
                <li>Meses anteriores mostram dados históricos fechados</li>
                <li>Compare a evolução do negócio ao longo do tempo</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyReportsTab;
