import { useMemo, useState, useEffect } from "react";
import { productsStore } from "@/lib/productsStore";
import { categoriesStore } from "@/lib/categoriesStore";
import ProductQuickCard from "./ProductQuickCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Laptop, Smartphone, Tablet, Watch, Headphones } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CategoryProductsSectionProps {
  categoryName: string;
  onViewMore: () => void;
}

const CategoryProductsSection = ({ categoryName, onViewMore }: CategoryProductsSectionProps) => {
  const products = useMemo(() => {
    return productsStore
      .getProductsByCategory(categoryName)
      .filter((p) => !p.sold) // Apenas disponíveis
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Mais recentes primeiro
      .slice(0, 3); // Limitar a 3
  }, [categoryName]);

  const [categoryIcon, setCategoryIcon] = useState<string>("Package");
  
  useEffect(() => {
    categoriesStore.getCategoryIcon(categoryName).then(icon => {
      setCategoryIcon(icon);
    });
  }, [categoryName]);

  // Mapeamento de ícones para componentes Lucide
  const IconComponent = {
    Laptop: Laptop,
    Smartphone: Smartphone,
    Tablet: Tablet,
    Watch: Watch,
    Headphones: Headphones,
    Package: Package,
  }[categoryIcon] || Package;

  if (products.length === 0) {
    return null; // Não renderiza seção vazia
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconComponent className="w-8 h-8 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">{categoryName}</h3>
            <p className="text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? "produto" : "produtos"} disponíveis
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onViewMore}>
          Ver todos →
        </Button>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductQuickCard 
            key={product.id} 
            product={product} 
            onClick={onViewMore} 
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryProductsSection;
