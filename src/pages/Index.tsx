import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import ProductDetailsDialog from "@/components/ProductDetailsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, Search } from "lucide-react";
import { brandsStore } from "@/lib/brandsStore";
import { productsStore } from "@/lib/productsStore";
import { categoriesStore, CategoryTreeNode } from "@/lib/categoriesStore";
import { bannersStore } from "@/lib/bannersStore";
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
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [activeBanner, setActiveBanner] = useState<any>(null);

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Header 
        searchValue="" 
        onSearchChange={() => {}} 
        onReset={handleResetFilters} 
      />

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-black">
        <div className="relative w-full aspect-[16/7] lg:aspect-[21/7]">
          <img
            src={bannerUrl || heroImage}
            alt="Banner principal"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Barra de Busca Principal */}
      <div className="bg-white/95 backdrop-blur-md border-b border-indigo-100 py-4 shadow-lg">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400" />
              <Input
                placeholder="Buscar produtos por nome ou marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 border-2 border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-xl h-12 text-base bg-white shadow-sm"
              />
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
            
            {/* Categorias existentes */}
            {categoryTree.map(category => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                variant="ghost"
                className={`
                  whitespace-nowrap rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-xl
                  ${
                    selectedCategory === category.name
                      ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white border-0 scale-105 shadow-lg hover:scale-110"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
                  }
                `}
                size="default"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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