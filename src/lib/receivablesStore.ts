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
  totalAmount: number; // Valor total da venda
  paidAmount: number; // Valor já pago
  remainingAmount: number; // Valor restante
  couponCode?: string; // Cupom aplicado
  couponDiscount?: number; // Valor do desconto do cupom (em %)
  dueDate?: string; // Data de vencimento (opcional)
  status: "pending" | "partial" | "paid"; // pending = não pago, partial = pago parcialmente, paid = quitado
  payments: ReceivablePayment[]; // Histórico de pagamentos
  notes?: string;
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

  addReceivable(data: Omit<Receivable, "id" | "status" | "remainingAmount" | "createdAt" | "updatedAt">): Receivable {
    const receivables = this.getAllReceivables();
    
    // Validações
    if (!data.customerId) throw new Error("Cliente é obrigatório");
    if (!data.productId) throw new Error("Produto é obrigatório");
    if (data.totalAmount <= 0) throw new Error("Valor total deve ser maior que zero");
    if (data.paidAmount < 0) throw new Error("Valor pago não pode ser negativo");
    if (data.paidAmount > data.totalAmount) throw new Error("Valor pago não pode ser maior que o total");
    
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

  updateReceivable(id: string, data: Partial<Omit<Receivable, "id" | "createdAt">>): Receivable {
    const receivables = this.getAllReceivables();
    const index = receivables.findIndex(r => r.id === id);
    
    if (index === -1) throw new Error("Conta a receber não encontrada");
    
    receivables[index] = {
      ...receivables[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receivables));
    return receivables[index];
  },

  deleteReceivable(id: string): void {
    const receivables = this.getAllReceivables().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receivables));
  },
};
