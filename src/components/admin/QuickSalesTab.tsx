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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Zap, DollarSign, TrendingUp, Package, Receipt, Edit, Plus, Search, CheckCircle2, Archive, TestTube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddQuickSaleDialog } from "./AddQuickSaleDialog";
import { EditQuickSaleDialog } from "./EditQuickSaleDialog";
import WarrantyBadge from "./WarrantyBadge";
import { calculateWarranty } from "@/lib/warrantyHelper";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const QuickSalesTab = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [sales, setSales] = useState<QuickSale[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [warrantyFilter, setWarrantyFilter] = useState<string>("all");
  const [monthlyTotals, setMonthlyTotals] = useState({
    totalSales: 0,
    totalProfit: 0,
    count: 0,
    totalTax: 0,
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editSaleId, setEditSaleId] = useState<string | null>(null);
  const [creatingTestData, setCreatingTestData] = useState(false);

  useEffect(() => {
    const currentMonth = format(new Date(), "yyyy-MM");
    setSelectedMonth(currentMonth);
    loadData(currentMonth);
  }, []);

  useEffect(() => {
    loadData(selectedMonth);
  }, [activeTab]);

  const loadData = (monthString: string) => {
    const allSales = activeTab === "active"
      ? quickSalesStore.getActiveQuickSales()
      : quickSalesStore.getArchivedQuickSales();
    const monthlySales = allSales.filter((s) => s.saleDate.startsWith(monthString));
    setSales(monthlySales);

    const totals = quickSalesStore.getMonthlyTotals(monthString);
    setMonthlyTotals({
      totalSales: totals.totalSales || 0,
      totalProfit: totals.totalProfit || 0,
      count: totals.count || 0,
      totalTax: totals.totalTax || 0,
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

  const getCustomerName = async (customerId?: string) => {
    if (!customerId) return "-";
    const customer = await customersStore.getCustomerById(customerId);
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

  const handleCreateTestData = async () => {
    setCreatingTestData(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-test-data");
      
      if (error) throw error;
      
      toast({
        title: "✅ Dados de teste criados",
        description: data?.message || "Vendas de teste criadas com sucesso!",
      });
      
      await quickSalesStore.refreshFromBackend();
      loadData(selectedMonth);
    } catch (error) {
      console.error("Erro ao criar dados de teste:", error);
      toast({
        title: "❌ Erro ao criar dados",
        description: "Não foi possível criar os dados de teste.",
        variant: "destructive",
      });
    } finally {
      setCreatingTestData(false);
    }
  };


  // Filtrar vendas por busca avançada e garantia
  const filteredSales = sales.filter(sale => {
    // BUSCA AVANÇADA: Procura em múltiplos campos
    const searchLower = searchTerm.toLowerCase().trim();
    
    let matchesSearch = true;
    if (searchLower !== "") {
      matchesSearch = 
        // Busca no nome do produto
        sale.productName.toLowerCase().includes(searchLower) ||
        // Busca no nome do cliente
        (sale.customerName && sale.customerName.toLowerCase().includes(searchLower)) ||
        // Busca no CPF (normaliza ambos os lados)
        (sale.customerCpf && (
          sale.customerCpf.toLowerCase().includes(searchLower) ||
          sale.customerCpf.replace(/\D/g, '').includes(searchLower.replace(/\D/g, ''))
        )) ||
        // Busca nas notas
        (sale.notes && sale.notes.toLowerCase().includes(searchLower));
    }
    
    // Filtro de garantia
    let matchesWarranty = true;
    if (warrantyFilter !== "all") {
      if (!sale.warranty || sale.warranty === 0) {
        matchesWarranty = warrantyFilter === "none";
      } else {
        const warranty = calculateWarranty(sale.saleDate, sale.warranty);
        
        if (warrantyFilter === "active") {
          matchesWarranty = warranty.isActive;
        } else if (warrantyFilter === "expiring") {
          matchesWarranty = warranty.isActive && warranty.daysRemaining <= 7;
        } else if (warrantyFilter === "expired") {
          matchesWarranty = !warranty.isActive;
        } else if (warrantyFilter === "none") {
          matchesWarranty = false;
        }
      }
    }
    
    return matchesSearch && matchesWarranty;
  });

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

        <div className="flex flex-wrap gap-2">
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

          <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar garantia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas garantias</SelectItem>
              <SelectItem value="active">Em garantia</SelectItem>
              <SelectItem value="expiring">Expirando (&lt;7d)</SelectItem>
              <SelectItem value="expired">Expirada</SelectItem>
              <SelectItem value="none">Sem garantia</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por produto, cliente, CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateTestData}
            disabled={creatingTestData}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {creatingTestData ? "Criando..." : "Criar Dados de Teste"}
          </Button>
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
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {sales.length === 0 
                  ? "Nenhuma venda rápida registrada neste mês"
                  : "Nenhuma venda encontrada com os filtros aplicados"}
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
                    <TableHead>Garantia</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(sale.saleDate), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {sale.warranty && sale.warranty > 0 ? (
                          <WarrantyBadge 
                            saleDate={sale.saleDate} 
                            warrantyDays={sale.warranty}
                          />
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            Sem garantia
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.productName}
                        {sale.notes && (
                          <p className="text-xs text-muted-foreground">{sale.notes}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {sale.customerName || sale.customerCpf ? (
                          <div className="space-y-0.5">
                            {sale.customerName && (
                              <p className="font-medium text-sm">{sale.customerName}</p>
                            )}
                            {sale.customerCpf && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {sale.customerCpf}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
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
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditSaleId(sale.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
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