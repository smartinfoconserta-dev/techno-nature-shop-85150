import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { quickSalesStore, QuickSale } from "@/lib/quickSalesStore";
import { customersStore } from "@/lib/customersStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, DollarSign, TrendingUp, Package, Receipt, Edit, Plus } from "lucide-react";
import { AddQuickSaleDialog } from "./AddQuickSaleDialog";
import { EditQuickSaleDialog } from "./EditQuickSaleDialog";
import { cn } from "@/lib/utils";

const QuickSalesTab = () => {
  const [sales, setSales] = useState<QuickSale[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [monthlyTotals, setMonthlyTotals] = useState({
    totalSales: 0,
    totalProfit: 0,
    count: 0,
    totalTax: 0,
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editSaleId, setEditSaleId] = useState<string | null>(null);

  useEffect(() => {
    const currentMonth = format(new Date(), "yyyy-MM");
    setSelectedMonth(currentMonth);
    loadData(currentMonth);
  }, []);

  const loadData = (monthString: string) => {
    const monthlySales = quickSalesStore.getQuickSalesByMonth(monthString);
    setSales(monthlySales);

    const totals = quickSalesStore.getMonthlyTotals(monthString);
    setMonthlyTotals({
      totalSales: totals.totalSales,
      totalProfit: totals.totalProfit,
      count: totals.count,
      totalTax: totals.totalTax,
    });
  };

  const handleMonthChange = (monthString: string) => {
    setSelectedMonth(monthString);
    loadData(monthString);
  };

  const getMonthOptions = () => {
    const now = new Date();
    const months: { value: string; label: string }[] = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = format(date, "yyyy-MM");
      const label = format(date, "MMMM yyyy", { locale: ptBR });
      months.push({ value, label });
    }

    return months;
  };

  const getCustomerName = (customerId?: string) => {
    if (!customerId) return "-";
    const customer = customersStore.getCustomerById(customerId);
    return customer ? customer.name : "Cliente não encontrado";
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case "cash":
        return "💵 Dinheiro";
      case "pix":
        return "📱 PIX";
      case "card":
        return "💳 Cartão";
      default:
        return "-";
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-foreground">Vendas Rápidas</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Vendas avulsas de produtos não catalogados
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total em Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(monthlyTotals.totalSales)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyTotals.count} {monthlyTotals.count === 1 ? "venda" : "vendas"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyTotals.totalProfit)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Após taxas e custos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Quantidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {monthlyTotals.count}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Produtos vendidos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Impostos Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(monthlyTotals.totalTax)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              6% PIX/Cartão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Nenhuma venda rápida registrada neste mês
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira Venda
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Pagamento/Cliente</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(sale.saleDate), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.productName}
                        {sale.notes && (
                          <p className="text-xs text-muted-foreground">{sale.notes}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sale.costPrice)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(sale.salePrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-bold",
                            sale.profit >= 0 ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {formatCurrency(sale.profit)}
                        </span>
                        {sale.taxAmount && sale.taxAmount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            (-{formatCurrency(sale.taxAmount)} taxa)
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">À vista</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getPaymentMethodLabel(sale.paymentMethod)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditSaleId(sale.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddQuickSaleDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => loadData(selectedMonth)}
      />

      <EditQuickSaleDialog
        open={editSaleId !== null}
        onOpenChange={(open) => !open && setEditSaleId(null)}
        saleId={editSaleId}
        onSuccess={() => loadData(selectedMonth)}
      />
    </div>
  );
};

export default QuickSalesTab;