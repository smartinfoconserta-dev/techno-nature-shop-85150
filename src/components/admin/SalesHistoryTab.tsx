import { useEffect, useState } from "react";
import { productsStore, Product } from "@/lib/productsStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const SalesHistoryTab = () => {
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
  const [cancelingProduct, setCancelingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleCancelSale = () => {
    if (!cancelingProduct) return;

    try {
      productsStore.cancelSale(cancelingProduct.id);
      setCancelingProduct(null);
      loadData();
      toast.success("Venda cancelada! Produto retornou ao estoque.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar venda");
    }
  };

  const filteredProducts = soldProducts.filter(product => {
    // Filtro de busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchesName = product.name.toLowerCase().includes(query);
      const matchesBrand = product.brand.toLowerCase().includes(query);
      const matchesBuyer = product.buyerName?.toLowerCase().includes(query);
      const matchesCpf = product.buyerCpf?.toLowerCase().includes(query);
      
      if (!matchesName && !matchesBrand && !matchesBuyer && !matchesCpf) {
        return false;
      }
    }
    
    // Filtro de garantia
    if (warrantyFilter === "all") return true;
    if (!product.saleDate) return false;
    
    const warranty = calculateWarranty(product.saleDate);
    if (warrantyFilter === "active") return warranty.isActive;
    if (warrantyFilter === "expired") return !warranty.isActive;
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

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            <CardTitle className="text-sm font-medium">💻 Total Digital</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {totals.totalDigital.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">PIX + Cartão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">📊 Imposto (6%)</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {totals.totalTax.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sobre o digital</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">💵 Dinheiro</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totals.totalCash.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sem imposto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.soldCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Vendidos</p>
          </CardContent>
        </Card>
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
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhuma venda encontrada com esse filtro</CardTitle>
              <CardDescription>
                Tente mudar o filtro de garantia para ver outras vendas.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          filteredProducts.map((product) => {
            const { profit, margin, totalExpenses } = calculateProductProfit(product);
            const warranty = product.saleDate ? calculateWarranty(product.saleDate) : null;
            
            return (
              <Card
                key={product.id}
                className={cn(
                  "transition-all",
                  warranty?.isActive && warranty.daysRemaining > 30 && "border-green-300 shadow-sm shadow-green-100",
                  warranty?.isActive && warranty.daysRemaining <= 30 && warranty.daysRemaining > 7 && "border-yellow-300 shadow-sm shadow-yellow-100",
                  warranty?.isActive && warranty.daysRemaining <= 7 && "border-orange-300 shadow-sm shadow-orange-100",
                  !warranty?.isActive && "border-red-200 shadow-sm shadow-red-50 opacity-90"
                )}
              >
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

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Comprador: <span className="font-medium text-foreground">{product.buyerName || "Não informado"}</span>
                          {product.buyerCpf && (
                            <span className="text-muted-foreground"> ({product.buyerCpf})</span>
                          )}
                        </p>
                        {product.saleDate && <WarrantyBadge saleDate={product.saleDate} />}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Data da venda</p>
                          <p className="font-semibold text-foreground">
                            {product.saleDate
                              ? format(new Date(product.saleDate), "dd 'de' MMM. yyyy", {
                                  locale: ptBR,
                                })
                              : "N/A"}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-muted/50 p-3 rounded">
                          <div>
                            <p className="text-muted-foreground">💰 Total</p>
                            <p className="font-bold text-green-600">
                              R$ {(product.salePrice || 0).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">💵 Dinheiro</p>
                            <p className="font-semibold">
                              R$ {(product.paymentBreakdown?.cash || 0).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">📱 PIX</p>
                            <p className="font-semibold">
                              R$ {(product.paymentBreakdown?.pix || 0).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">💳 Cartão</p>
                            <p className="font-semibold">
                              R$ {(product.paymentBreakdown?.card || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {product.paymentBreakdown && (
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                              <p className="text-muted-foreground">💻 Total Digital</p>
                              <p className="font-semibold text-blue-600">
                                R${" "}
                                {(
                                  (product.paymentBreakdown.pix || 0) +
                                  (product.paymentBreakdown.card || 0)
                                ).toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-950/20 p-2 rounded">
                              <p className="text-muted-foreground">📊 Imposto 6%</p>
                              <p className="font-semibold text-orange-600">
                                R$ {(product.taxAmount || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">Gastos totais</p>
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

                      <div className="flex gap-2 mt-4 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelingProduct(product)}
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancelar Venda
                        </Button>
                        {product.invoiceUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(product.invoiceUrl, "_blank")}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Nota Fiscal
                          </Button>
                        )}
                      </div>
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

      <AlertDialog open={!!cancelingProduct} onOpenChange={() => setCancelingProduct(null)}>
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
            <AlertDialogAction onClick={handleCancelSale} className="bg-destructive hover:bg-destructive/90">
              Sim, cancelar venda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SalesHistoryTab;
