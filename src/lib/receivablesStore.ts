import { supabase } from "@/integrations/supabase/client";

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
  costPrice?: number;
  salePrice?: number;
  profit?: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  couponCode?: string;
  couponDiscount?: number;
  dueDate?: string;
  status: "pending" | "partial" | "paid";
  payments: ReceivablePayment[];
  source?: "catalog" | "quick" | "manual";
  warranty?: number;
  warrantyMonths?: number;
  warrantyExpiresAt?: string;
  notes?: string;
  archived?: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Sync cache with background refresh
const RECEIVABLES_STORAGE_KEY = "receivables_data";
let receivablesCache: Receivable[] = [];
let initialized = false;

// Helper functions for auto-archiving logic
const isWarrantyExpired = (createdAt: string, warrantyMonths: number = 3): boolean => {
  if (warrantyMonths === 0) return true;
  const saleDate = new Date(createdAt);
  const expirationDate = new Date(saleDate);
  expirationDate.setMonth(expirationDate.getMonth() + warrantyMonths);
  return new Date() > expirationDate;
};

const shouldAutoArchive = (receivable: Receivable): boolean => {
  // Regra: Só arquiva se PAGO + GARANTIA EXPIRADA
  const isPaid = receivable.status === 'paid';
  const warrantyExpired = isWarrantyExpired(
    receivable.createdAt, 
    receivable.warrantyMonths || 3
  );
  return isPaid && warrantyExpired;
};

const genIdR = () => (typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

function loadReceivablesCache() {
  // Cache apenas em memória - não lê localStorage
  if (initialized) return;
  receivablesCache.length = 0;
  initialized = true;
}

function saveReceivablesCache() {
  // No-op: cache apenas em memória - não salva em localStorage
}

function mapRowToReceivable(row: any): Receivable {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerCode: "",
    customerName: row.customer_name,
    productId: row.product_id || "",
    productName: row.product_name,
    costPrice: row.cost_price ? Number(row.cost_price) : undefined,
    salePrice: row.sale_price ? Number(row.sale_price) : undefined,
    profit: row.profit ? Number(row.profit) : undefined,
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    remainingAmount: Number(row.remaining_amount),
    couponCode: row.coupon_code || undefined,
    couponDiscount: row.coupon_discount ? Number(row.coupon_discount) : undefined,
    dueDate: row.due_date || undefined,
    status: row.status as "pending" | "partial" | "paid",
    payments: ((row.payments as any[]) || []).map((p: any) => ({
      id: p.id || String(Date.now()),
      amount: Number(p.amount || 0),
      paymentDate: p.paymentDate || new Date().toISOString(),
      paymentMethod: p.paymentMethod || "cash",
      notes: p.notes,
    })),
    source: undefined,
    warranty: undefined,
    warrantyMonths: row.warranty_months ? Number(row.warranty_months) : undefined,
    warrantyExpiresAt: undefined,
    notes: row.notes || undefined,
    archived: row.archived || false,
    archivedAt: undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export const receivablesStore = {
  async refreshFromBackend(): Promise<void> {
    const { data, error } = await supabase
      .from("receivables")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Erro ao carregar recebíveis:", error);
      return;
    }
    receivablesCache = (data || []).map(mapRowToReceivable);
    saveReceivablesCache();
  },

  getAllReceivables(): Receivable[] {
    loadReceivablesCache();
    if (!receivablesCache.length) this.refreshFromBackend();
    return [...receivablesCache];
  },

  getReceivablesByCustomer(customerId: string): Receivable[] {
    return this.getAllReceivables().filter((r) => r.customerId === customerId);
  },

  getReceivablesByStatus(status: "pending" | "partial" | "paid"): Receivable[] {
    return this.getAllReceivables().filter((r) => r.status === status);
  },

  getTotalReceivable(): number {
    return this.getAllReceivables().reduce((sum, r) => sum + r.remainingAmount, 0);
  },

  getOverdueReceivables(): Receivable[] {
    const now = new Date();
    return this.getAllReceivables().filter((r) => {
      if (!r.dueDate || r.status === "paid") return false;
      return new Date(r.dueDate) < now;
    });
  },

  async addReceivable(
    data: Omit<Receivable, "id" | "status" | "remainingAmount" | "profit" | "createdAt" | "updatedAt">
  ): Promise<Receivable> {
    if (!data.customerId) throw new Error("Cliente é obrigatório");
    if (!data.productId) throw new Error("Produto é obrigatório");
    if (data.totalAmount <= 0) throw new Error("Valor total deve ser maior que zero");
    if (data.paidAmount < 0) throw new Error("Valor pago não pode ser negativo");
    if (data.paidAmount > data.totalAmount) throw new Error("Valor pago não pode ser maior que o total");

    const profit = data.costPrice && data.salePrice ? data.salePrice - data.costPrice : undefined;
    const remainingAmount = data.totalAmount - data.paidAmount;

    let status: "pending" | "partial" | "paid" = "pending";
    if (data.paidAmount === 0) status = "pending";
    else if (data.paidAmount >= data.totalAmount) status = "paid";
    else status = "partial";

    // Garantir que campos NOT NULL nunca sejam null/undefined
    const dueDate = data.dueDate || new Date().toISOString().split('T')[0];

    const receivable: Receivable = {
      id: genIdR(),
      customerId: data.customerId,
      customerCode: data.customerCode,
      customerName: data.customerName,
      productId: data.productId,
      productName: data.productName,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      profit,
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount,
      remainingAmount,
      couponCode: data.couponCode,
      couponDiscount: data.couponDiscount,
      dueDate,
      status,
      payments: data.payments || [],
      source: data.source,
      warranty: data.warranty,
      warrantyMonths: (data as any).warrantyMonths,
      warrantyExpiresAt: data.warrantyExpiresAt,
      notes: data.notes,
      archived: false,
      archivedAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("receivables")
      .upsert({
        id: receivable.id,
        customer_id: receivable.customerId,
        customer_name: receivable.customerName,
        product_name: receivable.productName,
        product_id: receivable.productId || null,
        brand: null,
        category: null,
        base_price: receivable.salePrice || 0,
        cost_price: receivable.costPrice || null,
        sale_price: receivable.salePrice || null,
        installments: 1,
        installment_rate: 0,
        profit: receivable.profit || null,
        total_amount: receivable.totalAmount,
        paid_amount: receivable.paidAmount || 0,
        remaining_amount: receivable.remainingAmount,
        due_date: receivable.dueDate,
        status: receivable.status,
        payments: receivable.payments || [],
        coupon_code: receivable.couponCode || null,
        coupon_discount: receivable.couponDiscount || null,
        warranty_months: receivable.warrantyMonths || 3,
        notes: receivable.notes || null,
        archived: receivable.archived || false,
        created_at: receivable.createdAt,
        updated_at: receivable.updatedAt,
      } as any);

    if (error) {
      console.error("Erro ao persistir recebível:", error);
      throw new Error(error.message || "Erro ao salvar conta a receber");
    }

    receivablesCache = [receivable, ...receivablesCache];
    saveReceivablesCache();

    return receivable;
  },

  async addPayment(receivableId: string, payment: Omit<ReceivablePayment, "id">): Promise<Receivable> {
    const list = this.getAllReceivables();
    const idx = list.findIndex((r) => r.id === receivableId);
    if (idx === -1) throw new Error("Conta a receber não encontrada");

    const receivable = list[idx];
    if (payment.amount <= 0) throw new Error("Valor do pagamento deve ser maior que zero");
    if (payment.amount > receivable.remainingAmount) throw new Error("Valor do pagamento é maior que o saldo devedor");

    const newPayment: ReceivablePayment = { ...payment, id: Date.now().toString() };
    const updatedPayments = [...receivable.payments, newPayment];
    const newPaidAmount = receivable.paidAmount + payment.amount;
    const newRemainingAmount = receivable.totalAmount - newPaidAmount;

    let newStatus: "pending" | "partial" | "paid" = "partial";
    if (newRemainingAmount <= 0) newStatus = "paid";

    const updated: Receivable = {
      ...receivable,
      payments: updatedPayments,
      paidAmount: newPaidAmount,
      remainingAmount: Math.max(0, newRemainingAmount),
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("receivables")
      .update({
        payments: updatedPayments,
        paid_amount: newPaidAmount,
        remaining_amount: Math.max(0, newRemainingAmount),
        status: newStatus,
      })
      .eq("id", receivableId);

    if (error) {
      console.error("Erro ao adicionar pagamento:", error);
      throw new Error(error.message || "Erro ao adicionar pagamento");
    }

    receivablesCache = list.map((r) => (r.id === receivableId ? updated : r));
    saveReceivablesCache();
    await this.refreshFromBackend();

    return updated;
  },

  async updateReceivable(
    id: string,
    data: Partial<Omit<Receivable, "id" | "createdAt" | "profit">>
  ): Promise<Receivable> {
    const list = this.getAllReceivables();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Conta a receber não encontrada");

    const base = list[idx];
    const costPrice = data.costPrice ?? base.costPrice;
    const salePrice = data.salePrice ?? base.salePrice;
    const profit = costPrice && salePrice ? salePrice - costPrice : base.profit;

    const totalAmount = data.totalAmount ?? base.totalAmount;
    const paidAmount = data.paidAmount ?? base.paidAmount;
    const remainingAmount = totalAmount - paidAmount;

    let status: "pending" | "partial" | "paid" = base.status;
    if (remainingAmount <= 0) status = "paid";
    else if (paidAmount > 0) status = "partial";
    else status = "pending";

    const updated: Receivable = {
      ...base,
      ...data,
      profit: profit ?? base.profit,
      remainingAmount: Math.max(0, remainingAmount),
      status,
      updatedAt: new Date().toISOString(),
    } as Receivable;

    const updateData: any = {};
    if (data.productName !== undefined) updateData.product_name = data.productName;
    if (data.customerName !== undefined) updateData.customer_name = data.customerName;
    if (data.costPrice !== undefined) updateData.cost_price = data.costPrice;
    if (data.salePrice !== undefined) updateData.sale_price = data.salePrice;
    if (data.totalAmount !== undefined) updateData.total_amount = data.totalAmount;
    if (data.paidAmount !== undefined) updateData.paid_amount = data.paidAmount;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.archived !== undefined) updateData.archived = data.archived;
    updateData.remaining_amount = Math.max(0, remainingAmount);
    updateData.status = status;

    const { error } = await supabase.from("receivables").update(updateData).eq("id", id);

    if (error) {
      console.error("Erro ao atualizar recebível:", error);
      throw new Error(error.message || "Erro ao atualizar conta a receber");
    }

    receivablesCache = list.map((r) => (r.id === id ? updated : r));
    saveReceivablesCache();
    await this.refreshFromBackend();

    return updated;
  },

  async deleteReceivable(id: string): Promise<void> {
    // SOFT DELETE
    const { error } = await supabase
      .from("receivables")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", id);

    if (error) {
      console.error("Erro ao mover recebível para lixeira:", error);
      throw error;
    }

    await this.refreshFromBackend();
  },

  async restoreReceivable(id: string): Promise<void> {
    const { error } = await supabase
      .from("receivables")
      .update({ deleted_at: null } as any)
      .eq("id", id);

    if (error) {
      console.error("Erro ao restaurar recebível:", error);
      throw error;
    }

    await this.refreshFromBackend();
  },

  async permanentlyDeleteReceivable(id: string): Promise<void> {
    const { error } = await supabase
      .from("receivables")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar recebível permanentemente:", error);
      throw error;
    }
  },

  async getDeletedReceivables(): Promise<Receivable[]> {
    const { data, error } = await supabase
      .from("receivables")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar recebíveis deletados:", error);
      return [];
    }

    return data?.map(mapRowToReceivable) || [];
  },

  async archiveReceivable(id: string): Promise<Receivable> {
    const list = this.getAllReceivables();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Recebível não encontrado");

    const updated: Receivable = { ...list[idx], archived: true, updatedAt: new Date().toISOString() };

    const { error } = await supabase.from("receivables").update({ archived: true }).eq("id", id);

    if (error) {
      console.error("Erro ao arquivar recebível:", error);
      throw new Error(error.message || "Erro ao arquivar conta a receber");
    }

    receivablesCache = list.map((r) => (r.id === id ? updated : r));
    saveReceivablesCache();
    await this.refreshFromBackend();

    return updated;
  },

  async unarchiveReceivable(id: string): Promise<Receivable> {
    const list = this.getAllReceivables();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Recebível não encontrado");

    const updated: Receivable = { ...list[idx], archived: false, updatedAt: new Date().toISOString() };

    const { error } = await supabase.from("receivables").update({ archived: false }).eq("id", id);

    if (error) {
      console.error("Erro ao desarquivar recebível:", error);
      throw new Error(error.message || "Erro ao desarquivar conta a receber");
    }

    receivablesCache = list.map((r) => (r.id === id ? updated : r));
    saveReceivablesCache();
    await this.refreshFromBackend();

    return updated;
  },

  getActiveReceivables(): Receivable[] {
    return this.getAllReceivables().filter((r) => !shouldAutoArchive(r));
  },

  getArchivedReceivables(): Receivable[] {
    return this.getAllReceivables().filter((r) => shouldAutoArchive(r));
  },

  getReceivableById(id: string): Receivable | undefined {
    return this.getAllReceivables().find((r) => r.id === id);
  },

  getReceivableByProductId(productId: string): Receivable | undefined {
    return this.getAllReceivables().find((r) => r.productId === productId);
  },
};
