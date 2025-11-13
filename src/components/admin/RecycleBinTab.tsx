import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { productsStore } from "@/lib/productsStore";
import { receivablesStore } from "@/lib/receivablesStore";
import { quickSalesStore } from "@/lib/quickSalesStore";
import { customersStore } from "@/lib/customersStore";
import { customerRequestsStore } from "@/lib/customerRequestsStore";
import { brandsStore } from "@/lib/brandsStore";
import { categoriesStore } from "@/lib/categoriesStore";
import { couponsStore } from "@/lib/couponsStore";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RecycleBinTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  
  // Estados para itens deletados
  const [deletedProducts, setDeletedProducts] = useState<any[]>([]);
  const [deletedReceivables, setDeletedReceivables] = useState<any[]>([]);
  const [deletedQuickSales, setDeletedQuickSales] = useState<any[]>([]);
  const [deletedCustomers, setDeletedCustomers] = useState<any[]>([]);
  const [deletedRequests, setDeletedRequests] = useState<any[]>([]);
  const [deletedBrands, setDeletedBrands] = useState<any[]>([]);
  const [deletedCategories, setDeletedCategories] = useState<any[]>([]);
  const [deletedCoupons, setDeletedCoupons] = useState<any[]>([]);

  // Confirmação de exclusão permanente
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);

  useEffect(() => {
    loadDeletedItems();
  }, []);

  const loadDeletedItems = async () => {
    setLoading(true);
    try {
      const [products, receivables, quickSales, customers, requests, brands, categories, coupons] = await Promise.all([
        productsStore.getDeletedProducts(),
        receivablesStore.getDeletedReceivables(),
        quickSalesStore.getDeletedQuickSales(),
        customersStore.getDeletedCustomers(),
        customerRequestsStore.getDeletedRequests(),
        brandsStore.getDeletedBrands(),
        categoriesStore.getDeletedCategories(),
        couponsStore.getDeletedCoupons(),
      ]);

      setDeletedProducts(products);
      setDeletedReceivables(receivables);
      setDeletedQuickSales(quickSales);
      setDeletedCustomers(customers);
      setDeletedRequests(requests);
      setDeletedBrands(brands);
      setDeletedCategories(categories);
      setDeletedCoupons(coupons);
    } catch (error) {
      console.error("Erro ao carregar itens da lixeira:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens da lixeira",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const expiryDate = new Date(deletedDate);
    expiryDate.setDate(expiryDate.getDate() + 40);
    const daysLeft = differenceInDays(expiryDate, new Date());
    return Math.max(0, daysLeft);
  };

  const handleRestore = async (type: string, id: string) => {
    try {
      switch (type) {
        case "products":
          await productsStore.restoreProduct(id);
          break;
        case "receivables":
          await receivablesStore.restoreReceivable(id);
          break;
        case "quickSales":
          await quickSalesStore.restoreQuickSale(id);
          break;
        case "customers":
          await customersStore.restoreCustomer(id);
          break;
        case "requests":
          await customerRequestsStore.restoreRequest(id);
          break;
        case "brands":
          await brandsStore.restoreBrand(id);
          break;
        case "categories":
          await categoriesStore.restoreCategory(id);
          break;
        case "coupons":
          await couponsStore.restoreCoupon(id);
          break;
      }

      toast({
        title: "Sucesso",
        description: "Item restaurado com sucesso",
      });

      loadDeletedItems();
    } catch (error) {
      console.error("Erro ao restaurar item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível restaurar o item",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { type, id } = itemToDelete;

      switch (type) {
        case "products":
          await productsStore.permanentlyDeleteProduct(id);
          break;
        case "receivables":
          await receivablesStore.permanentlyDeleteReceivable(id);
          break;
        case "quickSales":
          await quickSalesStore.permanentlyDeleteQuickSale(id);
          break;
        case "customers":
          await customersStore.permanentlyDeleteCustomer(id);
          break;
        case "requests":
          await customerRequestsStore.permanentlyDeleteRequest(id);
          break;
        case "brands":
          await brandsStore.permanentlyDeleteBrand(id);
          break;
        case "categories":
          await categoriesStore.permanentlyDeleteCategory(id);
          break;
        case "coupons":
          await couponsStore.permanentlyDeleteCoupon(id);
          break;
      }

      toast({
        title: "Sucesso",
        description: "Item excluído permanentemente",
      });

      setShowDeleteDialog(false);
      setItemToDelete(null);
      loadDeletedItems();
    } catch (error) {
      console.error("Erro ao deletar permanentemente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item permanentemente",
        variant: "destructive",
      });
    }
  };

  const renderItemCard = (item: any, type: string, nameKey: string) => {
    const daysRemaining = getDaysRemaining(item.deletedAt || item.created_at);
    const deletedDate = item.deletedAt || item.created_at;

    return (
      <Card key={item.id} className="mb-4">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-2 truncate">{item[nameKey]}</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Excluído em: {format(new Date(deletedDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={daysRemaining > 7 ? "secondary" : "destructive"}>
                    {daysRemaining} {daysRemaining === 1 ? "dia restante" : "dias restantes"}
                  </Badge>
                  {daysRemaining <= 7 && (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Exclusão permanente em breve
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestore(type, item.id)}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Restaurar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setItemToDelete({ type, id: item.id, name: item[nameKey] });
                  setShowDeleteDialog(true);
                }}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (message: string) => (
    <div className="text-center py-12 text-muted-foreground">
      <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>{message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Trash2 className="h-6 w-6 text-muted-foreground" />
            <div>
              <CardTitle>Lixeira</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                ⚠️ Itens serão excluídos permanentemente após 40 dias
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-6">
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="quickSales">Vendas Rápidas</TabsTrigger>
              <TabsTrigger value="receivables">Recebíveis</TabsTrigger>
              <TabsTrigger value="customers">Clientes</TabsTrigger>
              <TabsTrigger value="requests">Solicitações</TabsTrigger>
              <TabsTrigger value="brands">Marcas</TabsTrigger>
              <TabsTrigger value="categories">Categorias</TabsTrigger>
              <TabsTrigger value="coupons">Cupons</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[600px] pr-4">
              <TabsContent value="products">
                {deletedProducts.length === 0 ? (
                  renderEmptyState("Nenhum produto na lixeira")
                ) : (
                  deletedProducts.map((item) => renderItemCard(item, "products", "name"))
                )}
              </TabsContent>

              <TabsContent value="quickSales">
                {deletedQuickSales.length === 0 ? (
                  renderEmptyState("Nenhuma venda rápida na lixeira")
                ) : (
                  deletedQuickSales.map((item) => renderItemCard(item, "quickSales", "productName"))
                )}
              </TabsContent>

              <TabsContent value="receivables">
                {deletedReceivables.length === 0 ? (
                  renderEmptyState("Nenhum recebível na lixeira")
                ) : (
                  deletedReceivables.map((item) => renderItemCard(item, "receivables", "productName"))
                )}
              </TabsContent>

              <TabsContent value="customers">
                {deletedCustomers.length === 0 ? (
                  renderEmptyState("Nenhum cliente na lixeira")
                ) : (
                  deletedCustomers.map((item) => renderItemCard(item, "customers", "name"))
                )}
              </TabsContent>

              <TabsContent value="requests">
                {deletedRequests.length === 0 ? (
                  renderEmptyState("Nenhuma solicitação na lixeira")
                ) : (
                  deletedRequests.map((item) => renderItemCard(item, "requests", "product_name"))
                )}
              </TabsContent>

              <TabsContent value="brands">
                {deletedBrands.length === 0 ? (
                  renderEmptyState("Nenhuma marca na lixeira")
                ) : (
                  deletedBrands.map((item) => renderItemCard(item, "brands", "name"))
                )}
              </TabsContent>

              <TabsContent value="categories">
                {deletedCategories.length === 0 ? (
                  renderEmptyState("Nenhuma categoria na lixeira")
                ) : (
                  deletedCategories.map((item) => renderItemCard(item, "categories", "name"))
                )}
              </TabsContent>

              <TabsContent value="coupons">
                {deletedCoupons.length === 0 ? (
                  renderEmptyState("Nenhum cupom na lixeira")
                ) : (
                  deletedCoupons.map((item) => renderItemCard(item, "coupons", "code"))
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão Permanente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Tem certeza que deseja excluir permanentemente <strong>{itemToDelete?.name}</strong>?
              </p>
              <p className="text-destructive font-semibold">
                ⚠️ Esta ação não pode ser desfeita!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
