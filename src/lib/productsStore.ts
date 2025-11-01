export interface ProductExpense {
  id: string;
  label: string;
  value: number;
  description?: string;
  paymentMethod?: "cash" | "pix" | "card";
  sellerCpf?: string;
  createdAt: string;
}

export interface PaymentBreakdown {
  cash: number;
  pix: number;
  card: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  images: string[];
  specs: string;
  description: string;
  price: number;
  discountPrice?: number;
  order: number;
  sold: boolean;
  salePrice?: number;
  paymentBreakdown?: PaymentBreakdown;
  taxAmount?: number;
  saleDate?: string;
  buyerName?: string;
  buyerCpf?: string;
  invoiceUrl?: string;
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
  {
    id: "3",
    name: "MacBook Air M2",
    brand: "Apple",
    category: "Notebooks",
    images: ["/placeholder.svg"],
    specs: "Chip M2, 8GB RAM, 256GB SSD, Tela Retina 13.6\"",
    description: "Notebook ultrafino com performance excepcional",
    price: 8999,
    discountPrice: 8549,
    order: 2,
    sold: false,
    expenses: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Lenovo IdeaPad 3i",
    brand: "Lenovo",
    category: "Notebooks",
    images: ["/placeholder.svg"],
    specs: "Intel i5, 8GB RAM, 256GB SSD, Tela 15.6\" Full HD",
    description: "Notebook ideal para uso diário e estudos",
    price: 2799,
    discountPrice: 2659,
    order: 3,
    sold: false,
    expenses: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "iPhone 14 Pro",
    brand: "Apple",
    category: "Celulares",
    images: ["/placeholder.svg"],
    specs: "128GB, 5G, Câmera 48MP, Dynamic Island",
    description: "iPhone top de linha com tecnologia de ponta",
    price: 7499,
    discountPrice: 7124,
    order: 4,
    sold: false,
    expenses: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Xiaomi Redmi Note 12",
    brand: "Xiaomi",
    category: "Celulares",
    images: ["/placeholder.svg"],
    specs: "128GB, 4G, Câmera 50MP, Bateria 5000mAh",
    description: "Custo-benefício excepcional com ótima bateria",
    price: 1399,
    discountPrice: 1329,
    order: 5,
    sold: false,
    expenses: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    name: "iPad 10ª Geração",
    brand: "Apple",
    category: "Tablets",
    images: ["/placeholder.svg"],
    specs: "64GB, Wi-Fi, Tela Liquid Retina 10.9\", Chip A14",
    description: "iPad versátil para trabalho e entretenimento",
    price: 3299,
    discountPrice: 3134,
    order: 6,
    sold: false,
    expenses: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Galaxy Tab S9",
    brand: "Samsung",
    category: "Tablets",
    images: ["/placeholder.svg"],
    specs: "128GB, Wi-Fi + 5G, Tela 11\", S Pen incluída",
    description: "Tablet premium com S Pen para produtividade",
    price: 4599,
    discountPrice: 4369,
    order: 7,
    sold: false,
    expenses: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "9",
    name: "Apple Watch Series 9",
    brand: "Apple",
    category: "Smartwatches",
    images: ["/placeholder.svg"],
    specs: "GPS, 41mm, Caixa de Alumínio, Pulseira Esportiva",
    description: "Smartwatch com monitoramento avançado de saúde",
    price: 3999,
    discountPrice: 3799,
    order: 8,
    sold: false,
    expenses: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "10",
    name: "Galaxy Watch 6",
    brand: "Samsung",
    category: "Smartwatches",
    images: ["/placeholder.svg"],
    specs: "Bluetooth, 40mm, Monitor de Sono, Resistente à Água",
    description: "Relógio inteligente com design elegante",
    price: 1899,
    discountPrice: 1804,
    order: 9,
    sold: false,
    expenses: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "11",
    name: "AirPods Pro 2ª Geração",
    brand: "Apple",
    category: "Fones de Ouvido",
    images: ["/placeholder.svg"],
    specs: "Cancelamento de Ruído, Áudio Espacial, Resistente à Água",
    description: "Fones wireless premium com cancelamento ativo",
    price: 2299,
    discountPrice: 2184,
    order: 10,
    sold: false,
    expenses: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "12",
    name: "JBL Tune 510BT",
    brand: "JBL",
    category: "Fones de Ouvido",
    images: ["/placeholder.svg"],
    specs: "Bluetooth, Bateria 40h, Dobrável, Som JBL Pure Bass",
    description: "Headphone wireless com excelente autonomia",
    price: 249,
    discountPrice: 236,
    order: 11,
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

  getProductsByCategory(category: string): Product[] {
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

  markAsSold(id: string, buyerName: string, buyerCpf: string, cash: number, pix: number, card: number): Product {
    const products = this.getAllProducts();
    const product = products.find((p) => p.id === id);
    
    if (!product) throw new Error("Produto não encontrado");
    
    // Importar settings dinamicamente para evitar circular dependency
    const settingsData = localStorage.getItem("app_settings");
    const settings = settingsData ? JSON.parse(settingsData) : {
      taxSettings: { digitalTaxRate: 6, includeCashInTax: false }
    };
    
    const salePrice = cash + pix + card;
    const digitalAmount = pix + card;
    
    // Calcular imposto baseado nas configurações
    const taxableAmount = settings.taxSettings.includeCashInTax ? salePrice : digitalAmount;
    const taxAmount = taxableAmount * (settings.taxSettings.digitalTaxRate / 100);
    
    product.sold = true;
    product.salePrice = salePrice;
    product.paymentBreakdown = { cash, pix, card };
    product.taxAmount = taxAmount;
    product.saleDate = new Date().toISOString();
    product.buyerName = buyerName.trim();
    product.buyerCpf = buyerCpf.trim();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return product;
  },

  addExpense(
    productId: string,
    label: string,
    value: number,
    paymentMethod: "cash" | "pix" | "card",
    description?: string,
    sellerCpf?: string
  ): Product {
    const products = this.getAllProducts();
    const product = products.find((p) => p.id === productId);
    
    if (!product) throw new Error("Produto não encontrado");
    
    const newExpense: ProductExpense = {
      id: Date.now().toString(),
      label,
      value,
      paymentMethod,
      description: description?.trim(),
      sellerCpf: sellerCpf?.trim(),
      createdAt: new Date().toISOString(),
    };
    
    product.expenses.push(newExpense);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return product;
  },

  updateExpense(
    productId: string,
    expenseId: string,
    updates: Partial<Omit<ProductExpense, "id" | "createdAt">>
  ): Product {
    const products = this.getAllProducts();
    const product = products.find((p) => p.id === productId);
    
    if (!product) throw new Error("Produto não encontrado");
    
    const expense = product.expenses.find((e) => e.id === expenseId);
    if (!expense) throw new Error("Gasto não encontrado");
    
    Object.assign(expense, updates);
    
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

  updateSale(
    productId: string,
    buyerName: string,
    salePrice: number,
    saleDate: string,
    invoiceUrl?: string
  ): Product {
    const products = this.getAllProducts();
    const product = products.find((p) => p.id === productId);

    if (!product) throw new Error("Produto não encontrado");
    if (!product.sold) throw new Error("Produto não está marcado como vendido");

    product.buyerName = buyerName.trim();
    product.salePrice = salePrice;
    product.saleDate = saleDate;
    product.invoiceUrl = invoiceUrl?.trim();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return product;
  },

  cancelSale(id: string): Product {
    const products = this.getAllProducts();
    const product = products.find((p) => p.id === id);
    
    if (!product) throw new Error("Produto não encontrado");
    if (!product.sold) throw new Error("Produto não está marcado como vendido");
    
    // Restaurar produto para estado disponível
    product.sold = false;
    product.salePrice = undefined;
    product.paymentBreakdown = undefined;
    product.taxAmount = undefined;
    product.saleDate = undefined;
    product.buyerName = undefined;
    product.buyerCpf = undefined;
    product.invoiceUrl = undefined;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return product;
  },

  computeTotals() {
    const soldProducts = this.getSoldProducts();
    
    const totalGross = soldProducts.reduce((sum, p) => sum + (p.salePrice || 0), 0);
    const totalCash = soldProducts.reduce((sum, p) => sum + (p.paymentBreakdown?.cash || 0), 0);
    const totalPix = soldProducts.reduce((sum, p) => sum + (p.paymentBreakdown?.pix || 0), 0);
    const totalCard = soldProducts.reduce((sum, p) => sum + (p.paymentBreakdown?.card || 0), 0);
    const totalDigital = totalPix + totalCard;
    const totalTax = soldProducts.reduce((sum, p) => sum + (p.taxAmount || 0), 0);
    const totalExpenses = soldProducts.reduce((sum, p) => 
      sum + p.expenses.reduce((expSum, e) => expSum + e.value, 0), 0
    );
    const netProfit = totalGross - totalExpenses;
    const averageMargin = totalGross > 0 ? ((netProfit / totalGross) * 100) : 0;
    
    return {
      totalGross,
      totalCash,
      totalPix,
      totalCard,
      totalDigital,
      totalTax,
      totalExpenses,
      netProfit,
      averageMargin,
      soldCount: soldProducts.length,
    };
  },

  computeCurrentMonthTotals() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filtra apenas vendas do mês atual
    const soldProducts = this.getSoldProducts().filter(p => {
      if (!p.saleDate) return false;
      const saleDate = new Date(p.saleDate);
      return saleDate >= currentMonthStart;
    });

    const totalGross = soldProducts.reduce((sum, p) => sum + (p.salePrice || 0), 0);
    const totalCash = soldProducts.reduce((sum, p) => sum + (p.paymentBreakdown?.cash || 0), 0);
    const totalPix = soldProducts.reduce((sum, p) => sum + (p.paymentBreakdown?.pix || 0), 0);
    const totalCard = soldProducts.reduce((sum, p) => sum + (p.paymentBreakdown?.card || 0), 0);
    const totalDigital = totalPix + totalCard;
    const totalTax = soldProducts.reduce((sum, p) => sum + (p.taxAmount || 0), 0);
    const totalExpenses = soldProducts.reduce((sum, p) => 
      sum + p.expenses.reduce((expSum, e) => expSum + e.value, 0), 0
    );
    const netProfit = totalGross - totalExpenses;
    const averageMargin = totalGross > 0 ? ((netProfit / totalGross) * 100) : 0;

    return {
      totalGross,
      totalCash,
      totalPix,
      totalCard,
      totalDigital,
      totalTax,
      totalExpenses,
      netProfit,
      averageMargin,
      soldCount: soldProducts.length,
    };
  },
};
