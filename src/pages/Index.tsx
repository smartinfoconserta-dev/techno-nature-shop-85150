import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ProductFilters from "@/components/ProductFilters";
import ProductCard from "@/components/ProductCard";
import { brandsStore } from "@/lib/brandsStore";
import notebookImg from "@/assets/product-notebook-1.jpg";
import phoneImg from "@/assets/product-phone-1.jpg";

// Mock data - will be replaced with database
const mockProducts = [
  {
    id: "1",
    image: notebookImg,
    name: "Notebook Pro X1",
    brand: "Dell",
    category: "Notebooks",
    specs: "Intel i7, 16GB RAM, 512GB SSD",
    description: "Alta tecnologia e desempenho para suas tarefas.",
    price: 4500.00,
    discountPrice: 3825.00
  },
  {
    id: "2",
    image: phoneImg,
    name: "Smartphone Ultra",
    brand: "Samsung",
    category: "Celulares",
    specs: "8GB RAM, 256GB, Câmera 108MP",
    description: "Conectividade e qualidade em suas mãos.",
    price: 3200.00,
    discountPrice: 2720.00
  },
  {
    id: "3",
    image: notebookImg,
    name: "MacBook Air M2",
    brand: "Apple",
    category: "Notebooks",
    specs: "Apple M2, 8GB RAM, 256GB SSD",
    description: "Design premium e performance excepcional.",
    price: 8900.00,
    discountPrice: 7565.00
  },
  {
    id: "4",
    image: phoneImg,
    name: "iPhone 14 Pro",
    brand: "Apple",
    category: "Celulares",
    specs: "6GB RAM, 256GB, A16 Bionic",
    description: "O futuro da tecnologia móvel.",
    price: 7800.00,
    discountPrice: 6630.00
  }
];

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    loadBrands();
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

  const filteredProducts = mockProducts.filter(product => {
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
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
