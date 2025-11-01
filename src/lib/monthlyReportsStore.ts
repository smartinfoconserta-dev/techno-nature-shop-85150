import { format, startOfMonth, endOfMonth } from "date-fns";
import { productsStore } from "./productsStore";
import { quickSalesStore } from "./quickSalesStore";

export interface MonthlyReport {
  month: string; // "2025-11" (YYYY-MM)
  monthName: string; // "Novembro 2025"
  totalSales: number; // soma de todas as vendas
  totalPurchases: number; // soma de todos os gastos
  netProfit: number; // vendas - compras
  totalTax: number; // impostos pagos
  soldCount: number; // quantidade vendida
  averageMargin: number; // margem média
  generatedAt: string; // quando foi gerado
}

const STORAGE_KEY = "monthly_reports_data";
const LAST_CHECK_KEY = "last_month_check";

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const monthlyReportsStore = {
  getAllReports(): MonthlyReport[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  },

  getReportByMonth(monthString: string): MonthlyReport | null {
    const reports = this.getAllReports();
    return reports.find(r => r.month === monthString) || null;
  },

  saveReport(report: MonthlyReport): void {
    const reports = this.getAllReports();
    const existingIndex = reports.findIndex(r => r.month === report.month);
    
    if (existingIndex >= 0) {
      reports[existingIndex] = report;
    } else {
      reports.push(report);
    }
    
    // Ordena por mês (mais recente primeiro)
    reports.sort((a, b) => b.month.localeCompare(a.month));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  },

  generateReportForMonth(monthString: string): MonthlyReport {
    const [year, month] = monthString.split("-").map(Number);
    const monthDate = new Date(year, month - 1, 1);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    // Filtra produtos vendidos no mês específico
    const soldProducts = productsStore.getSoldProducts().filter(p => {
      if (!p.saleDate) return false;
      const saleDate = new Date(p.saleDate);
      return saleDate >= monthStart && saleDate <= monthEnd;
    });

    // Calcula totais
    let totalGross = 0;
    let totalCash = 0;
    let totalPix = 0;
    let totalCard = 0;
    let totalDigital = 0;
    let totalExpenses = 0;
    let totalMargins = 0;

    soldProducts.forEach((p) => {
      const salePrice = p.salePrice || p.price;
      const expenses = p.expenses?.reduce((sum, e) => sum + e.value, 0) || 0;
      
      totalGross += salePrice;
      totalExpenses += expenses;
      
      if (p.paymentBreakdown) {
        totalCash += p.paymentBreakdown.cash || 0;
        totalPix += p.paymentBreakdown.pix || 0;
        totalCard += p.paymentBreakdown.card || 0;
      }

      const margin = salePrice > 0 ? ((salePrice - expenses) / salePrice) * 100 : 0;
      totalMargins += margin;
    });

    // Adiciona vendas rápidas
    const quickSales = quickSalesStore.getQuickSalesByMonth(monthString);
    quickSales.forEach((qs) => {
      totalGross += qs.salePrice;
      totalExpenses += qs.costPrice;
      
      // Todas as vendas rápidas agora são à vista
      if (qs.paymentMethod === "cash") totalCash += qs.salePrice;
      if (qs.paymentMethod === "pix") totalPix += qs.salePrice;
      if (qs.paymentMethod === "card") totalCard += qs.salePrice;

      const margin = qs.salePrice > 0 ? ((qs.salePrice - qs.costPrice) / qs.salePrice) * 100 : 0;
      totalMargins += margin;
    });

    totalDigital = totalPix + totalCard;
    const totalTax = totalDigital * 0.06;
    const netProfit = totalGross - totalExpenses - totalTax;
    const totalCount = soldProducts.length + quickSales.length;
    const averageMargin = totalCount > 0 ? totalMargins / totalCount : 0;

    const monthNameStr = `${monthNames[month - 1]} ${year}`;

    const report: MonthlyReport = {
      month: monthString,
      monthName: monthNameStr,
      totalSales: totalGross,
      totalPurchases: totalExpenses,
      netProfit,
      totalTax,
      soldCount: totalCount,
      averageMargin,
      generatedAt: new Date().toISOString(),
    };

    this.saveReport(report);
    return report;
  },

  getCurrentMonthData(): MonthlyReport {
    const now = new Date();
    const currentMonth = format(now, "yyyy-MM");
    const [year, month] = currentMonth.split("-").map(Number);
    
    // Calcula dados do mês atual em tempo real
    const monthStart = startOfMonth(now);
    const soldProducts = productsStore.getSoldProducts().filter(p => {
      if (!p.saleDate) return false;
      const saleDate = new Date(p.saleDate);
      return saleDate >= monthStart;
    });

    let totalGross = 0;
    let totalCash = 0;
    let totalPix = 0;
    let totalCard = 0;
    let totalDigital = 0;
    let totalExpenses = 0;
    let totalMargins = 0;

    soldProducts.forEach((p) => {
      const salePrice = p.salePrice || p.price;
      const expenses = p.expenses?.reduce((sum, e) => sum + e.value, 0) || 0;
      
      totalGross += salePrice;
      totalExpenses += expenses;
      
      if (p.paymentBreakdown) {
        totalCash += p.paymentBreakdown.cash || 0;
        totalPix += p.paymentBreakdown.pix || 0;
        totalCard += p.paymentBreakdown.card || 0;
      }

      const margin = salePrice > 0 ? ((salePrice - expenses) / salePrice) * 100 : 0;
      totalMargins += margin;
    });

    // Adiciona vendas rápidas do mês atual
    const currentMonthStr = format(now, "yyyy-MM");
    const quickSales = quickSalesStore.getQuickSalesByMonth(currentMonthStr);
    quickSales.forEach((qs) => {
      totalGross += qs.salePrice;
      totalExpenses += qs.costPrice;
      
      // Todas as vendas rápidas agora são à vista
      if (qs.paymentMethod === "cash") totalCash += qs.salePrice;
      if (qs.paymentMethod === "pix") totalPix += qs.salePrice;
      if (qs.paymentMethod === "card") totalCard += qs.salePrice;

      const margin = qs.salePrice > 0 ? ((qs.salePrice - qs.costPrice) / qs.salePrice) * 100 : 0;
      totalMargins += margin;
    });

    totalDigital = totalPix + totalCard;
    const totalTax = totalDigital * 0.06;
    const netProfit = totalGross - totalExpenses - totalTax;
    const totalCount = soldProducts.length + quickSales.length;
    const averageMargin = totalCount > 0 ? totalMargins / totalCount : 0;

    const monthNameStr = `${monthNames[month - 1]} ${year}`;

    return {
      month: currentMonth,
      monthName: monthNameStr,
      totalSales: totalGross,
      totalPurchases: totalExpenses,
      netProfit,
      totalTax,
      soldCount: totalCount,
      averageMargin,
      generatedAt: new Date().toISOString(),
    };
  },

  checkAndGeneratePreviousMonth(): void {
    const now = new Date();
    const currentMonth = format(now, "yyyy-MM");
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);

    // Se já checou este mês, não faz nada
    if (lastCheck === currentMonth) {
      return;
    }

    // Calcula mês anterior
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = format(previousMonthDate, "yyyy-MM");

    // Verifica se já existe relatório do mês anterior
    const existingReport = this.getReportByMonth(previousMonth);
    
    if (!existingReport) {
      // Gera relatório do mês anterior
      this.generateReportForMonth(previousMonth);
    }

    // Atualiza última verificação
    localStorage.setItem(LAST_CHECK_KEY, currentMonth);
  },

  getAvailableMonths(): string[] {
    const currentMonth = format(new Date(), "yyyy-MM");
    const reports = this.getAllReports();
    
    const months = [currentMonth, ...reports.map(r => r.month)];
    const uniqueMonths = [...new Set(months)].sort((a, b) => b.localeCompare(a));
    
    return uniqueMonths;
  },
};
