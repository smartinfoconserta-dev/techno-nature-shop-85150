import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import ProductFilters from "@/components/ProductFilters";
import ProductCard from "@/components/ProductCard";
import ProductDetailsDialog from "@/components/ProductDetailsDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { brandsStore } from "@/lib/brandsStore";
import { productsStore } from "@/lib/productsStore";
import { categoriesStore } from "@/lib/categoriesStore";
import { CategoryMenu } from "@/components/CategoryMenu";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/hero-banner.jpg";

const Index = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [categoryBreadcrumb, setCategoryBreadcrumb] = useState<Array<{id: string, name: string}>>([]);
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [products, setProducts] = useState(productsStore.getAvailableProducts());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deepLinkProductId, setDeepLinkProductId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Estados para filtros
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(999999);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedProcessor, setSelectedProcessor] = useState("all");
  const [selectedRam, setSelectedRam] = useState("all");
  const [hasDedicatedGpu, setHasDedicatedGpu] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await productsStore.refreshFromBackend();
      loadProducts();
      setIsLoading(false);
    };
    init();

    // Deep linking
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('produto');
    if (productId) {
      setDeepLinkProductId(productId);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (deepLinkProductId && products.length > 0) {
      const product = products.find(p => p.id === deepLinkProductId);
      if (product) {
        setTimeout(() => {
          setDeepLinkProductId(product.id);
        }, 300);
      }
    }
  }, [deepLinkProductId, products]);

  useEffect(() => {
    loadBrands();
  }, [selectedCategoryName]);

  const loadBrands = async () => {
    if (selectedCategoryName) {
      const categoryBrands = await brandsStore.getBrandsByCategory(selectedCategoryName);
      setBrands(categoryBrands.map(b => b.name));
    } else {
      setBrands([]);
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

  const handleSelectCategory = async (categoryId: string | null, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    setSelectedBrand("all");
    setMobileMenuOpen(false);
    
    // Atualizar breadcrumb
    if (categoryId) {
      const path = await categoriesStore.getCategoryPath(categoryId);
      setCategoryBreadcrumb(path.map(c => ({ id: c.id, name: c.name })));
    } else {
      setCategoryBreadcrumb([]);
    }
    
    scrollToTop();
  };

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Filtro de categoria agora é por nome
      const categoryMatch = !selectedCategoryName || product.category === selectedCategoryName;
      
      const brandMatch = selectedBrand === "all" || product.brand === selectedBrand;
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = searchQuery === "" || 
        product.name.toLowerCase().includes(searchLower) || 
        product.brand.toLowerCase().includes(searchLower) || 
        product.specs.toLowerCase().includes(searchLower);
      
      const priceMatch = product.price >= minPrice && product.price <= maxPrice;
      
      // Filtros específicos de notebooks
      let notebookMatch = true;
      if (selectedCategoryName.toLowerCase().includes("notebook")) {
        if (selectedProcessor !== "all") {
          notebookMatch = notebookMatch && product.specifications?.processor === selectedProcessor;
        }
        
        if (selectedRam !== "all") {
          notebookMatch = notebookMatch && product.specifications?.ram === selectedRam;
        }
        
        if (hasDedicatedGpu === true) {
          notebookMatch = notebookMatch && (product.specifications?.dedicatedGPU === true);
        }
      }
      
      return categoryMatch && brandMatch && searchMatch && priceMatch && notebookMatch;
    });

    // Aplicar ordenação
    if (sortBy === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return filtered;
  }, [products, selectedCategoryName, selectedBrand, searchQuery, minPrice, maxPrice, sortBy, selectedProcessor, selectedRam, hasDedicatedGpu]);

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    // Calcular contagem de produtos por categoria se necessário
    return counts;
  }, [products]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleResetFilters = () => {
    setSelectedCategoryId(null);
    setSelectedCategoryName("");
    setCategoryBreadcrumb([]);
    setSelectedBrand("all");
    setSearchQuery("");
    setMinPrice(0);
    setMaxPrice(999999);
    setSortBy("newest");
    setSelectedProcessor("all");
    setSelectedRam("all");
    setHasDedicatedGpu(null);
    scrollToTop();
  };

  const SidebarContent = () => (
    <div className="h-full p-4 bg-card border-r">
      <CategoryMenu 
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
        productCounts={productCounts}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header searchValue={searchQuery} onSearchChange={setSearchQuery} onReset={handleResetFilters} />
      
      {/* Hero Banner */}
      <section className="relative h-[30vh] min-h-[250px] max-h-[320px] overflow-hidden animate-fade-in">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Tecnologia" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30" />
        </div>
        
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center space-y-3 px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-2xl text-gray-50 mx-[12px]">
              Ramon Tech Solutions
            </h1>
            <p className="text-lg md:text-xl drop-shadow-lg text-slate-50">
              Catálogo Digital de Tecnologia
            </p>
          </div>
        </div>
      </section>
      
      {/* Layout com Sidebar */}
      <div className="flex w-full">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-64 xl:w-72 sticky top-0 h-[calc(100vh-320px)] overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Sidebar Mobile (Sheet) */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="fixed bottom-4 left-4 z-40 lg:hidden shadow-lg"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="h-full overflow-y-auto">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Conteúdo Principal */}
        <main className="flex-1 container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          {categoryBreadcrumb.length > 0 && (
            <div className="mb-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      onClick={() => handleSelectCategory(null, "")}
                      className="cursor-pointer hover:text-primary"
                    >
                      Início
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {categoryBreadcrumb.map((cat, index) => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          onClick={() => handleSelectCategory(cat.id, cat.name)}
                          className={cn(
                            "cursor-pointer hover:text-primary",
                            index === categoryBreadcrumb.length - 1 && "font-semibold text-primary"
                          )}
                        >
                          {cat.name}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          )}

          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-3">
              <ProductFilters 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedBrand={selectedBrand} 
                onBrandChange={setSelectedBrand} 
                brands={brands} 
                sortBy={sortBy}
                onSortChange={setSortBy}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onMinPriceChange={setMinPrice}
                onMaxPriceChange={setMaxPrice}
                selectedProcessor={selectedProcessor}
                onProcessorChange={setSelectedProcessor}
                selectedRam={selectedRam}
                onRamChange={setSelectedRam}
                hasDedicatedGpu={hasDedicatedGpu}
                onDedicatedGpuChange={setHasDedicatedGpu}
                selectedCategory={selectedCategoryName}
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
              </p>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-20">
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
                  : "Tente ajustar os filtros ou buscar por outro termo"}
              </p>
              {products.length === 0 && (
                <Button onClick={handleRefreshCatalog} disabled={isRefreshing} className="mt-4">
                  {isRefreshing ? "Atualizando..." : "Atualizar catálogo"}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-20">
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
      </div>
      
      <footer className="bg-muted py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Catálogo digital — Ramon Tech Solutions  
          </p>
        </div>
      </footer>

      {/* Botão Voltar ao Topo */}
      {showScrollTop && (
        <Button 
          onClick={scrollToTop} 
          size="icon" 
          className="fixed bottom-4 right-4 z-50 shadow-lg" 
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}

    </div>
  );
};

export default Index;
