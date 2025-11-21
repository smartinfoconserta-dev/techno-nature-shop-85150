import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import ProductDetailsDialog from "@/components/ProductDetailsDialog";
import ProductFilters from "@/components/ProductFilters";
import { CategoryDropdownButton } from "@/components/CategoryDropdownButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowUp, Search, SlidersHorizontal } from "lucide-react";
import { brandsStore } from "@/lib/brandsStore";
import { productsStore } from "@/lib/productsStore";
import { categoriesStore, CategoryTreeNode, Category } from "@/lib/categoriesStore";
import { bannersStore } from "@/lib/bannersStore";

// Função para embaralhar array aleatoriamente (Fisher-Yates shuffle)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

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
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [activeBanner, setActiveBanner] = useState<any>(null);
  const [categoryNamesInSelection, setCategoryNamesInSelection] = useState<string[]>([]);
  const [categoryPath, setCategoryPath] = useState<Category[]>([]);

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

      // 3. Carregar banner ativo
      try {
        await bannersStore.refreshFromBackend();
        const banner = bannersStore.getActiveBanner();
        if (banner) {
          setActiveBanner(banner);
          setBannerUrl(banner.image_url);
        }
      } catch (error) {
        console.error("Erro ao carregar banner:", error);
      }

      // 4. Carregar produtos
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
    loadCategoryNames();
    updateCategoryPath();
  }, [selectedCategory]);

  const updateCategoryPath = async () => {
    if (selectedCategory) {
      const allCategories = await categoriesStore.getAllCategories();
      const category = allCategories.find(c => c.name === selectedCategory);
      if (category) {
        const path = await categoriesStore.getCategoryPath(category.id);
        setCategoryPath(path);
      }
    } else {
      setCategoryPath([]);
    }
  };

  const loadCategoryNames = async () => {
    if (selectedCategory) {
      const names = await categoriesStore.getAllCategoryNamesInTree(selectedCategory);
      setCategoryNamesInSelection(names);
    } else {
      setCategoryNamesInSelection([]);
    }
  };
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
      const categoryMatch = !selectedCategory || categoryNamesInSelection.includes(product.category);
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
    // Se estiver na aba "Todos", ordem aleatória
    if (selectedCategory === "") {
      filtered = shuffleArray(filtered);
    } else if (sortBy === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return filtered;
  }, [products, selectedCategory, selectedBrand, searchQuery, minPrice, maxPrice, sortBy, selectedProcessor, selectedRam, hasDedicatedGpu, categoryNamesInSelection]);
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Header 
        searchValue="" 
        onSearchChange={() => {}} 
        onReset={handleResetFilters} 
      />

      {/* Hero Banner - Só renderiza se houver banner ativo */}
      {bannerUrl && (
        <section className="relative overflow-hidden bg-black">
          <div className="relative w-full aspect-[16/7] lg:aspect-[21/7]">
            <img
              src={bannerUrl}
              alt="Banner principal"
              className="w-full h-full object-cover"
            />
          </div>
        </section>
      )}

      {/* Barra de Busca Principal */}
      <div className="bg-white/95 backdrop-blur-md border-b border-indigo-100 py-4 shadow-lg">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400" />
              <Input
                placeholder="Buscar produtos por nome ou marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 border-2 border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-xl h-12 text-base bg-white shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <ProductFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedBrand={selectedBrand}
                onBrandChange={setSelectedBrand}
                brands={brands}
                minPrice={minPrice}
                onMinPriceChange={setMinPrice}
                maxPrice={maxPrice}
                onMaxPriceChange={setMaxPrice}
                sortBy={sortBy}
                onSortChange={setSortBy}
                selectedProcessor={selectedProcessor}
                onProcessorChange={setSelectedProcessor}
                selectedRam={selectedRam}
                onRamChange={setSelectedRam}
                hasDedicatedGpu={hasDedicatedGpu}
                onDedicatedGpuChange={setHasDedicatedGpu}
                selectedCategory={selectedCategory}
              />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-12 border-2 border-indigo-200 focus:border-indigo-500 rounded-xl bg-white">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="newest">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                  <SelectItem value="price-asc">Menor preço</SelectItem>
                  <SelectItem value="price-desc">Maior preço</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Categorias */}
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Botão "Todos" */}
            <Button
              onClick={() => setSelectedCategory("")}
              variant="ghost"
              className={`
                whitespace-nowrap rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-xl
                ${
                  selectedCategory === ""
                    ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white border-0 scale-105 shadow-lg hover:scale-110"
                    : "bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
                }
              `}
              size="default"
            >
              Todos
            </Button>
            
            {/* Categorias com dropdown para subcategorias */}
            {categoryTree.map(category => (
              <CategoryDropdownButton
                key={category.id}
                category={category}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        {categoryPath.length > 0 && (
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => setSelectedCategory("")}
                  className="cursor-pointer hover:text-indigo-600"
                >
                  Início
                </BreadcrumbLink>
              </BreadcrumbItem>
              {categoryPath.map((cat, index) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index === categoryPath.length - 1 ? (
                      <BreadcrumbPage>{cat.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink 
                        onClick={() => setSelectedCategory(cat.name)}
                        className="cursor-pointer hover:text-indigo-600"
                      >
                        {cat.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* Contador de produtos */}
        {!isLoading && (
          <div className="text-sm text-muted-foreground mb-4">
            Mostrando {filteredProducts.length} de {products.length} produtos
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Nenhum produto encontrado.</p>
            <Button variant="link" onClick={handleResetFilters} className="mt-2">
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </main>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg z-50"
          size="icon"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};
export default Index;