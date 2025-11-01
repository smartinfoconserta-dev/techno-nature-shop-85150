import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsTab from "./ProductsTab";
import BrandsTab from "./BrandsTab";
import CategoriesTab from "./CategoriesTab";
import { Package, Tags, FolderOpen } from "lucide-react";

const ProductsMainTab = () => {
  const [activeSubTab, setActiveSubTab] = useState("catalog");

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog" className="gap-2">
            <Package className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="brands" className="gap-2">
            <Tags className="h-4 w-4" />
            Marcas
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Categorias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <ProductsTab />
        </TabsContent>

        <TabsContent value="brands">
          <BrandsTab />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductsMainTab;
