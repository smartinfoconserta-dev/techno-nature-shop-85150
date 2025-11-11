import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      // Só faz refresh se o cache estiver vazio
      const currentProducts = productsStore.getAllProducts();
      if (currentProducts.length === 0) {
        await productsStore.refreshFromBackend();
      }
      
      const categoryProducts = await productsStore.getProductsByCategory(categoryName);
      const filtered = categoryProducts
        .filter(p => !p.sold)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      
      setProducts(filtered);
    };
    
    loadProducts();
  }, [categoryName]);

  useEffect(() => {
    checkScrollButtons();
  }, [products]);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = direction === 'left' 
        ? scrollRef.current.scrollLeft - scrollAmount
        : scrollRef.current.scrollLeft + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
      
      setTimeout(checkScrollButtons, 100);
    }
  };

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

      {/* Mobile: Scroll horizontal com botões de navegação */}
      <div className="relative md:hidden">
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-lg"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        
        <div 
          ref={scrollRef}
          onScroll={checkScrollButtons}
          className="flex gap-3 pb-4 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div key={product.id} className="inline-block min-w-[160px] snap-start">
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

        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-lg"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CategorySection;
