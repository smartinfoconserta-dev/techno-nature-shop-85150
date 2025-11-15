import { productsStore, Product } from "./productsStore";
import { quickSalesStore, QuickSale } from "./quickSalesStore";
import { receivablesStore, Receivable } from "./receivablesStore";
import { getWarrantyDays } from "./warrantyHelper";

/**
 * Venda unificada - fonte única de verdade para relatórios
 * Combina dados de products, quick_sales e receivables
 */
export interface UnifiedSale {
  id: string;
  type: 'product' | 'quick_sale' | 'receivable';
  productName: string;
  customerName: string;
  salePrice: number;
  costPrice?: number;
  profit?: number;
  warranty: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount: number;
  remainingAmount: number;
  saleDate: string;
  source: 'catalog' | 'quick' | 'manual';
  brand?: string;
  category?: string;
  // Referências originais
  originalId: string;
  receivableId?: string;
}

/**
 * Store centralizado para histórico de vendas
 * Remove duplicatas e normaliza dados de múltiplas fontes
 */
export const salesHistoryStore = {
  /**
   * Busca todas as vendas e as unifica em uma única lista
   * Remove duplicatas (prioriza receivables sobre produtos)
   */
  async getUnifiedSales(): Promise<UnifiedSale[]> {
    try {
      // Buscar de todas as 3 fontes
      const [products, quickSales, receivables] = await Promise.all([
        productsStore.getSoldProducts(),
        quickSalesStore.getAllQuickSales(),
        receivablesStore.getAllReceivables(),
      ]);

      // Combinar e remover duplicatas
      return this.mergeSales(products, quickSales, receivables);
    } catch (error) {
      console.error("❌ Erro ao buscar vendas unificadas:", error);
      return [];
    }
  },

  /**
   * Combina vendas de múltiplas fontes e remove duplicatas
   * Regra: Se produto tem receivableId, usar apenas o receivable
   */
  mergeSales(
    products: Product[],
    quickSales: QuickSale[],
    receivables: Receivable[]
  ): UnifiedSale[] {
    const unified: UnifiedSale[] = [];
    const addedProductIds = new Set<string>();

    // 1. Adicionar receivables primeiro (prioridade)
    // Não há deleted_at em Receivable, então não precisa filtrar
    receivables.forEach(r => {
      unified.push(this.receivableToUnified(r));
      if (r.productId) {
        addedProductIds.add(r.productId);
      }
    });

    // 2. Adicionar produtos que NÃO têm receivable (vendas diretas)
    products
      .filter(p => !p.receivableId && !addedProductIds.has(p.id))
      .forEach(p => unified.push(this.productToUnified(p)));

    // 3. Adicionar vendas rápidas
    // Não há deleted_at em QuickSale, então não precisa filtrar
    quickSales.forEach(q => unified.push(this.quickSaleToUnified(q)));

    // Ordenar por data de venda (mais recente primeiro)
    return unified.sort((a, b) =>
      new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
    );
  },

  /**
   * Converte produto para formato unificado
   */
  productToUnified(product: Product): UnifiedSale {
    const warranty = getWarrantyDays({ warranty: product.warranty });
    
    return {
      id: `product_${product.id}`,
      type: 'product',
      productName: product.name,
      customerName: product.buyerName || 'Cliente não informado',
      salePrice: product.salePrice || 0,
      costPrice: product.costPrice,
      profit: product.salePrice && product.costPrice 
        ? product.salePrice - product.costPrice 
        : undefined,
      warranty,
      paymentStatus: product.soldOnCredit ? 'pending' : 'paid',
      paidAmount: product.soldOnCredit ? 0 : (product.salePrice || 0),
      remainingAmount: product.soldOnCredit ? (product.salePrice || 0) : 0,
      saleDate: product.saleDate || product.createdAt,
      source: 'catalog',
      brand: product.brand,
      category: product.category,
      originalId: product.id,
      receivableId: product.receivableId,
    };
  },

  /**
   * Converte venda rápida para formato unificado
   */
  quickSaleToUnified(quickSale: QuickSale): UnifiedSale {
    const warranty = getWarrantyDays({ warranty: quickSale.warranty });
    
    return {
      id: `quick_${quickSale.id}`,
      type: 'quick_sale',
      productName: quickSale.productName,
      customerName: quickSale.customerName || 'Cliente não informado',
      salePrice: quickSale.salePrice,
      costPrice: quickSale.costPrice,
      profit: quickSale.profit,
      warranty,
      paymentStatus: 'paid', // Vendas rápidas são sempre pagas
      paidAmount: quickSale.salePrice,
      remainingAmount: 0,
      saleDate: quickSale.saleDate,
      source: 'quick',
      brand: undefined, // QuickSale não tem brand
      category: undefined, // QuickSale não tem category
      originalId: quickSale.id,
    };
  },

  /**
   * Converte receivable para formato unificado
   */
  receivableToUnified(receivable: Receivable): UnifiedSale {
    const warranty = getWarrantyDays({ warranty: receivable.warranty });
    
    return {
      id: `receivable_${receivable.id}`,
      type: 'receivable',
      productName: receivable.productName,
      customerName: receivable.customerName,
      salePrice: receivable.salePrice,
      costPrice: receivable.costPrice,
      profit: receivable.profit,
      warranty,
      paymentStatus: receivable.status as 'pending' | 'partial' | 'paid',
      paidAmount: receivable.paidAmount,
      remainingAmount: receivable.remainingAmount,
      saleDate: receivable.saleDate || receivable.createdAt,
      source: receivable.productId ? 'catalog' : 'manual',
      brand: receivable.brand,
      category: receivable.category,
      originalId: receivable.id,
      receivableId: receivable.id,
    };
  },

  /**
   * Busca vendas de um mês específico
   */
  async getSalesByMonth(monthString: string): Promise<UnifiedSale[]> {
    const allSales = await this.getUnifiedSales();
    return allSales.filter(sale => {
      const saleMonth = sale.saleDate.substring(0, 7); // "YYYY-MM"
      return saleMonth === monthString;
    });
  },

  /**
   * Calcula totais para um mês específico
   */
  async getMonthlyTotals(monthString: string) {
    const sales = await this.getSalesByMonth(monthString);
    
    const totalSales = sales.reduce((sum, s) => sum + s.salePrice, 0);
    const totalCost = sales.reduce((sum, s) => sum + (s.costPrice || 0), 0);
    const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);
    const totalPaid = sales.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalPending = sales.reduce((sum, s) => sum + s.remainingAmount, 0);
    
    return {
      totalSales,
      totalCost,
      totalProfit,
      totalPaid,
      totalPending,
      soldCount: sales.length,
      averageMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
    };
  },
};
