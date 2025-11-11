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

export const quickSalesStore = {
  async getAllQuickSales(): Promise<QuickSale[]> {
    const { data, error } = await supabase
      .from("quick_sales")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
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
  },

  async getQuickSalesByMonth(monthString: string): Promise<QuickSale[]> {
    const sales = await this.getAllQuickSales();
    return sales.filter(s => s.saleDate.startsWith(monthString));
  },

  async getQuickSaleById(id: string): Promise<QuickSale | undefined> {
    const sales = await this.getAllQuickSales();
    return sales.find(s => s.id === id);
  },

  async addQuickSale(
    data: Omit<QuickSale, "id" | "profit" | "createdAt" | "updatedAt">
  ): Promise<QuickSale> {
    const taxAmount = data.taxAmount ?? 0;
    const profit = data.salePrice - data.costPrice - taxAmount;

    const { data: newSale, error } = await supabase
      .from("quick_sales")
      .insert({
        product_name: data.productName,
        cost_price: data.costPrice,
        sale_price: data.salePrice,
        profit,
        margin: data.salePrice > 0 ? (profit / data.salePrice) * 100 : 0,
        customer_name: data.customerName || "",
        payment_breakdown: data.paymentBreakdown || null,
        payment_method: data.paymentMethod || "cash",
        digital_tax: taxAmount,
        warranty_months: data.warranty || 3,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: newSale.id,
      productName: newSale.product_name,
      costPrice: Number(newSale.cost_price),
      salePrice: Number(newSale.sale_price),
      profit: Number(newSale.profit),
      customerName: newSale.customer_name || undefined,
      paymentBreakdown: newSale.payment_breakdown as any,
      paymentMethod: newSale.payment_method as any,
      taxAmount: Number(newSale.digital_tax || 0),
      warranty: newSale.warranty_months || undefined,
      notes: newSale.notes || undefined,
      saleDate: newSale.created_at,
      createdAt: newSale.created_at,
      updatedAt: newSale.updated_at || newSale.created_at,
    };
  },

  async updateQuickSale(
    id: string,
    data: Partial<Omit<QuickSale, "id" | "createdAt">>
  ): Promise<QuickSale> {
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

    if (data.costPrice !== undefined || data.salePrice !== undefined || data.taxAmount !== undefined) {
      const sales = await this.getAllQuickSales();
      const sale = sales.find(s => s.id === id);
      if (sale) {
        const costPrice = data.costPrice ?? sale.costPrice;
        const salePrice = data.salePrice ?? sale.salePrice;
        const taxAmount = data.taxAmount ?? sale.taxAmount;
        updateData.profit = salePrice - costPrice - taxAmount;
        updateData.margin = salePrice > 0 ? (updateData.profit / salePrice) * 100 : 0;
      }
    }

    const { error } = await supabase
      .from("quick_sales")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    const sales = await this.getAllQuickSales();
    const sale = sales.find(s => s.id === id);
    if (!sale) throw new Error("Venda rápida não encontrada");

    return sale;
  },

  async deleteQuickSale(id: string): Promise<void> {
    const { error } = await supabase
      .from("quick_sales")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getMonthlyTotals(monthString: string) {
    const sales = await this.getQuickSalesByMonth(monthString);
    
    let totalSales = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalTax = 0;
    let totalCash = 0;
    let totalPix = 0;
    let totalCard = 0;

    sales.forEach(sale => {
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
