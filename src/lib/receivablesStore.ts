export interface ReceivablePayment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: "cash" | "pix" | "card";
  notes?: string;
}

export interface Receivable {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  productId: string;
  productName: string;
  costPrice?: number; // Preço de custo
  salePrice?: number; // Preço de venda (= totalAmount)
  profit?: number; // Lucro (salePrice - costPrice)
  totalAmount: number; // Valor total da venda
  paidAmount: number; // Valor já pago
  remainingAmount: number; // Valor restante
  couponCode?: string; // Cupom aplicado
  couponDiscount?: number; // Valor do desconto do cupom (em %)
  dueDate?: string; // Data de vencimento (opcional)
  status: "pending" | "partial" | "paid"; // pending = não pago, partial = pago parcialmente, paid = quitado
  payments: ReceivablePayment[]; // Histórico de pagamentos
  source?: "catalog" | "quick" | "manual"; // Origem da venda: catálogo, venda rápida, ou manual
  warranty?: number; // 0 = sem garantia, 7, 15, 30, 60, 90 dias
  warrantyExpiresAt?: string; // Data de expiração da garantia
  notes?: string;
  archived?: boolean; // NOVO: indica se está arquivado (histórico)
  archivedAt?: string; // NOVO: data do arquivamento
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "receivables_data";

export const receivablesStore = {
  getAllReceivables(): Receivable[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getReceivablesByCustomer(customerId: string): Receivable[] {
    return this.getAllReceivables().filter(r => r.customerId === customerId);
  },

  getReceivablesByStatus(status: "pending" | "partial" | "paid"): Receivable[] {
    return this.getAllReceivables().filter(r => r.status === status);
  },

  getTotalReceivable(): number {
    return this.getAllReceivables().reduce((sum, r) => sum + r.remainingAmount, 0);
  },

  getOverdueReceivables(): Receivable[] {
    const now = new Date();
    return this.getAllReceivables().filter(r => {
      if (!r.dueDate || r.status === "paid") return false;
      return new Date(r.dueDate) < now;
    });
  },

  addReceivable(data: Omit<Receivable, "id" | "status" | "remainingAmount" | "profit" | "createdAt" | "updatedAt">): Receivable {
    const receivables = this.getAllReceivables();
    
    // Validações
    if (!data.customerId) throw new Error("Cliente é obrigatório");
    if (!data.productId) throw new Error("Produto é obrigatório");
    if (data.totalAmount <= 0) throw new Error("Valor total deve ser maior que zero");
    if (data.paidAmount < 0) throw new Error("Valor pago não pode ser negativo");
    if (data.paidAmount > data.totalAmount) throw new Error("Valor pago não pode ser maior que o total");
    
    // Calcular lucro se houver custo e preço de venda
    const profit = (data.costPrice && data.salePrice) 
      ? data.salePrice - data.costPrice 
      : undefined;
    
    const remainingAmount = data.totalAmount - data.paidAmount;
    let status: "pending" | "partial" | "paid" = "pending";
    
    if (data.paidAmount === 0) {
      status = "pending";
    } else if (data.paidAmount >= data.totalAmount) {
      status = "paid";
    } else {
      status = "partial";
    }
    
    const newReceivable: Receivable = {
      ...data,
      id: Date.now().toString(),
      remainingAmount,
      profit,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    receivables.push(newReceivable);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receivables));
    return newReceivable;
  },

  addPayment(receivableId: string, payment: Omit<ReceivablePayment, "id">): Receivable {
    const receivables = this.getAllReceivables();
    const index = receivables.findIndex(r => r.id === receivableId);
    
    if (index === -1) throw new Error("Conta a receber não encontrada");
    
    const receivable = receivables[index];
    
    // Validações
    if (payment.amount <= 0) throw new Error("Valor do pagamento deve ser maior que zero");
    if (payment.amount > receivable.remainingAmount) {
      throw new Error("Valor do pagamento é maior que o saldo devedor");
    }
    
    const newPayment: ReceivablePayment = {
      ...payment,
      id: Date.now().toString(),
    };
    
    receivable.payments.push(newPayment);
    receivable.paidAmount += payment.amount;
    receivable.remainingAmount -= payment.amount;
    receivable.updatedAt = new Date().toISOString();
    
    // Atualizar status
    if (receivable.remainingAmount <= 0) {
      receivable.status = "paid";
      receivable.remainingAmount = 0;
    } else {
      receivable.status = "partial";
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receivables));
    return receivable;
  },

  updateReceivable(id: string, data: Partial<Omit<Receivable, "id" | "createdAt" | "profit">>): Receivable {
    const receivables = this.getAllReceivables();
    const index = receivables.findIndex(r => r.id === id);
    
    if (index === -1) throw new Error("Conta a receber não encontrada");
    
    // Atualizar dados
    const updatedReceivable = {
      ...receivables[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    // Recalcular lucro se necessário
    if (updatedReceivable.costPrice && updatedReceivable.salePrice) {
      updatedReceivable.profit = updatedReceivable.salePrice - updatedReceivable.costPrice;
    }
    
    // Recalcular remainingAmount se totalAmount ou paidAmount mudaram
    if (data.totalAmount !== undefined || data.paidAmount !== undefined) {
      updatedReceivable.remainingAmount = updatedReceivable.totalAmount - updatedReceivable.paidAmount;
      
      // Atualizar status
      if (updatedReceivable.remainingAmount <= 0) {
        updatedReceivable.status = "paid";
        updatedReceivable.remainingAmount = 0;
      } else if (updatedReceivable.paidAmount > 0) {
        updatedReceivable.status = "partial";
      } else {
        updatedReceivable.status = "pending";
      }
    }
    
    receivables[index] = updatedReceivable;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receivables));
    return receivables[index];
  },

  deleteReceivable(id: string): void {
    const receivables = this.getAllReceivables().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receivables));
  },

  archiveReceivable(id: string): Receivable {
    const receivables = this.getAllReceivables();
    const index = receivables.findIndex(r => r.id === id);
    
    if (index === -1) throw new Error("Conta a receber não encontrada");
    
    receivables[index].archived = true;
    receivables[index].archivedAt = new Date().toISOString();
    receivables[index].updatedAt = new Date().toISOString();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receivables));
    return receivables[index];
  },

  unarchiveReceivable(id: string): Receivable {
    const receivables = this.getAllReceivables();
    const index = receivables.findIndex(r => r.id === id);
    
    if (index === -1) throw new Error("Conta a receber não encontrada");
    
    receivables[index].archived = false;
    receivables[index].archivedAt = undefined;
    receivables[index].updatedAt = new Date().toISOString();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receivables));
    return receivables[index];
  },

  getActiveReceivables(): Receivable[] {
    return this.getAllReceivables().filter(r => !r.archived);
  },

  getArchivedReceivables(): Receivable[] {
    return this.getAllReceivables().filter(r => r.archived);
  },
};
