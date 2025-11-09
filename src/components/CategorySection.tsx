import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProductCard from "@/components/ProductCard";
import { productsStore } from "@/lib/productsStore";
import { categoriesStore } from "@/lib/categoriesStore";
import type { Product } from "@/lib/productsStore";

interface CategorySectionProps {
  categoryName: string;
  onViewAll: (category: string) => void;
}

const categoryIcons: Record<string, string> = {
  "Notebooks": "💻",
  "Celulares": "📱",
  "Tablets": "📱",
  "Smartwatches": "⌚",
  "Fones de Ouvido": "🎧",
  "Acessórios": "🔌",
};

const CategorySection = ({ categoryName, onViewAll }: CategorySectionProps) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const categoryProducts = productsStore
      .getProductsByCategory(categoryName)
      .filter(p => !p.sold)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    setProducts(categoryProducts);
  }, [categoryName]);

  if (products.length === 0) {
    return null;
  }

  const icon = categoriesStore.getCategoryIcon(categoryName);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <span className="text-2xl md:text-3xl">{categoryIcons[categoryName] || "📦"}</span>
          {categoryName}
        </h2>
        <Button 
          variant="link" 
          onClick={() => onViewAll(categoryName)}
          className="text-primary hover:text-primary/80"
        >
          Ver todos →
        </Button>
      </div>

      {/* Desktop: Grid de 3 colunas */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard 
            key={product.id}
            id={product.id}
            images={product.images}
            name={product.name}
            brand={product.brand}
            category={product.category}
            specs={product.specs}
            description={product.description}
            price={product.price}
            costPrice={product.costPrice}
            discountPrice={product.discountPrice}
            passOnCashDiscount={product.passOnCashDiscount}
          />
        ))}
      </div>

      {/* Mobile: Scroll horizontal */}
      <ScrollArea className="w-full md:hidden">
        <div className="flex gap-3 pb-4">
          {products.map((product) => (
            <div key={product.id} className="inline-block min-w-[160px]">
              <ProductCard 
                id={product.id}
                images={product.images}
                name={product.name}
                brand={product.brand}
                category={product.category}
                specs={product.specs}
                description={product.description}
                price={product.price}
                costPrice={product.costPrice}
                discountPrice={product.discountPrice}
                passOnCashDiscount={product.passOnCashDiscount}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CategorySection;
