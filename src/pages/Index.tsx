import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import ProductFilters from "@/components/ProductFilters";
import ProductCard from "@/components/ProductCard";
import { brandsStore } from "@/lib/brandsStore";
import { productsStore } from "@/lib/productsStore";
import { categoriesStore } from "@/lib/categoriesStore";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [products, setProducts] = useState(productsStore.getAvailableProducts());
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    setCategories(["Todos", ...categoriesStore.getCategoryNames()]);
  }, []);

  useEffect(() => {
    loadBrands();
    loadProducts();
  }, [selectedCategory]);

  const loadBrands = () => {
    if (selectedCategory === "Todos") {
      const allBrands = brandsStore.getAllBrands();
      const uniqueBrands = Array.from(new Set(allBrands.map(b => b.name))).sort();
      setBrands(uniqueBrands);
    } else {
      const categoryBrands = brandsStore.getBrandsByCategory(selectedCategory);
      setBrands(categoryBrands.map(b => b.name));
    }
  };

  const loadProducts = () => {
    setProducts(productsStore.getAvailableProducts());
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const categoryMatch = selectedCategory === "Todos" || product.category === selectedCategory;
      const brandMatch = selectedBrand === "all" || product.brand === selectedBrand;
      
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = searchQuery === "" || 
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.specs.toLowerCase().includes(searchLower);
      
      return categoryMatch && brandMatch && searchMatch;
    });
  }, [products, selectedCategory, selectedBrand, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header searchValue={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <ProductFilters
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedBrand={selectedBrand}
            onBrandChange={setSelectedBrand}
            brands={brands}
            categories={categories}
          />
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
          </p>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              Nenhum produto encontrado
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Tente ajustar os filtros ou buscar por outro termo
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-20">
            {filteredProducts.map((product) => (
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
            Catálogo digital — Ramon Casagrande
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
