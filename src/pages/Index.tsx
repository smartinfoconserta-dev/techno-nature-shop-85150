import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import ProductFilters from "@/components/ProductFilters";
import ProductCard from "@/components/ProductCard";
import ProductDetailsDialog from "@/components/ProductDetailsDialog";
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
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");
  const [deepLinkProductId, setDeepLinkProductId] = useState<string | null>(null);
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

    // Deep linking: detectar parâmetro ?produto=ID na URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('produto');
    if (productId) {
      setDeepLinkProductId(productId);
    }
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

  // Abrir dialog automaticamente quando produto deep link é detectado
  useEffect(() => {
    if (deepLinkProductId && products.length > 0) {
      const product = products.find(p => p.id === deepLinkProductId);
      if (product) {
        // Dar um pequeno delay para garantir que a página carregou
        setTimeout(() => {
          setDeepLinkProductId(product.id);
        }, 300);
      }
    }
  }, [deepLinkProductId, products]);
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
    let filtered = products.filter(product => {
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

    // Aplicar ordenação
    if (priceSort === "asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (priceSort === "desc") {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [products, selectedCategory, selectedBrand, searchQuery, filterSearch, priceRange, priceSort]);
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
    setPriceSort("none");
    scrollToTop();
  };
  return <div className="min-h-screen bg-background">
      <Header searchValue={searchQuery} onSearchChange={setSearchQuery} onReset={handleResetFilters} />
      
      {/* Hero Banner Minimalista */}
      <section className="relative h-[40vh] min-h-[300px] max-h-[400px] overflow-hidden bg-gradient-to-br from-primary/20 via-background to-background">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative z-10 text-center space-y-3 px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground drop-shadow-lg">
              Ramon Tech Solutions
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Catálogo Digital de Tecnologia
            </p>
          </div>
          <div className="absolute right-[5%] md:right-[10%] bottom-0 w-[200px] md:w-[280px] lg:w-[350px] opacity-90">
            <img 
              src="/tech-background.jpg" 
              alt="Tecnologia" 
              className="w-full h-auto object-contain drop-shadow-2xl"
              style={{ 
                maskImage: 'linear-gradient(to top, transparent, black 20%)',
                WebkitMaskImage: 'linear-gradient(to top, transparent, black 20%)'
              }}
            />
          </div>
        </div>
      </section>
      
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
              priceSort={priceSort}
              onPriceSortChange={setPriceSort}
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

      {/* Dialog para Deep Link */}
      {deepLinkProductId && (() => {
        const product = products.find(p => p.id === deepLinkProductId);
        if (!product) return null;
        
        return (
          <ProductDetailsDialog
            open={!!deepLinkProductId}
            onOpenChange={(open) => {
              if (!open) {
                setDeepLinkProductId(null);
                // Limpar parâmetro da URL
                window.history.replaceState({}, '', window.location.pathname);
              }
            }}
            id={product.id}
            images={product.images}
            name={product.name}
            brand={product.brand}
            specs={product.specs}
            description={product.description}
            price={product.price}
            costPrice={product.costPrice}
            discountPrice={product.discountPrice}
            passOnCashDiscount={product.passOnCashDiscount}
          />
        );
      })()}
    </div>;
};
export default Index;