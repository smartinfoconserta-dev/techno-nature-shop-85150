import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import ProductFilters from "@/components/ProductFilters";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp } from "lucide-react";
import { brandsStore } from "@/lib/brandsStore";
import { productsStore } from "@/lib/productsStore";
import { categoriesStore } from "@/lib/categoriesStore";
const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [products, setProducts] = useState(productsStore.getAvailableProducts());
  const [categories, setCategories] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [filterSearch, setFilterSearch] = useState("");
  useEffect(() => {
    const initCategories = async () => {
      const names = await categoriesStore.getCategoryNames();
      const sortedNames = names.sort();
      setCategories(sortedNames);
      
      if (sortedNames.length > 0 && selectedCategory === "") {
        setSelectedCategory(sortedNames[0]);
      }
    };
    initCategories();
  }, []);
  const maxProductPrice = useMemo(() => {
    if (products.length === 0) return 50000;
    return Math.max(...products.map(p => p.price));
  }, [products]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await productsStore.refreshFromBackend();
      loadProducts();
      setIsLoading(false);
    };
    init();
    loadBrands();
    setPriceRange([0, maxProductPrice]);
  }, [selectedCategory, maxProductPrice]);
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const loadBrands = async () => {
    if (selectedCategory) {
      const categoryBrands = await brandsStore.getBrandsByCategory(selectedCategory);
      setBrands(categoryBrands.map(b => b.name));
    }
  };
  const loadProducts = () => {
    setProducts(productsStore.getAvailableProducts());
  };
  const handleRefreshCatalog = async () => {
    setIsRefreshing(true);
    try {
      await productsStore.refreshFromBackend();
      loadProducts();
    } finally {
      setIsRefreshing(false);
    }
  };
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const categoryMatch = product.category === selectedCategory;
      const brandMatch = selectedBrand === "all" || product.brand === selectedBrand;
      
      const searchLower = searchQuery.toLowerCase();
      const globalSearchMatch = searchQuery === "" || 
        product.name.toLowerCase().includes(searchLower) || 
        product.brand.toLowerCase().includes(searchLower) || 
        product.specs.toLowerCase().includes(searchLower);
      
      const filterSearchLower = filterSearch.toLowerCase();
      const filterSearchMatch = filterSearch === "" ||
        product.name.toLowerCase().includes(filterSearchLower) ||
        product.brand.toLowerCase().includes(filterSearchLower) ||
        product.specs.toLowerCase().includes(filterSearchLower) ||
        product.description.toLowerCase().includes(filterSearchLower);
      
      const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      return categoryMatch && brandMatch && globalSearchMatch && filterSearchMatch && priceMatch;
    });
  }, [products, selectedCategory, selectedBrand, searchQuery, filterSearch, priceRange]);
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleResetFilters = () => {
    if (categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
    setSelectedBrand("all");
    setSearchQuery("");
    setFilterSearch("");
    setPriceRange([0, maxProductPrice]);
    scrollToTop();
  };
  return <div className="min-h-screen bg-background">
      <Header searchValue={searchQuery} onSearchChange={setSearchQuery} onReset={handleResetFilters} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(categoryName => (
              <Button 
                key={categoryName} 
                variant={selectedCategory === categoryName ? "default" : "outline"} 
                size="sm" 
                onClick={() => setSelectedCategory(categoryName)} 
                className="whitespace-nowrap"
              >
                {categoryName}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <ProductFilters 
              selectedCategory={selectedCategory} 
              onCategoryChange={setSelectedCategory} 
              selectedBrand={selectedBrand} 
              onBrandChange={setSelectedBrand} 
              brands={brands} 
              categories={categories}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              maxPrice={maxProductPrice}
              filterSearch={filterSearch}
              onFilterSearchChange={setFilterSearch}
            />
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
            </p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-20">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              Nenhum produto encontrado
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {products.length === 0 
                ? "Catálogo em breve. Novos produtos serão adicionados em breve."
                : "Tente ajustar os filtros ou buscar por outro termo"
              }
            </p>
            {products.length === 0 && (
              <Button onClick={handleRefreshCatalog} disabled={isRefreshing} className="mt-4">
                {isRefreshing ? "Atualizando..." : "Atualizar catálogo"}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-20">
            {filteredProducts.map(product => (
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
        )}
      </main>
      
      <footer className="bg-muted py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Catálogo digital — Ramon Tech Solutions  
          </p>
        </div>
      </footer>

      {/* Botão Voltar ao Topo */}
      {showScrollTop && <Button onClick={scrollToTop} size="icon" className="fixed bottom-24 right-4 z-50 shadow-lg" aria-label="Voltar ao topo">
          <ArrowUp className="h-5 w-5" />
        </Button>}
    </div>;
};
export default Index;