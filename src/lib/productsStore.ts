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

export const productsStore = {
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("product_order", { ascending: true });

    if (error) throw error;
    
    return (data || []).map(row => ({
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
      expenses: (row.expenses as any[] || []).map((exp: any) => ({
        id: exp.id || String(Date.now()),
        label: exp.label || "",
        value: Number(exp.value || 0),
        description: exp.description,
        paymentMethod: exp.paymentMethod,
        sellerCpf: exp.sellerCpf,
        createdAt: exp.createdAt || new Date().toISOString(),
      })),
      createdAt: row.created_at || new Date().toISOString(),
    }));
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const products = await this.getAllProducts();
    return products
      .filter((p) => p.category === category && !p.sold)
      .sort((a, b) => a.order - b.order);
  },

  async getAvailableProducts(): Promise<Product[]> {
    const products = await this.getAllProducts();
    return products
      .filter((p) => !p.sold)
      .sort((a, b) => a.order - b.order);
  },

  async getSoldProducts(): Promise<Product[]> {
    const products = await this.getAllProducts();
    return products
      .filter((p) => p.sold)
      .sort((a, b) => {
        if (!a.saleDate || !b.saleDate) return 0;
        return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
      });
  },

  async addProduct(data: Omit<Product, "id" | "order" | "sold" | "expenses" | "createdAt">): Promise<Product> {
    const products = await this.getAllProducts();
    const maxOrder = products.length > 0 ? Math.max(...products.map((p) => p.order)) : -1;

    const { data: newProduct, error } = await supabase
      .from("products")
      .insert({
        name: data.name,
        brand: data.brand,
        category: data.category,
        images: data.images,
        specifications: data.specs,
        description: data.description,
        base_price: data.price,
        product_order: maxOrder + 1,
        sold: false,
        expenses: [],
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: newProduct.id,
      name: newProduct.name,
      brand: newProduct.brand,
      category: newProduct.category,
      images: newProduct.images || [],
      specs: newProduct.specifications || "",
      description: newProduct.description || "",
      price: Number(newProduct.base_price),
      order: newProduct.product_order || 0,
      sold: false,
      expenses: [],
      createdAt: newProduct.created_at,
    };
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
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

    const { data: updated, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const products = await this.getAllProducts();
    const product = products.find(p => p.id === id);
    if (!product) throw new Error("Produto não encontrado");
    
    return product;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async reorderProducts(reorderedList: Product[]): Promise<void> {
    for (let i = 0; i < reorderedList.length; i++) {
      await supabase
        .from("products")
        .update({ product_order: i })
        .eq("id", reorderedList[i].id);
    }
  },

  async markAsSold(
    id: string,
    buyerName: string,
    buyerCpf: string,
    cash: number,
    pix: number,
    card: number,
    warranty?: number,
    warrantyExpiresAt?: string
  ): Promise<Product> {
    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .single();

    const salePrice = cash + pix + card;
    const digitalAmount = pix + card;

    const taxableAmount = settings?.include_cash_in_tax ? salePrice : digitalAmount;
    const taxAmount = taxableAmount * ((settings?.digital_tax_rate || 3.9) / 100);

    const { error } = await supabase
      .from("products")
      .update({
        sold: true,
        sale_price: salePrice,
        payment_breakdown: { cash, pix, card },
        digital_tax: taxAmount,
        sold_date: new Date().toISOString(),
        customer_name: buyerName.trim(),
        warranty_months: warranty,
      })
      .eq("id", id);

    if (error) throw error;

    const products = await this.getAllProducts();
    const product = products.find(p => p.id === id);
    if (!product) throw new Error("Produto não encontrado");
    
    return product;
  },

  async addExpense(
    productId: string,
    label: string,
    value: number,
    paymentMethod: "cash" | "pix" | "card",
    description?: string,
    sellerCpf?: string
  ): Promise<Product> {
    const products = await this.getAllProducts();
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

    const updatedExpenses = [...product.expenses, newExpense];

    const { error } = await supabase
      .from("products")
      .update({ expenses: updatedExpenses })
      .eq("id", productId);

    if (error) throw error;

    return { ...product, expenses: updatedExpenses };
  },

  async updateExpense(
    productId: string,
    expenseId: string,
    updates: Partial<Omit<ProductExpense, "id" | "createdAt">>
  ): Promise<Product> {
    const products = await this.getAllProducts();
    const product = products.find((p) => p.id === productId);

    if (!product) throw new Error("Produto não encontrado");

    const expense = product.expenses.find((e) => e.id === expenseId);
    if (!expense) throw new Error("Gasto não encontrado");

    Object.assign(expense, updates);

    const { error } = await supabase
      .from("products")
      .update({ expenses: product.expenses })
      .eq("id", productId);

    if (error) throw error;

    return product;
  },

  async removeExpense(productId: string, expenseId: string): Promise<Product> {
    const products = await this.getAllProducts();
    const product = products.find((p) => p.id === productId);

    if (!product) throw new Error("Produto não encontrado");

    const updatedExpenses = product.expenses.filter((e) => e.id !== expenseId);

    const { error } = await supabase
      .from("products")
      .update({ expenses: updatedExpenses })
      .eq("id", productId);

    if (error) throw error;

    return { ...product, expenses: updatedExpenses };
  },

  async updateSale(
    productId: string,
    buyerName: string,
    salePrice: number,
    saleDate: string,
    invoiceUrl?: string
  ): Promise<Product> {
    const { error } = await supabase
      .from("products")
      .update({
        customer_name: buyerName.trim(),
        sale_price: salePrice,
        sold_date: saleDate,
      })
      .eq("id", productId);

    if (error) throw error;

    const products = await this.getAllProducts();
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error("Produto não encontrado");
    
    return product;
  },

  async cancelSale(id: string): Promise<Product> {
    const { error } = await supabase
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

    if (error) throw error;

    const products = await this.getAllProducts();
    const product = products.find(p => p.id === id);
    if (!product) throw new Error("Produto não encontrado");
    
    return product;
  },

  async markAsSoldOnCredit(
    id: string,
    buyerName: string,
    buyerCpf: string,
    totalAmount: number,
    receivableId: string,
    warranty?: number,
    warrantyExpiresAt?: string
  ): Promise<Product> {
    const { error } = await supabase
      .from("products")
      .update({
        sold: true,
        customer_name: buyerName.trim(),
        sale_price: totalAmount,
        sold_date: new Date().toISOString(),
        warranty_months: warranty,
      })
      .eq("id", id);

    if (error) throw error;

    const products = await this.getAllProducts();
    const product = products.find(p => p.id === id);
    if (!product) throw new Error("Produto não encontrado");
    
    return product;
  },

  async computeTotals() {
    const soldProducts = await this.getSoldProducts();

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

  async computeCurrentMonthTotals() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const soldProducts = await this.getSoldProducts();
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
