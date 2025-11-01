import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ProductFilters from "@/components/ProductFilters";
import ProductCard from "@/components/ProductCard";
import { brandsStore } from "@/lib/brandsStore";
import { productsStore } from "@/lib/productsStore";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [brands, setBrands] = useState<string[]>([]);
  const [products, setProducts] = useState(productsStore.getAvailableProducts());

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
      const categoryBrands = brandsStore.getBrandsByCategory(selectedCategory as any);
      setBrands(categoryBrands.map(b => b.name));
    }
  };

  const loadProducts = () => {
    setProducts(productsStore.getAvailableProducts());
  };

  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === "Todos" || product.category === selectedCategory;
    const brandMatch = selectedBrand === "all" || product.brand === selectedBrand;
    return categoryMatch && brandMatch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-6">Catálogo de Produtos</h2>
          <ProductFilters
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedBrand={selectedBrand}
            onBrandChange={setSelectedBrand}
            brands={brands}
          />
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum produto encontrado nesta categoria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </main>
      
      <footer className="bg-muted py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Catálogo digital — Ramon Casagrande
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
