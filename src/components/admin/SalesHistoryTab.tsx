import { useEffect, useState } from "react";
import { productsStore, Product } from "@/lib/productsStore";
import { quickSalesStore, QuickSale } from "@/lib/quickSalesStore";
import { receivablesStore, Receivable } from "@/lib/receivablesStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, DollarSign, Package, Percent, CheckCircle2, Archive, Search } from "lucide-react";
import EditSaleDialog from "./EditSaleDialog";
import { calculateWarranty } from "@/lib/warrantyHelper";
import SaleHistoryItem from "./SaleHistoryItem";
import { toast } from "sonner";
import { FilterBar } from "./FilterBar";
import { ActiveFilterChip } from "./ActiveFilterChip";
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
import { ProductRefundDialog } from "./ProductRefundDialog";
import { customersStore } from "@/lib/customersStore";
import { creditHistoryStore } from "@/lib/creditHistoryStore";

// Interface para venda unificada
interface HistorySale {
  id: string;
  type: "catalog" | "quick" | "receivable";
  productName: string;
  buyerName?: string;
  buyerCpf?: string;
  salePrice: number;
  costPrice?: number;
  profit?: number;
  saleDate: string;
  warranty?: number;
  paymentBreakdown?: { cash: number; pix: number; card: number };
  taxAmount?: number;
  status?: string;
  notes?: string;
  originalData: Product | QuickSale | Receivable;
}

const SalesHistoryTab = () => {
  const [unifiedSales, setUnifiedSales] = useState<HistorySale[]>([]);
  const [soldProducts, setSoldProducts] = useState<Product[]>([]);
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [warrantyFilter, setWarrantyFilter] = useState<"all" | "active" | "expired">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "catalog" | "quick" | "receivable">("all");
  const [cancelingProduct, setCancelingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const products = productsStore.getSoldProducts();
    const computedTotals = productsStore.computeTotals();
    setSoldProducts(products);
    setTotals(computedTotals);
    
    // Carregar histórico unificado
    await loadUnifiedHistory();
  };

  // Helper para obter dias de garantia corretos
  const getWarrantyDays = (sale: HistorySale): number => {
    // Warranty já está sempre em dias para todos os tipos
    // Usar ?? em vez de || para respeitar warranty = 0 (sem garantia)
    return sale.warranty ?? 90;
  };

  // Verificar se uma venda deve ser arquivada automaticamente
  const isAutoArchived = (sale: HistorySale): boolean => {
    if (!sale.saleDate) return false;
    
    const warrantyDays = getWarrantyDays(sale);
    const warranty = calculateWarranty(sale.saleDate, warrantyDays);
    
    // Verificar se está paga
    // Admin: Arquiva quando garantia vencer, independente de pagamento
    return !warranty.isActive;
  };

  const loadUnifiedHistory = async () => {
    const allSales: HistorySale[] = [];
    
    // 1. Produtos do catálogo vendidos
    const soldProducts = productsStore.getSoldProducts();
    soldProducts.forEach(p => {
      const totalExpenses = p.expenses.reduce((sum, e) => sum + e.value, 0);
      allSales.push({
        id: p.id,
        type: "catalog",
        productName: p.name,
        buyerName: p.buyerName,
        buyerCpf: p.buyerCpf,
        salePrice: p.salePrice || 0,
        costPrice: totalExpenses,
        profit: (p.salePrice || 0) - totalExpenses,
        saleDate: p.saleDate || p.createdAt,
        warranty: p.warranty,
        paymentBreakdown: p.paymentBreakdown,
        taxAmount: p.taxAmount,
        originalData: p,
      });
    });
    
    // 2. Vendas rápidas
    const quickSales = quickSalesStore.getAllQuickSales();
    quickSales.forEach(qs => {
      allSales.push({
        id: qs.id,
        type: "quick",
        productName: qs.productName,
        buyerName: qs.customerName,
        buyerCpf: qs.customerCpf,
        salePrice: qs.salePrice,
        costPrice: qs.costPrice,
        profit: qs.profit,
        saleDate: qs.saleDate,
        warranty: qs.warranty,
        paymentBreakdown: qs.paymentBreakdown,
        taxAmount: qs.taxAmount,
        notes: qs.notes,
        originalData: qs,
      });
    });
    
    // 3. Caderneta (apenas pagas e parciais com valor pago > 0)
    const receivables = receivablesStore.getAllReceivables();
    const soldProductIds = new Set(soldProducts.map(p => p.id));
    
    receivables
      .filter(r => {
        // Excluir arquivados
        if (r.archived) return false;
        
        // Só incluir se tiver algum valor pago
        if (r.paidAmount <= 0) return false;
        
        // Se tem productId, verificar se não é um produto do catálogo (evitar duplicação)
        if (r.productId && soldProductIds.has(r.productId)) {
          return false; // É um produto do catálogo, já está na lista
        }
        
        return true; // Incluir vendas da caderneta
      })
      .forEach(r => {
        allSales.push({
          id: r.id,
          type: "receivable",
          productName: r.productName,
          buyerName: r.customerName,
          salePrice: r.totalAmount,
          costPrice: r.costPrice,
          profit: r.profit,
          saleDate: r.createdAt,
          warranty: r.warranty,
          status: r.status,
          notes: r.notes,
          originalData: r,
        });
      });
    
    // Ordenar por data (mais recente primeiro)
    allSales.sort((a, b) => 
      new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
    );
    
    setUnifiedSales(allSales);
  };

  const calculateProductProfit = (product: Product) => {
    const totalExpenses = product.expenses.reduce((sum, e) => sum + e.value, 0);
    const salePrice = product.salePrice || 0;
    const profit = salePrice - totalExpenses;
    const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
    return { profit, margin, totalExpenses };
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const handleEditConfirm = (
    buyerName: string,
    buyerCpf: string,
    salePrice: number,
    saleDate: string,
    invoiceUrl: string,
    cash?: number,
    pix?: number,
    card?: number
  ) => {
    if (!editingProduct) return;
    
    try {
      productsStore.updateSale(editingProduct.id, buyerName, salePrice, saleDate, invoiceUrl);
      
      // Update payment breakdown and CPF if provided
      const updates: Partial<Product> = { buyerCpf };
      
      if (cash !== undefined || pix !== undefined || card !== undefined) {
        const paymentBreakdown = {
          cash: cash || 0,
          pix: pix || 0,
          card: card || 0,
        };
        const digitalAmount = paymentBreakdown.pix + paymentBreakdown.card;
        const taxAmount = digitalAmount * 0.06;
        
        updates.paymentBreakdown = paymentBreakdown;
        updates.taxAmount = taxAmount;
      }
      
      productsStore.updateProduct(editingProduct.id, updates);
      
      toast.success("Venda atualizada com sucesso!");
      loadData();
    } catch (error) {
      toast.error("Erro ao atualizar venda");
    }
  };

  const handleCancelClick = (product: Product) => {
    setCancelingProduct(product);
    
    // Verificar se tem pagamento registrado (paymentBreakdown OU salePrice)
    const hasPayment = product.paymentBreakdown
      ? ((product.paymentBreakdown.cash || 0) +
         (product.paymentBreakdown.pix || 0) +
         (product.paymentBreakdown.card || 0)) > 0
      : (product.salePrice || 0) > 0;
    
    // Verificar se tem comprador identificado (nome OU CPF)
    const hasBuyer = 
      (product.buyerName && product.buyerName.trim() !== "") ||
      (product.buyerCpf && product.buyerCpf.trim() !== "");
    
    // Se tem pagamento E comprador, mostrar opções de crédito
    if (hasPayment && hasBuyer) {
      setShowRefundDialog(true);
    }
    // Se não tem, usa o AlertDialog padrão (cancelamento simples)
  };

  const handleRefundConfirm = async (keepAsCredit: boolean) => {
    if (!cancelingProduct) return;

    try {
      // Se deve gerar crédito, tentar encontrar o cliente
      if (keepAsCredit) {
        const totalPaid = cancelingProduct.paymentBreakdown
          ? (cancelingProduct.paymentBreakdown.cash || 0) +
            (cancelingProduct.paymentBreakdown.pix || 0) +
            (cancelingProduct.paymentBreakdown.card || 0)
          : (cancelingProduct.salePrice || 0);

        const customers = await customersStore.getAllCustomers();
        let customer;

        // Tentar buscar por CPF primeiro (mais confiável)
        if (cancelingProduct.buyerCpf) {
          customer = customers.find(c => 
            c.cpfCnpj?.replace(/\D/g, '') === cancelingProduct.buyerCpf?.replace(/\D/g, '')
          );
        }
        
        // Se não encontrou por CPF, tentar por nome exato
        if (!customer && cancelingProduct.buyerName) {
          customer = customers.find(c =>
            c.name.toLowerCase().trim() === cancelingProduct.buyerName?.toLowerCase().trim()
          );
        }

        if (customer) {
          const description = `Crédito gerado pela devolução do produto: ${cancelingProduct.name}`;
          
          await customersStore.addCredit(customer.id, totalPaid, description);
          
          await creditHistoryStore.addTransaction({
            customerId: customer.id,
            type: "add",
            amount: totalPaid,
            description,
          });
          
          toast.success(`Crédito de R$ ${totalPaid.toFixed(2)} adicionado ao cliente ${customer.name}`);
        } else {
          // Cliente não encontrado no cadastro
          const buyerInfo = cancelingProduct.buyerCpf 
            ? `CPF ${cancelingProduct.buyerCpf}`
            : `nome "${cancelingProduct.buyerName}"`;
          
          toast.warning(
            `Cliente (${buyerInfo}) não encontrado no cadastro. Venda cancelada sem gerar crédito.`,
            { duration: 5000 }
          );
        }
      }

      // Cancelar a venda e retornar ao estoque
      productsStore.cancelSale(cancelingProduct.id);
      
      // Se tiver receivableId vinculado, deletar da Caderneta também
      if (cancelingProduct.receivableId) {
        try {
          await receivablesStore.deleteReceivable(cancelingProduct.receivableId);
        } catch (err) {
          console.error("Erro ao deletar recebível:", err);
        }
      } else {
        // Fallback: try to find receivable by productId
        const linkedReceivable = receivablesStore.getReceivableByProductId(cancelingProduct.id);
        if (linkedReceivable) {
          try {
            await receivablesStore.deleteReceivable(linkedReceivable.id);
          } catch (err) {
            console.error("Erro ao deletar recebível:", err);
          }
        }
      }
      
      setCancelingProduct(null);
      setShowRefundDialog(false);
      loadData();
      
      if (keepAsCredit) {
        toast.success("Venda cancelada! Produto retornou ao estoque e crédito foi gerado.");
      } else {
        toast.success("Venda cancelada! Produto retornou ao estoque.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar venda");
    }
  };

  const handleCancelSaleWithoutCredit = async () => {
    if (!cancelingProduct) return;

    try {
      productsStore.cancelSale(cancelingProduct.id);
      
      // Se tiver receivableId vinculado, deletar da Caderneta também
      if (cancelingProduct.receivableId) {
        try {
          await receivablesStore.deleteReceivable(cancelingProduct.receivableId);
        } catch (err) {
          console.error("Erro ao deletar recebível:", err);
        }
      } else {
        // Fallback: try to find receivable by productId
        const linkedReceivable = receivablesStore.getReceivableByProductId(cancelingProduct.id);
        if (linkedReceivable) {
          try {
            await receivablesStore.deleteReceivable(linkedReceivable.id);
          } catch (err) {
            console.error("Erro ao deletar recebível:", err);
          }
        }
      }
      
      setCancelingProduct(null);
      loadData();
      toast.success("Venda cancelada! Produto retornou ao estoque.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar venda");
    }
  };


  // Filtrar vendas baseado na aba ativa, busca, tipo e garantia
  const filteredSales = unifiedSales.filter((sale) => {
    // Filtrar por aba (ativas ou arquivadas)
    const archived = isAutoArchived(sale);
    if (activeTab === "active" && archived) return false;
    if (activeTab === "archived" && !archived) return false;
    
    // Filtro de tipo de venda
    if (typeFilter !== "all" && sale.type !== typeFilter) {
      return false;
    }
    
    // Filtro de busca (nome do produto, comprador ou CPF)
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesName = sale.productName.toLowerCase().includes(searchLower);
      const matchesBuyer = sale.buyerName?.toLowerCase().includes(searchLower);
      const matchesCpf = sale.buyerCpf?.toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesBuyer && !matchesCpf) {
        return false;
      }
    }
    
    // Filtro de garantia
    if (warrantyFilter !== "all") {
      if (!sale.saleDate) return false;
      
      const warrantyDays = getWarrantyDays(sale);
      
      // Se não tem garantia (0 dias), não deve aparecer em "ativas" nem "expiradas"
      if (warrantyDays === 0) return false;
      
      const warranty = calculateWarranty(sale.saleDate, warrantyDays);
      if (warrantyFilter === "active") return warranty.isActive;
      if (warrantyFilter === "expired") return !warranty.isActive;
    }
    
    return true;
  });

  // Calcular contadores para as abas
  const activeCount = unifiedSales.filter(sale => !isAutoArchived(sale)).length;
  const archivedCount = unifiedSales.filter(sale => isAutoArchived(sale)).length;


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">📊 Histórico de Vendas</h2>
        <p className="text-muted-foreground">
          Acompanhe todas as vendas realizadas e seus respectivos compradores.
        </p>
      </div>

      {/* Tabs para Ativas e Arquivadas */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "archived")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Ativas ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Arquivadas ({archivedCount})
            </TabsTrigger>
          </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === "active" ? "🔍 Buscar por produto, comprador ou CPF..." : "🔍 Buscar nas arquivadas..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

      {/* Filtros de tipo de venda */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={typeFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setTypeFilter("all")}
        >
          📋 Todas
        </Button>
        <Button
          variant={typeFilter === "catalog" ? "default" : "outline"}
          size="sm"
          onClick={() => setTypeFilter("catalog")}
        >
          📦 Catálogo
        </Button>
        <Button
          variant={typeFilter === "quick" ? "default" : "outline"}
          size="sm"
          onClick={() => setTypeFilter("quick")}
        >
          ⚡ Vendas Rápidas
        </Button>
        <Button
          variant={typeFilter === "receivable" ? "default" : "outline"}
          size="sm"
          onClick={() => setTypeFilter("receivable")}
        >
          📒 Caderneta
        </Button>
      </div>

          {/* Filtros de garantia */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={warrantyFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setWarrantyFilter("all")}
            >
              Todas
            </Button>
            <Button
              variant={warrantyFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setWarrantyFilter("active")}
            >
              ✅ Na garantia
            </Button>
            <Button
              variant={warrantyFilter === "expired" ? "default" : "outline"}
              size="sm"
              onClick={() => setWarrantyFilter("expired")}
            >
              ❌ Expiradas
            </Button>
          </div>

          {/* Lista de vendas unificadas */}
          <div className="space-y-4">
        {unifiedSales.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhuma venda registrada ainda</CardTitle>
              <CardDescription>
                Quando você realizar vendas, elas aparecerão aqui no histórico.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : filteredSales.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhuma venda encontrada com esse filtro</CardTitle>
              <CardDescription>
                Tente mudar os filtros para ver outras vendas.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredSales.map((sale) => {
              const warrantyDays = getWarrantyDays(sale);
              
              return (
                <SaleHistoryItem
                  key={sale.id}
                  sale={sale}
                  warrantyDays={warrantyDays}
                  onEdit={sale.type === "catalog" ? handleEdit : undefined}
                  onCancel={sale.type === "catalog" ? handleCancelClick : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
        </TabsContent>
      </Tabs>

      {editingProduct && (
        <EditSaleDialog
          product={editingProduct}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onConfirm={handleEditConfirm}
        />
      )}

      {/* AlertDialog para produtos SEM pagamento */}
      <AlertDialog 
        open={!!cancelingProduct && !showRefundDialog} 
        onOpenChange={(open) => {
          if (!open) setCancelingProduct(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Venda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a venda de <strong>{cancelingProduct?.name}</strong>?
              <br /><br />
              O produto retornará ao estoque e todos os dados da venda serão removidos.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter venda</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSaleWithoutCredit} className="bg-destructive hover:bg-destructive/90">
              Sim, cancelar venda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* RefundDialog para produtos COM pagamento */}
      {cancelingProduct && (
        <ProductRefundDialog
          open={showRefundDialog}
          onOpenChange={(open) => {
            setShowRefundDialog(open);
            if (!open) setCancelingProduct(null);
          }}
          product={cancelingProduct}
          onConfirm={handleRefundConfirm}
        />
      )}
    </div>
  );
};

export default SalesHistoryTab;
