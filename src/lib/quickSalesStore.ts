import { format } from "date-fns";
import { receivablesStore } from "./receivablesStore";

export interface QuickSale {
  id: string;
  productName: string;
  costPrice: number;
  salePrice: number;
  profit: number;
  
  // Apenas vendas À VISTA
  paymentMethod: "cash" | "pix" | "card";
  taxAmount: number;
  
  notes?: string;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "quick_sales_data";

export const quickSalesStore = {
  getAllQuickSales(): QuickSale[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  },

  getQuickSalesByMonth(monthString: string): QuickSale[] {
    const sales = this.getAllQuickSales();
    return sales.filter(s => s.saleDate.startsWith(monthString));
  },

  getQuickSaleById(id: string): QuickSale | undefined {
    return this.getAllQuickSales().find(s => s.id === id);
  },

  addQuickSale(
    data: Omit<QuickSale, "id" | "profit" | "createdAt" | "updatedAt">
  ): QuickSale {
    const sales = this.getAllQuickSales();
    const now = new Date().toISOString();

    // Calcula lucro
    const taxAmount = data.taxAmount || 0;
    const profit = data.salePrice - data.costPrice - taxAmount;

    const newSale: QuickSale = {
      ...data,
      id: `qs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      profit,
      createdAt: now,
      updatedAt: now,
    };

    sales.push(newSale);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
    return newSale;
  },

  updateQuickSale(
    id: string,
    data: Partial<Omit<QuickSale, "id" | "createdAt">>
  ): QuickSale {
    const sales = this.getAllQuickSales();
    const index = sales.findIndex(s => s.id === id);

    if (index === -1) {
      throw new Error("Venda rápida não encontrada");
    }

    sales[index] = {
      ...sales[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
    return sales[index];
  },

  deleteQuickSale(id: string): void {
    const sales = this.getAllQuickSales();
    const filtered = sales.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
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

    sales.forEach(sale => {
      totalSales += sale.salePrice;
      totalCost += sale.costPrice;
      totalProfit += sale.profit;
      totalTax += sale.taxAmount;

      if (sale.paymentMethod === "cash") totalCash += sale.salePrice;
      if (sale.paymentMethod === "pix") totalPix += sale.salePrice;
      if (sale.paymentMethod === "card") totalCard += sale.salePrice;
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