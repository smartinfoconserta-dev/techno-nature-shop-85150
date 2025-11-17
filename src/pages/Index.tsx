import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import ProductFilters from "@/components/ProductFilters";
import ProductCard from "@/components/ProductCard";
import ProductDetailsDialog from "@/components/ProductDetailsDialog";
import { CategoryDropdownButton } from "@/components/CategoryDropdownButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp } from "lucide-react";
import { brandsStore } from "@/lib/brandsStore";
import { productsStore } from "@/lib/productsStore";
import { categoriesStore, CategoryTreeNode } from "@/lib/categoriesStore";
import heroImage from "@/assets/hero-banner.jpg";
const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [products, setProducts] = useState(productsStore.getAvailableProducts());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deepLinkProductId, setDeepLinkProductId] = useState<string | null>(null);

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

      // 1. Carregar categorias primeiro
      const tree = await categoriesStore.getCategoryTree();
      setCategoryTree(tree);

      // 2. Encontrar e definir Notebooks como categoria inicial
      const notebooksCategory = tree.find(cat => cat.name.toLowerCase().includes('notebook'));
      if (notebooksCategory) {
        setSelectedCategory(notebooksCategory.name);
      }

      // 3. Carregar produtos
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
  }, [selectedCategory]);
  const loadCategories = async () => {
    const tree = await categoriesStore.getCategoryTree();
    setCategoryTree(tree);
  };
  const loadBrands = async () => {
    if (selectedCategory) {
      const categoryBrands = await brandsStore.getBrandsByCategory(selectedCategory);
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
  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setSelectedBrand("all");
    scrollToTop();
  };
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const categoryMatch = !selectedCategory || product.category === selectedCategory;
      const brandMatch = selectedBrand === "all" || product.brand === selectedBrand;
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = searchQuery === "" || product.name.toLowerCase().includes(searchLower) || product.brand.toLowerCase().includes(searchLower) || product.specs.toLowerCase().includes(searchLower);
      const priceMatch = product.price >= minPrice && product.price <= maxPrice;

      // Filtros específicos de notebooks
      let notebookMatch = true;
      if (selectedCategory.toLowerCase().includes("notebook")) {
        if (selectedProcessor !== "all") {
          notebookMatch = notebookMatch && product.specifications?.processor === selectedProcessor;
        }
        if (selectedRam !== "all") {
          notebookMatch = notebookMatch && product.specifications?.ram === selectedRam;
        }
        if (hasDedicatedGpu === true) {
          notebookMatch = notebookMatch && product.specifications?.dedicatedGPU === true;
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
  }, [products, selectedCategory, selectedBrand, searchQuery, minPrice, maxPrice, sortBy, selectedProcessor, selectedRam, hasDedicatedGpu]);
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  const handleResetFilters = async () => {
    const tree = await categoriesStore.getCategoryTree();
    const notebooksCategory = tree.find(cat => cat.name.toLowerCase().includes('notebook'));
    if (notebooksCategory) {
      setSelectedCategory(notebooksCategory.name);
    }
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
  return <div className="min-h-screen bg-background">
      <Header searchValue={searchQuery} onSearchChange={setSearchQuery} onReset={handleResetFilters} />
      
      {/* Hero Banner */}
      <section className="relative h-[30vh] min-h-[250px] max-h-[320px] overflow-hidden animate-fade-in">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Tecnologia" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/12 to-primary-purple/15" />
        </div>
        
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 drop-shadow-lg">
              Ramon Tech Solutions  
            </h1>
            <p className="text-base md:text-xl drop-shadow-md">
              Catálogo Digital de tecnologias

   
            </p>
          </div>
        </div>
      </section>

      {/* Categorias Horizontais */}
      <section className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categoryTree.map(category => <CategoryDropdownButton key={category.id} category={category} selectedCategory={selectedCategory} onSelectCategory={handleSelectCategory} />)}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-4 pb-8">
        <ProductFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCategory={selectedCategory} selectedBrand={selectedBrand} onBrandChange={setSelectedBrand} brands={brands} minPrice={minPrice} maxPrice={maxPrice} onMinPriceChange={setMinPrice} onMaxPriceChange={setMaxPrice} sortBy={sortBy} onSortChange={setSortBy} selectedProcessor={selectedProcessor} onProcessorChange={setSelectedProcessor} selectedRam={selectedRam} onRamChange={setSelectedRam} hasDedicatedGpu={hasDedicatedGpu} onDedicatedGpuChange={setHasDedicatedGpu} />

        {/* Products Grid */}
        <div className="mt-8">
          {isLoading ? <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({
            length: 8
          }).map((_, i) => <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>)}
            </div> : filteredProducts.length === 0 ? <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">Nenhum produto encontrado.</p>
              <Button variant="link" onClick={handleResetFilters} className="mt-2">
                Limpar filtros
              </Button>
            </div> : <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => <ProductCard key={product.id} id={product.id} images={product.images} name={product.name} brand={product.brand} category={product.category} specs={product.specs} description={product.description} price={product.price} costPrice={product.costPrice} discountPrice={product.discountPrice} passOnCashDiscount={product.passOnCashDiscount} sold={product.sold} />)}
            </div>}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t bg-muted/20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Sua Empresa. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && <Button className="fixed bottom-8 right-8 rounded-full h-12 w-12 shadow-lg z-50" size="icon" onClick={scrollToTop}>
          <ArrowUp className="h-5 w-5" />
        </Button>}

      {deepLinkProductId && (() => {
      const product = products.find(p => p.id === deepLinkProductId);
      if (!product) return null;
      return <ProductDetailsDialog open={!!deepLinkProductId} onOpenChange={open => {
        if (!open) setDeepLinkProductId(null);
      }} id={product.id} images={product.images} name={product.name} brand={product.brand} specs={product.specs} description={product.description} price={product.price} costPrice={product.costPrice} discountPrice={product.discountPrice} passOnCashDiscount={product.passOnCashDiscount} />;
    })()}
    </div>;
};
export default Index;