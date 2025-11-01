import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MonthlyReportsTab from "./MonthlyReportsTab";
import ProductExpenseRow from "./ProductExpenseRow";
import { productsStore, Product } from "@/lib/productsStore";
import { BarChart3, DollarSign } from "lucide-react";

const FinanceMainTab = () => {
  const [activeSubTab, setActiveSubTab] = useState("reports");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setProducts(productsStore.getAvailableProducts());
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios Mensais
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Gerenciar Custos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <MonthlyReportsTab />
        </TabsContent>

        <TabsContent value="expenses">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Gerenciar Custos</h2>
              <p className="text-sm text-muted-foreground">
                Adicione e gerencie os custos dos produtos disponíveis
              </p>
            </div>

            <div className="space-y-4">
              {products.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border border-border">
                  <p className="text-muted-foreground">
                    Nenhum produto disponível para gerenciar custos.
                  </p>
                </div>
              ) : (
                products.map((product) => (
                  <ProductExpenseRow
                    key={product.id}
                    product={product}
                    onUpdate={loadProducts}
                  />
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceMainTab;
