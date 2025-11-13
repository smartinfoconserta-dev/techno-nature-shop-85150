import { useEffect, useState } from "react";
import { productsStore, Product } from "@/lib/productsStore";
import { quickSalesStore, QuickSale } from "@/lib/quickSalesStore";
import { receivablesStore, Receivable } from "@/lib/receivablesStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, DollarSign, Package, Percent, Pencil, FileText, XCircle, Search } from "lucide-react";
import EditSaleDialog from "./EditSaleDialog";
import WarrantyBadge from "./WarrantyBadge";
import { calculateWarranty } from "@/lib/warrantyHelper";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

  const filteredSales = unifiedSales.filter(sale => {
    // Filtro de tipo
    if (typeFilter !== "all" && sale.type !== typeFilter) {
      return false;
    }
    
    // Filtro de busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchesName = sale.productName.toLowerCase().includes(query);
      const matchesBuyer = sale.buyerName?.toLowerCase().includes(query);
      const matchesCpf = sale.buyerCpf?.toLowerCase().includes(query);
      
      if (!matchesName && !matchesBuyer && !matchesCpf) {
        return false;
      }
    }
    
    // Filtro de garantia (apenas para catálogo e quick sales)
    if (warrantyFilter !== "all" && (sale.type === "catalog" || sale.type === "quick")) {
      if (!sale.saleDate) return false;
      
      const warranty = calculateWarranty(sale.saleDate);
      if (warrantyFilter === "active") return warranty.isActive;
      if (warrantyFilter === "expired") return !warranty.isActive;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">📊 Histórico de Vendas</h2>
        <p className="text-muted-foreground">
          Acompanhe todas as vendas realizadas e seus respectivos compradores.
        </p>
      </div>


      {/* Campo de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="🔍 Buscar por produto, comprador ou CPF..."
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
          filteredSales.map((sale) => {
            const warranty = sale.saleDate ? calculateWarranty(sale.saleDate) : null;
            const isEditableCatalog = sale.type === "catalog";
            
            return (
              <Card
                key={sale.id}
                className={cn(
                  "transition-all",
                  warranty?.isActive && warranty.daysRemaining > 30 && "border-green-300 shadow-sm shadow-green-100",
                  warranty?.isActive && warranty.daysRemaining <= 30 && warranty.daysRemaining > 7 && "border-yellow-300 shadow-sm shadow-yellow-100",
                  warranty?.isActive && warranty.daysRemaining <= 7 && "border-orange-300 shadow-sm shadow-orange-100",
                  !warranty?.isActive && warranty && "border-red-200 shadow-sm shadow-red-50 opacity-90"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {sale.type === "catalog" && (sale.originalData as Product).images?.[0] && (
                      <img
                        src={(sale.originalData as Product).images[0]}
                        alt={sale.productName}
                        className="w-24 h-24 object-cover rounded border border-border"
                      />
                    )}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              sale.type === "catalog" ? "default" : 
                              sale.type === "quick" ? "secondary" : 
                              "outline"
                            }>
                              {sale.type === "catalog" ? "📦 Catálogo" : 
                               sale.type === "quick" ? "⚡ Rápida" : 
                               "📒 Caderneta"}
                            </Badge>
                            {sale.type === "receivable" && (
                              <Badge variant={
                                sale.status === "paid" ? "default" :
                                sale.status === "partial" ? "secondary" :
                                "outline"
                              }>
                                {sale.status === "paid" ? "Pago" :
                                 sale.status === "partial" ? "Parcial" :
                                 "Pendente"}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {sale.productName}
                          </h3>
                          {sale.type === "catalog" && (
                            <p className="text-sm text-muted-foreground">
                              Marca: {(sale.originalData as Product).brand}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Comprador: <span className="font-medium text-foreground">{sale.buyerName || "Não informado"}</span>
                          {sale.buyerCpf && (
                            <span className="text-muted-foreground"> ({sale.buyerCpf})</span>
                          )}
                        </p>
                        {sale.saleDate && (sale.type === "catalog" || sale.type === "quick") && (
                          <WarrantyBadge saleDate={sale.saleDate} />
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Data da venda</p>
                          <p className="font-semibold text-foreground">
                            {sale.saleDate
                              ? format(new Date(sale.saleDate), "dd 'de' MMM. yyyy", {
                                  locale: ptBR,
                                })
                              : "N/A"}
                          </p>
                        </div>

                        {sale.paymentBreakdown && (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-muted/50 p-3 rounded">
                              <div>
                                <p className="text-muted-foreground">💰 Total</p>
                                <p className="font-bold text-green-600">
                                  R$ {sale.salePrice.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">💵 Dinheiro</p>
                                <p className="font-semibold">
                                  R$ {(sale.paymentBreakdown.cash || 0).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">📱 PIX</p>
                                <p className="font-semibold">
                                  R$ {(sale.paymentBreakdown.pix || 0).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">💳 Cartão</p>
                                <p className="font-semibold">
                                  R$ {(sale.paymentBreakdown.card || 0).toFixed(2)}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                                <p className="text-muted-foreground">💻 Total Digital</p>
                                <p className="font-semibold text-blue-600">
                                  R${" "}
                                  {(
                                    (sale.paymentBreakdown.pix || 0) +
                                    (sale.paymentBreakdown.card || 0)
                                  ).toFixed(2)}
                                </p>
                              </div>
                              <div className="bg-orange-50 dark:bg-orange-950/20 p-2 rounded">
                                <p className="text-muted-foreground">📊 Imposto 6%</p>
                                <p className="font-semibold text-orange-600">
                                  R$ {(sale.taxAmount || 0).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </>
                        )}

                        {!sale.paymentBreakdown && (
                          <div className="bg-muted/50 p-3 rounded">
                            <p className="text-muted-foreground text-sm">💰 Valor Total</p>
                            <p className="font-bold text-green-600 text-lg">
                              R$ {sale.salePrice.toFixed(2)}
                            </p>
                          </div>
                        )}

                        {sale.costPrice !== undefined && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">Custo</p>
                            <p className="font-semibold text-orange-600">
                              R$ {sale.costPrice.toFixed(2)}
                            </p>
                          </div>
                        )}

                        {sale.notes && (
                          <div className="text-sm">
                            <p className="text-muted-foreground">📝 Observações:</p>
                            <p className="text-foreground">{sale.notes}</p>
                          </div>
                        )}
                      </div>

                      {sale.profit !== undefined && (
                        <div className="flex items-center gap-6 pt-2 border-t border-border">
                          <div>
                            <p className="text-sm text-muted-foreground">Lucro</p>
                            <p
                              className={`text-xl font-bold ${
                                sale.profit >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              R$ {sale.profit.toFixed(2)}
                            </p>
                          </div>
                          {sale.salePrice > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground">Margem</p>
                              <p className="text-xl font-bold text-foreground">
                                {((sale.profit / sale.salePrice) * 100).toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {isEditableCatalog && (
                        <div className="flex gap-2 mt-4 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(sale.originalData as Product)}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelClick(sale.originalData as Product)}
                            className="text-destructive hover:text-destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar Venda
                          </Button>
                          {(sale.originalData as Product).invoiceUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open((sale.originalData as Product).invoiceUrl, "_blank")}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Nota Fiscal
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

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
