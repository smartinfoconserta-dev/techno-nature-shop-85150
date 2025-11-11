import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsTab from "./ProductsTab";
import BrandsTab from "./BrandsTab";
import CategoriesTab from "./CategoriesTab";
import ImportProductsTab from "./ImportProductsTab";
import ImportFromBrowserDialog from "./ImportFromBrowserDialog";
import { Package, Tags, FolderOpen, Upload } from "lucide-react";

const ProductsMainTab = () => {
  const [activeSubTab, setActiveSubTab] = useState("catalog");

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ImportFromBrowserDialog />
      </div>
      
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar CSV
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

        <TabsContent value="import">
          <ImportProductsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductsMainTab;
