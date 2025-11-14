import { supabase } from "@/integrations/supabase/client";

export interface QuickSale {
  id: string;
  productName: string;
  costPrice: number;
  salePrice: number;
  profit: number;
  
  customerName?: string;
  customerCpf?: string;
  
  paymentBreakdown?: { cash: number; pix: number; card: number };
  paymentMethod?: "cash" | "pix" | "card";
  taxAmount: number;
  
  warranty?: number;
  warrantyExpiresAt?: string;
  
  notes?: string;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
}

// Sync cache with background refresh
const QUICK_SALES_STORAGE_KEY = "quick_sales_data";
let quickSalesCache: QuickSale[] = [];
let quickInitialized = false;

const genIdQS = () => (typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

function loadQuickCache() {
  // Cache apenas em memória - não lê localStorage
  if (quickInitialized) return;
  quickSalesCache = [];
  quickInitialized = true;
}

function saveQuickCache() {
  // No-op: cache apenas em memória - não salva em localStorage
}

export const quickSalesStore = {
  async refreshFromBackend(): Promise<void> {
    const { data, error } = await supabase
      .from("quick_sales")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Erro ao carregar vendas rápidas:", error);
      return;
    }
    quickSalesCache = (data || []).map((row) => ({
      id: row.id,
      productName: row.product_name,
      costPrice: Number(row.cost_price),
      salePrice: Number(row.sale_price),
      profit: Number(row.profit),
      customerName: row.customer_name || undefined,
      customerCpf: undefined,
      paymentBreakdown: row.payment_breakdown as { cash: number; pix: number; card: number } | undefined,
      paymentMethod: row.payment_method as "cash" | "pix" | "card" | undefined,
      taxAmount: Number(row.digital_tax || 0),
      warranty: row.warranty_months || undefined,
      warrantyExpiresAt: undefined,
      notes: row.notes || undefined,
      saleDate: row.created_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }));
    saveQuickCache();
  },

  getAllQuickSales(): QuickSale[] {
    loadQuickCache();
    if (!quickSalesCache.length) this.refreshFromBackend();
    return [...quickSalesCache];
  },

  getQuickSalesByMonth(monthString: string): QuickSale[] {
    return this.getAllQuickSales().filter((s) => s.saleDate.startsWith(monthString));
  },

  getQuickSaleById(id: string): QuickSale | undefined {
    return this.getAllQuickSales().find((s) => s.id === id);
  },

  async addQuickSale(data: Omit<QuickSale, "id" | "profit" | "createdAt" | "updatedAt">): Promise<QuickSale> {
    const taxAmount = data.taxAmount ?? 0;
    const profit = data.salePrice - data.costPrice - taxAmount;

    const newSale: QuickSale = {
      id: genIdQS(),
      productName: data.productName,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      profit,
      customerName: data.customerName,
      customerCpf: data.customerCpf,
      paymentBreakdown: data.paymentBreakdown,
      paymentMethod: data.paymentMethod,
      taxAmount,
      warranty: data.warranty,
      warrantyExpiresAt: data.warrantyExpiresAt,
      notes: data.notes,
      saleDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Garantir defaults para campos NOT NULL
    const paymentBreakdown = newSale.paymentBreakdown || { cash: 0, pix: 0, card: 0 };
    const paymentMethod = newSale.paymentMethod || "cash";
    const customerName = newSale.customerName || "";

    const { error } = await supabase
      .from("quick_sales")
      .upsert({
        id: newSale.id,
        product_name: newSale.productName,
        cost_price: newSale.costPrice,
        sale_price: newSale.salePrice,
        profit: newSale.profit,
        margin: newSale.salePrice > 0 ? (newSale.profit / newSale.salePrice) * 100 : 0,
        customer_name: customerName,
        payment_breakdown: paymentBreakdown,
        payment_method: paymentMethod,
        digital_tax: newSale.taxAmount || 0,
        warranty_months: newSale.warranty || 3,
        notes: newSale.notes || null,
        created_at: newSale.createdAt,
        updated_at: newSale.updatedAt,
      } as any);

    if (error) {
      console.error("Erro ao persistir venda rápida:", error);
      throw new Error(error.message || "Erro ao salvar venda rápida");
    }

    quickSalesCache = [newSale, ...quickSalesCache];
    saveQuickCache();
    await this.refreshFromBackend();

    return newSale;
  },

  async updateQuickSale(id: string, data: Partial<Omit<QuickSale, "id" | "createdAt">>): Promise<QuickSale> {
    const list = this.getAllQuickSales();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Venda rápida não encontrada");

    const base = list[idx];
    const costPrice = data.costPrice ?? base.costPrice;
    const salePrice = data.salePrice ?? base.salePrice;
    const taxAmount = data.taxAmount ?? base.taxAmount;
    const profit = salePrice - costPrice - (taxAmount || 0);

    const updated: QuickSale = {
      ...base,
      ...data,
      profit,
      updatedAt: new Date().toISOString(),
    } as QuickSale;

    const updateData: any = {};
    if (data.productName !== undefined) updateData.product_name = data.productName;
    if (data.customerName !== undefined) updateData.customer_name = data.customerName;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.costPrice !== undefined) updateData.cost_price = data.costPrice;
    if (data.salePrice !== undefined) updateData.sale_price = data.salePrice;
    if (data.paymentBreakdown !== undefined) updateData.payment_breakdown = data.paymentBreakdown;
    if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod;
    if (data.taxAmount !== undefined) updateData.digital_tax = data.taxAmount;
    if (data.warranty !== undefined) updateData.warranty_months = data.warranty;
    updateData.profit = profit;
    updateData.margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

    const { error } = await supabase.from("quick_sales").update(updateData).eq("id", id);

    if (error) {
      console.error("Erro ao atualizar venda rápida:", error);
      throw new Error(error.message || "Erro ao atualizar venda rápida");
    }

    quickSalesCache = list.map((s) => (s.id === id ? updated : s));
    saveQuickCache();
    await this.refreshFromBackend();

    return updated;
  },

  async deleteQuickSale(id: string): Promise<void> {
    // SOFT DELETE
    const { error } = await supabase
      .from("quick_sales")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", id);

    if (error) {
      console.error("Erro ao mover venda rápida para lixeira:", error);
      throw error;
    }

    await this.refreshFromBackend();
  },

  async restoreQuickSale(id: string): Promise<void> {
    const { error } = await supabase
      .from("quick_sales")
      .update({ deleted_at: null } as any)
      .eq("id", id);

    if (error) {
      console.error("Erro ao restaurar venda rápida:", error);
      throw error;
    }

    await this.refreshFromBackend();
  },

  async permanentlyDeleteQuickSale(id: string): Promise<void> {
    const { error} = await supabase
      .from("quick_sales")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar venda rápida permanentemente:", error);
      throw error;
    }
  },

  async getDeletedQuickSales(): Promise<QuickSale[]> {
    const { data, error } = await supabase
      .from("quick_sales")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar vendas rápidas deletadas:", error);
      return [];
    }

    return data?.map((row: any) => ({
      id: row.id,
      productName: row.product_name,
      brand: row.brand,
      category: row.category,
      customerName: row.customer_name,
      customerId: row.customer_id,
      costPrice: row.cost_price,
      salePrice: row.sale_price,
      profit: row.profit,
      margin: row.margin,
      paymentMethod: row.payment_method,
      installments: row.installments,
      installmentRate: row.installment_rate,
      paymentBreakdown: row.payment_breakdown,
      digitalTax: row.digital_tax,
      taxAmount: row.digital_tax,
      warrantyMonths: row.warranty_months,
      notes: row.notes,
      saleDate: row.created_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) || [];
  },

  getMonthlyTotals(monthString: string) {
    const sales = this.getQuickSalesByMonth(monthString);

    let totalSales = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalTax = 0;
    let totalCash = 0;
    let totalPix = 0;
    let totalCard = 0;

    sales.forEach((sale) => {
      totalSales += sale.salePrice;
      totalCost += sale.costPrice;
      totalProfit += sale.profit;
      totalTax += sale.taxAmount || 0;

      if (sale.paymentBreakdown) {
        totalCash += sale.paymentBreakdown.cash || 0;
        totalPix += sale.paymentBreakdown.pix || 0;
        totalCard += sale.paymentBreakdown.card || 0;
      } else if (sale.paymentMethod) {
        if (sale.paymentMethod === "cash") totalCash += sale.salePrice;
        if (sale.paymentMethod === "pix") totalPix += sale.salePrice;
        if (sale.paymentMethod === "card") totalCard += sale.salePrice;
      }
    });

    return {
      totalSales,
      totalCost,
      totalProfit,
      totalTax,
      totalCash,
      totalPix,
      totalCard,
      count: sales.length,
    };
  },
};
