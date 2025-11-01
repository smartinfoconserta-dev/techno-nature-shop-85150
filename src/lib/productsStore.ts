export interface ProductExpense {
  id: string;
  label: string;
  value: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: "Notebooks" | "Celulares";
  images: string[];
  specs: string;
  description: string;
  price: number;
  discountPrice?: number;
  order: number;
  sold: boolean;
  salePrice?: number;
  saleDate?: string;
  buyerName?: string;
  expenses: ProductExpense[];
  createdAt: string;
}

const STORAGE_KEY = "products_data";

// Seed inicial com os produtos existentes
const initialProducts: Product[] = [
  {
    id: "1",
    name: "Notebook Pro X1",
    brand: "Dell",
    category: "Notebooks",
    images: ["/src/assets/product-notebook-1.jpg"],
    specs: "Intel i7, 16GB RAM, 512GB SSD",
    description: "Notebook profissional de alta performance",
    price: 4500,
    discountPrice: 4275,
    order: 0,
    sold: false,
    expenses: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Smartphone Galaxy S21",
    brand: "Samsung",
    category: "Celulares",
    images: ["/src/assets/product-phone-1.jpg"],
    specs: "128GB, 5G, Câmera 64MP",
    description: "Smartphone top de linha com 5G",
    price: 3200,
    discountPrice: 3040,
    order: 1,
    sold: false,
    expenses: [],
    createdAt: new Date().toISOString(),
  },
];

export const productsStore = {
  getAllProducts(): Product[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProducts));
      return initialProducts;
    }
    return JSON.parse(stored);
  },

  getProductsByCategory(category: "Notebooks" | "Celulares"): Product[] {
    return this.getAllProducts()
      .filter((p) => p.category === category && !p.sold)
      .sort((a, b) => a.order - b.order);
  },

  getAvailableProducts(): Product[] {
    return this.getAllProducts()
      .filter((p) => !p.sold)
      .sort((a, b) => a.order - b.order);
  },

  getSoldProducts(): Product[] {
    return this.getAllProducts()
      .filter((p) => p.sold)
      .sort((a, b) => {
        if (!a.saleDate || !b.saleDate) return 0;
        return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
      });
  },

  addProduct(data: Omit<Product, "id" | "order" | "sold" | "expenses" | "createdAt">): Product {
    const products = this.getAllProducts();
    const maxOrder = products.length > 0 ? Math.max(...products.map((p) => p.order)) : -1;
    
    const newProduct: Product = {
      ...data,
      id: Date.now().toString(),
      order: maxOrder + 1,
      sold: false,
      expenses: [],
      createdAt: new Date().toISOString(),
    };
    
    products.push(newProduct);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return newProduct;
  },

  updateProduct(id: string, data: Partial<Product>): Product {
    const products = this.getAllProducts();
    const index = products.findIndex((p) => p.id === id);
    
    if (index === -1) throw new Error("Produto não encontrado");
    
    products[index] = { ...products[index], ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return products[index];
  },

  deleteProduct(id: string): void {
    const products = this.getAllProducts();
    const filtered = products.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  reorderProducts(reorderedList: Product[]): void {
    const products = this.getAllProducts();
    
    // Atualizar apenas a ordem dos produtos reordenados
    reorderedList.forEach((item, index) => {
      const product = products.find((p) => p.id === item.id);
      if (product) {
        product.order = index;
      }
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  },

  markAsSold(id: string, salePrice: number, buyerName: string): Product {
    const products = this.getAllProducts();
    const product = products.find((p) => p.id === id);
    
    if (!product) throw new Error("Produto não encontrado");
    
    product.sold = true;
    product.salePrice = salePrice;
    product.saleDate = new Date().toISOString();
    product.buyerName = buyerName.trim();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return product;
  },

  addExpense(productId: string, label: string, value: number): Product {
    const products = this.getAllProducts();
    const product = products.find((p) => p.id === productId);
    
    if (!product) throw new Error("Produto não encontrado");
    
    const newExpense: ProductExpense = {
      id: Date.now().toString(),
      label,
      value,
      createdAt: new Date().toISOString(),
    };
    
    product.expenses.push(newExpense);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return product;
  },

  removeExpense(productId: string, expenseId: string): Product {
    const products = this.getAllProducts();
    const product = products.find((p) => p.id === productId);
    
    if (!product) throw new Error("Produto não encontrado");
    
    product.expenses = product.expenses.filter((e) => e.id !== expenseId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return product;
  },

  computeTotals() {
    const soldProducts = this.getSoldProducts();
    
    const totalGross = soldProducts.reduce((sum, p) => sum + (p.salePrice || 0), 0);
    const totalExpenses = soldProducts.reduce((sum, p) => 
      sum + p.expenses.reduce((expSum, e) => expSum + e.value, 0), 0
    );
    const netProfit = totalGross - totalExpenses;
    const averageMargin = totalGross > 0 ? ((netProfit / totalGross) * 100) : 0;
    
    return {
      totalGross,
      totalExpenses,
      netProfit,
      averageMargin,
      soldCount: soldProducts.length,
    };
  },
};
