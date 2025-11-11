import { supabase } from "@/integrations/supabase/client";

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
  costPrice?: number;
  discountPrice?: number;
  passOnCashDiscount?: boolean;
  order: number;
  sold: boolean;
  salePrice?: number;
  paymentBreakdown?: PaymentBreakdown;
  taxAmount?: number;
  saleDate?: string;
  buyerName?: string;
  buyerCpf?: string;
  invoiceUrl?: string;
  soldOnCredit?: boolean;
  receivableId?: string;
  warranty?: number;
  warrantyExpiresAt?: string;
  expenses: ProductExpense[];
  createdAt: string;
}

// Lightweight sync cache with background refresh
const PRODUCTS_STORAGE_KEY = "products_data";
let productsCache: Product[] = [];
let productsInitialized = false;

const genId = () => (typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

function loadProductsCache() {
  // Cache apenas em memória - não lê localStorage
  if (productsInitialized) return;
  productsCache = [];
  productsInitialized = true;
}

function saveProductsCache() {
  // No-op: cache apenas em memória - não salva em localStorage
}

function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    images: row.images || [],
    specs: row.specifications || "",
    description: row.description || "",
    price: Number(row.base_price),
    costPrice: row.base_price ? Number(row.base_price) : undefined,
    discountPrice: undefined,
    passOnCashDiscount: false,
    order: row.product_order || 0,
    sold: row.sold || false,
    salePrice: row.sale_price ? Number(row.sale_price) : undefined,
    paymentBreakdown: row.payment_breakdown as PaymentBreakdown | undefined,
    taxAmount: row.digital_tax ? Number(row.digital_tax) : undefined,
    saleDate: row.sold_date || undefined,
    buyerName: row.customer_name || undefined,
    buyerCpf: undefined,
    invoiceUrl: undefined,
    soldOnCredit: false,
    receivableId: undefined,
    warranty: row.warranty_months || undefined,
    warrantyExpiresAt: undefined,
    expenses: ((row.expenses as any[]) || []).map((exp: any) => ({
      id: exp.id || String(Date.now()),
      label: exp.label || "",
      value: Number(exp.value || 0),
      description: exp.description,
      paymentMethod: exp.paymentMethod,
      sellerCpf: exp.sellerCpf,
      createdAt: exp.createdAt || new Date().toISOString(),
    })),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export const productsStore = {
  async refreshFromBackend(): Promise<void> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("product_order", { ascending: true });
    if (error) {
      console.error("Erro ao carregar produtos do backend:", error);
      return;
    }
    const mapped = (data || []).map(mapRowToProduct);
    productsCache = mapped;
    saveProductsCache();
  },

  getAllProducts(): Product[] {
    loadProductsCache();
    if (!productsCache.length) {
      // Atualiza em background sem bloquear UI
      this.refreshFromBackend();
    }
    // retorna cópia ordenada
    return [...productsCache].sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  getProductsByCategory(category: string): Product[] {
    return this.getAllProducts()
      .filter((p) => p.category === category && !p.sold)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  getAvailableProducts(): Product[] {
    return this.getAllProducts()
      .filter((p) => !p.sold)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  getSoldProducts(): Product[] {
    return this.getAllProducts()
      .filter((p) => p.sold)
      .sort((a, b) => {
        if (!a.saleDate || !b.saleDate) return 0;
        return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
      });
  },

  async addProduct(data: Omit<Product, "id" | "order" | "sold" | "expenses" | "createdAt">): Promise<Product> {
    const list = this.getAllProducts();
    const maxOrder = list.length > 0 ? Math.max(...list.map((p) => p.order)) : -1;

    const product: Product = {
      id: genId(),
      name: data.name,
      brand: data.brand,
      category: data.category,
      images: data.images || [],
      specs: data.specs || "",
      description: data.description || "",
      price: data.price,
      costPrice: data.price,
      discountPrice: undefined,
      passOnCashDiscount: false,
      order: maxOrder + 1,
      sold: false,
      salePrice: undefined,
      paymentBreakdown: undefined,
      taxAmount: undefined,
      saleDate: undefined,
      buyerName: undefined,
      buyerCpf: undefined,
      invoiceUrl: undefined,
      soldOnCredit: false,
      receivableId: undefined,
      warranty: undefined,
      warrantyExpiresAt: undefined,
      expenses: [],
      createdAt: new Date().toISOString(),
    };

    productsCache = [...productsCache, product];
    saveProductsCache();

    // Persistir de forma síncrona com tratamento de erro
    const { error } = await supabase.from("products").upsert({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      images: product.images,
      specifications: product.specs,
      description: product.description,
      base_price: product.price,
      product_order: product.order,
      sold: false,
      expenses: [],
      created_at: product.createdAt,
    } as any);

    if (error) {
      console.error("Falha ao persistir produto:", error);
      // Remover do cache em caso de erro
      productsCache = productsCache.filter((p) => p.id !== product.id);
      throw new Error(`Erro ao salvar produto: ${error.message}`);
    }

    await this.refreshFromBackend();
    return product;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const list = this.getAllProducts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Produto não encontrado");

    const updated: Product = { ...list[idx], ...data };
    productsCache = list.map((p) => (p.id === id ? updated : p));
    saveProductsCache();

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.specs !== undefined) updateData.specifications = data.specs;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.base_price = data.price;
    if (data.order !== undefined) updateData.product_order = data.order;
    if (data.sold !== undefined) updateData.sold = data.sold;
    if (data.salePrice !== undefined) updateData.sale_price = data.salePrice;
    if (data.paymentBreakdown !== undefined) updateData.payment_breakdown = data.paymentBreakdown;
    if (data.taxAmount !== undefined) updateData.digital_tax = data.taxAmount;
    if (data.saleDate !== undefined) updateData.sold_date = data.saleDate;
    if (data.buyerName !== undefined) updateData.customer_name = data.buyerName;
    if (data.warranty !== undefined) updateData.warranty_months = data.warranty;
    if (data.expenses !== undefined) updateData.expenses = data.expenses;

    const { error } = await supabase.from("products").update(updateData).eq("id", id);
    
    if (error) {
      console.error("Falha ao atualizar produto:", error);
      // Reverter no cache em caso de erro
      productsCache = list;
      throw new Error(`Erro ao atualizar produto: ${error.message}`);
    }

    await this.refreshFromBackend();
    return updated;
  },

  async deleteProduct(id: string): Promise<void> {
    const list = this.getAllProducts();
    const backup = [...productsCache];
    productsCache = list.filter((p) => p.id !== id);
    saveProductsCache();

    const { error } = await supabase.from("products").delete().eq("id", id);
    
    if (error) {
      console.error("Falha ao deletar produto:", error);
      // Reverter no cache em caso de erro
      productsCache = backup;
      throw new Error(`Erro ao deletar produto: ${error.message}`);
    }

    await this.refreshFromBackend();
  },

  reorderProducts(reorderedList: Product[]): void {
    // Atualiza ordem localmente
    productsCache = reorderedList.map((p, i) => ({ ...p, order: i }));
    saveProductsCache();

    // Persistir em background
    (async () => {
      try {
        await Promise.all(
          productsCache.map((p, i) =>
            supabase.from("products").update({ product_order: i }).eq("id", p.id)
          )
        );
        await this.refreshFromBackend();
      } catch (e) {
        console.error("Falha ao reordenar produtos:", e);
      }
    })();
  },

  markAsSold(
    id: string,
    buyerName: string,
    buyerCpf: string,
    cash: number,
    pix: number,
    card: number,
    warranty?: number,
    warrantyExpiresAt?: string
  ): Product {
    const list = this.getAllProducts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Produto não encontrado");

    const salePrice = cash + pix + card;
    const defaultTaxRate = 3.9; // fallback
    const taxableAmount = pix + card; // fallback não inclui dinheiro
    const taxAmount = taxableAmount * (defaultTaxRate / 100);

    const updated: Product = {
      ...list[idx],
      sold: true,
      salePrice,
      paymentBreakdown: { cash, pix, card },
      taxAmount,
      saleDate: new Date().toISOString(),
      buyerName: buyerName.trim(),
      warranty,
    };

    productsCache = list.map((p) => (p.id === id ? updated : p));
    saveProductsCache();

    (async () => {
      try {
        const { data: settings } = await supabase.from("settings").select("*").single();
        const includeCash = settings?.include_cash_in_tax;
        const rate = settings?.digital_tax_rate ?? defaultTaxRate;
        const taxable = includeCash ? salePrice : pix + card;
        const preciseTax = taxable * (Number(rate) / 100);

        await supabase
          .from("products")
          .update({
            sold: true,
            sale_price: salePrice,
            payment_breakdown: { cash, pix, card },
            digital_tax: preciseTax,
            sold_date: new Date().toISOString(),
            customer_name: buyerName.trim(),
            warranty_months: warranty,
          })
          .eq("id", id);

        await this.refreshFromBackend();
      } catch (e) {
        console.error("Falha ao marcar como vendido:", e);
      }
    })();

    return updated;
  },

  addExpense(
    productId: string,
    label: string,
    value: number,
    paymentMethod: "cash" | "pix" | "card",
    description?: string,
    sellerCpf?: string
  ): Product {
    const list = this.getAllProducts();
    const product = list.find((p) => p.id === productId);
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

    const updated: Product = { ...product, expenses: [...product.expenses, newExpense] };
    productsCache = list.map((p) => (p.id === productId ? updated : p));
    saveProductsCache();

    (async () => {
      try {
        await supabase.from("products").update({ expenses: updated.expenses as any }).eq("id", productId);
        await this.refreshFromBackend();
      } catch (e) {
        console.error("Falha ao adicionar gasto:", e);
      }
    })();

    return updated;
  },

  updateExpense(
    productId: string,
    expenseId: string,
    updates: Partial<Omit<ProductExpense, "id" | "createdAt">>
  ): Product {
    const list = this.getAllProducts();
    const product = list.find((p) => p.id === productId);
    if (!product) throw new Error("Produto não encontrado");

    const updatedExpenses = product.expenses.map((e) =>
      e.id === expenseId ? { ...e, ...updates } : e
    );

    const updated: Product = { ...product, expenses: updatedExpenses };
    productsCache = list.map((p) => (p.id === productId ? updated : p));
    saveProductsCache();

    (async () => {
      try {
        await supabase.from("products").update({ expenses: updatedExpenses as any }).eq("id", productId);
        await this.refreshFromBackend();
      } catch (e) {
        console.error("Falha ao atualizar gasto:", e);
      }
    })();

    return updated;
  },

  removeExpense(productId: string, expenseId: string): Product {
    const list = this.getAllProducts();
    const product = list.find((p) => p.id === productId);
    if (!product) throw new Error("Produto não encontrado");

    const updatedExpenses = product.expenses.filter((e) => e.id !== expenseId);
    const updated: Product = { ...product, expenses: updatedExpenses };

    productsCache = list.map((p) => (p.id === productId ? updated : p));
    saveProductsCache();

    (async () => {
      try {
        await supabase.from("products").update({ expenses: updatedExpenses as any }).eq("id", productId);
        await this.refreshFromBackend();
      } catch (e) {
        console.error("Falha ao remover gasto:", e);
      }
    })();

    return updated;
  },

  updateSale(
    productId: string,
    buyerName: string,
    salePrice: number,
    saleDate: string,
    invoiceUrl?: string
  ): Product {
    const list = this.getAllProducts();
    const idx = list.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error("Produto não encontrado");

    const updated: Product = { ...list[idx], buyerName: buyerName.trim(), salePrice, saleDate };
    productsCache = list.map((p) => (p.id === productId ? updated : p));
    saveProductsCache();

    (async () => {
      try {
        await supabase
          .from("products")
          .update({ customer_name: buyerName.trim(), sale_price: salePrice, sold_date: saleDate })
          .eq("id", productId);
        await this.refreshFromBackend();
      } catch (e) {
        console.error("Falha ao atualizar venda:", e);
      }
    })();

    return updated;
  },

  cancelSale(id: string): Product {
    const list = this.getAllProducts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Produto não encontrado");

    const updated: Product = {
      ...list[idx],
      sold: false,
      salePrice: undefined,
      paymentBreakdown: undefined,
      taxAmount: 0,
      saleDate: undefined,
      buyerName: undefined,
    };

    productsCache = list.map((p) => (p.id === id ? updated : p));
    saveProductsCache();

    (async () => {
      try {
        await supabase
          .from("products")
          .update({
            sold: false,
            sale_price: null,
            payment_breakdown: null,
            digital_tax: 0,
            sold_date: null,
            customer_name: null,
          })
          .eq("id", id);
        await this.refreshFromBackend();
      } catch (e) {
        console.error("Falha ao cancelar venda:", e);
      }
    })();

    return updated;
  },

  markAsSoldOnCredit(
    id: string,
    buyerName: string,
    buyerCpf: string,
    totalAmount: number,
    receivableId: string,
    warranty?: number,
    warrantyExpiresAt?: string
  ): Product {
    const list = this.getAllProducts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Produto não encontrado");

    const updated: Product = {
      ...list[idx],
      sold: true,
      buyerName: buyerName.trim(),
      salePrice: totalAmount,
      saleDate: new Date().toISOString(),
      warranty,
      receivableId,
    };

    productsCache = list.map((p) => (p.id === id ? updated : p));
    saveProductsCache();

    (async () => {
      try {
        await supabase
          .from("products")
          .update({
            sold: true,
            customer_name: buyerName.trim(),
            sale_price: totalAmount,
            sold_date: new Date().toISOString(),
            warranty_months: warranty,
          })
          .eq("id", id);
        await this.refreshFromBackend();
      } catch (e) {
        console.error("Falha ao marcar como vendido (crédito):", e);
      }
    })();

    return updated;
  },

  computeTotals() {
    const soldProducts = this.getSoldProducts();

    const totalGross = soldProducts.reduce((sum, p) => sum + (p.salePrice || 0), 0);
    const totalCash = soldProducts.reduce((sum, p) => sum + (p.paymentBreakdown?.cash || 0), 0);
    const totalPix = soldProducts.reduce((sum, p) => sum + (p.paymentBreakdown?.pix || 0), 0);
    const totalCard = soldProducts.reduce((sum, p) => sum + (p.paymentBreakdown?.card || 0), 0);
    const totalDigital = totalPix + totalCard;
    const totalTax = soldProducts.reduce((sum, p) => sum + (p.taxAmount || 0), 0);
    const totalExpenses = soldProducts.reduce(
      (sum, p) => sum + p.expenses.reduce((expSum, e) => expSum + e.value, 0),
      0
    );
    const netProfit = totalGross - totalExpenses;
    const averageMargin = totalGross > 0 ? (netProfit / totalGross) * 100 : 0;

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
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const soldProducts = this.getSoldProducts();
    const monthProducts = soldProducts.filter((p) => {
      if (!p.saleDate) return false;
      const saleDate = new Date(p.saleDate);
      return saleDate >= currentMonthStart && saleDate < nextMonthStart;
    });

    const totalGross = monthProducts.reduce((sum, p) => sum + (p.salePrice || 0), 0);
    const totalCash = monthProducts.reduce((sum, p) => sum + (p.paymentBreakdown?.cash || 0), 0);
    const totalPix = monthProducts.reduce((sum, p) => sum + (p.paymentBreakdown?.pix || 0), 0);
    const totalCard = monthProducts.reduce((sum, p) => sum + (p.paymentBreakdown?.card || 0), 0);
    const totalDigital = totalPix + totalCard;
    const totalTax = monthProducts.reduce((sum, p) => sum + (p.taxAmount || 0), 0);
    const totalExpenses = monthProducts.reduce(
      (sum, p) => sum + p.expenses.reduce((expSum, e) => expSum + e.value, 0),
      0
    );
    const netProfit = totalGross - totalExpenses;
    const averageMargin = totalGross > 0 ? (netProfit / totalGross) * 100 : 0;

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
      soldCount: monthProducts.length,
    };
  },
};
