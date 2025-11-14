import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { productsStore } from "@/lib/productsStore";
import { categoriesStore, Category } from "@/lib/categoriesStore";
import type { Product } from "@/lib/productsStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as Icons from "lucide-react";

interface CategorySectionProps {
  categoryName: string;
  onViewAll: (category: string) => void;
}

const CategorySection = ({ categoryName, onViewAll }: CategorySectionProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const allCategories = await categoriesStore.getAllCategories();
      const currentCategory = allCategories.find(c => c.name === categoryName);
      
      if (currentCategory) {
        const subs = await categoriesStore.getSubCategories(currentCategory.id);
        setSubCategories(subs);
        if (subs.length > 0) {
          setParentCategory(currentCategory);
        }
      }
      
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
    
    loadData();
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

  const getCategoryIcon = (category: Category) => {
    const IconComponent = Icons[category.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
    return IconComponent || Icons.Package;
  };

  const currentIcon = parentCategory ? getCategoryIcon(parentCategory) : Icons.Package;
  const CurrentIcon = currentIcon as React.ComponentType<{ className?: string }>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <CurrentIcon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold">
            {categoryName}
          </h2>
          
          {subCategories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Subcategorias
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {subCategories.map((sub) => {
                  const SubIcon = getCategoryIcon(sub);
                  return (
                    <DropdownMenuItem
                      key={sub.id}
                      onClick={() => onViewAll(sub.name)}
                      className="gap-2 cursor-pointer"
                    >
                      <SubIcon className="w-4 h-4" />
                      {sub.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <Button 
          variant="link" 
          onClick={() => onViewAll(categoryName)}
          className="text-primary hover:text-primary/80"
        >
          Ver todos →
        </Button>
      </div>

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

      <div className="md:hidden relative">
        {canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md bg-background"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory px-1"
          onScroll={checkScrollButtons}
        >
          {products.map((product) => (
            <div key={product.id} className="min-w-[280px] snap-start">
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
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md bg-background"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CategorySection;
