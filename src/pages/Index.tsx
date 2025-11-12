import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import ProductFilters from "@/components/ProductFilters";
import ProductCard from "@/components/ProductCard";
import CategorySection from "@/components/CategorySection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp } from "lucide-react";
import { brandsStore } from "@/lib/brandsStore";
import { productsStore } from "@/lib/productsStore";
import { categoriesStore } from "@/lib/categoriesStore";
const Index = () => {
  const [viewMode, setViewMode] = useState<"home" | "filtered">("home");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [homeFilter, setHomeFilter] = useState("Todas");
  const [brands, setBrands] = useState<string[]>([]);
  const [products, setProducts] = useState(productsStore.getAvailableProducts());
  const [categories, setCategories] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    categoriesStore.getCategoryNames().then(names => {
      setCategories(["Todos", ...names]);
    });
  }, []);
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await productsStore.refreshFromBackend();
      loadProducts();
      setIsLoading(false);
    };
    init();
    loadBrands();
  }, [selectedCategory]);
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    if (searchQuery !== "") {
      setViewMode("filtered");
    }
  }, [searchQuery]);
  const loadBrands = async () => {
    if (selectedCategory === "Todos") {
      const allBrands = await brandsStore.getAllBrands();
      const uniqueBrands = Array.from(new Set(allBrands.map(b => b.name))).sort();
      setBrands(uniqueBrands);
    } else {
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
      const categoryMatch = selectedCategory === "Todos" || product.category === selectedCategory;
      const brandMatch = selectedBrand === "all" || product.brand === selectedBrand;
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = searchQuery === "" || product.name.toLowerCase().includes(searchLower) || product.brand.toLowerCase().includes(searchLower) || product.specs.toLowerCase().includes(searchLower);
      return categoryMatch && brandMatch && searchMatch;
    });
  }, [products, selectedCategory, selectedBrand, searchQuery]);
  const handleViewAll = (category: string) => {
    setSelectedCategory(category);
    setViewMode("filtered");
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  const handleBackToHome = () => {
    setSelectedCategory("Todos");
    setSelectedBrand("all");
    setSearchQuery("");
    setHomeFilter("Todas");
    setViewMode("home");
  };
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  const filteredCategories = useMemo(() => {
    return []; // Será populado via state
  }, []);
  const [filteredCats, setFilteredCats] = useState<any[]>([]);
  useEffect(() => {
    const loadFilteredCategories = async () => {
      const allCategories = await categoriesStore.getAllCategories();
      if (homeFilter === "Todas") {
        setFilteredCats(allCategories);
      } else {
        setFilteredCats(allCategories.filter(cat => cat.name === homeFilter));
      }
    };
    loadFilteredCategories();
  }, [homeFilter]);
  return <div className="min-h-screen bg-background">
      <Header searchValue={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-6">
        {viewMode === "home" ?
      // Modo Home: Categorias com 3 produtos cada
      <div className="space-y-6 pb-20">
            {/* Filtro de Categorias */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button variant={homeFilter === "Todas" ? "default" : "outline"} size="sm" onClick={() => setHomeFilter("Todas")} className="whitespace-nowrap">
                Todas
              </Button>
              {categories.filter(c => c !== "Todos").map(categoryName => <Button key={categoryName} variant={homeFilter === categoryName ? "default" : "outline"} size="sm" onClick={() => setHomeFilter(categoryName)} className="whitespace-nowrap">
                  {categoryName}
                </Button>)}
            </div>

            {/* Categorias Filtradas */}
            <div className="space-y-8">
              {isLoading ?
          // Loading Skeleton
          <div className="space-y-8">
                  {[1, 2, 3].map(i => <div key={i} className="space-y-4">
                      <Skeleton className="h-8 w-48" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(j => <div key={j} className="space-y-3">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>)}
                      </div>
                    </div>)}
                </div> : <>
                  {filteredCats.map(category => <CategorySection key={category.id} categoryName={category.name} onViewAll={handleViewAll} />)}
                  
                  {products.length === 0 && <div className="text-center py-20">
                      <p className="text-muted-foreground text-lg">
                        Catálogo em breve
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Novos produtos serão adicionados em breve
                      </p>
                      <Button onClick={handleRefreshCatalog} disabled={isRefreshing} className="mt-4">
                        {isRefreshing ? "Atualizando..." : "Atualizar catálogo"}
                      </Button>
                    </div>}
                </>}
            </div>
          </div> :
      // Modo Filtered: Grid com filtros
      <>
            <div className="mb-6 flex flex-col gap-3">
              <Button variant="ghost" onClick={handleBackToHome} className="self-start">
                ← Voltar para início
              </Button>
              
              <div className="flex items-center gap-3">
                <ProductFilters selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} selectedBrand={selectedBrand} onBrandChange={setSelectedBrand} brands={brands} categories={categories} />
                <p className="text-sm text-muted-foreground">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
                </p>
              </div>
            </div>
            
            {filteredProducts.length === 0 ? <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  Nenhum produto encontrado
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Tente ajustar os filtros ou buscar por outro termo
                </p>
              </div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-20">
                {filteredProducts.map(product => <ProductCard key={product.id} id={product.id} images={product.images} name={product.name} brand={product.brand} category={product.category} specs={product.specs} description={product.description} price={product.price} costPrice={product.costPrice} discountPrice={product.discountPrice} passOnCashDiscount={product.passOnCashDiscount} />)}
              </div>}
          </>}
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