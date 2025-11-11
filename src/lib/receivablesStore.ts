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
  warrantyExpiresAt?: string;
  notes?: string;
  archived?: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const receivablesStore = {
  async getAllReceivables(): Promise<Receivable[]> {
    const { data, error } = await supabase
      .from("receivables")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      customerId: row.customer_id,
      customerCode: "",
      customerName: row.customer_name,
      productId: row.id,
      productName: row.product_name,
      costPrice: row.cost_price ? Number(row.cost_price) : undefined,
      salePrice: row.sale_price ? Number(row.sale_price) : undefined,
      profit: row.profit ? Number(row.profit) : undefined,
      totalAmount: Number(row.total_amount),
      paidAmount: Number(row.paid_amount),
      remainingAmount: Number(row.remaining_amount),
      couponCode: undefined,
      couponDiscount: undefined,
      dueDate: row.due_date || undefined,
      status: row.status as "pending" | "partial" | "paid",
      payments: (row.payments as any[] || []).map((p: any) => ({
        id: p.id || String(Date.now()),
        amount: Number(p.amount || 0),
        paymentDate: p.paymentDate || new Date().toISOString(),
        paymentMethod: p.paymentMethod || "cash",
        notes: p.notes,
      })),
      source: undefined,
      warranty: undefined,
      warrantyExpiresAt: undefined,
      notes: row.notes || undefined,
      archived: row.archived || false,
      archivedAt: undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }));
  },

  async getReceivablesByCustomer(customerId: string): Promise<Receivable[]> {
    const receivables = await this.getAllReceivables();
    return receivables.filter(r => r.customerId === customerId);
  },

  async getReceivablesByStatus(status: "pending" | "partial" | "paid"): Promise<Receivable[]> {
    const receivables = await this.getAllReceivables();
    return receivables.filter(r => r.status === status);
  },

  async getTotalReceivable(): Promise<number> {
    const receivables = await this.getAllReceivables();
    return receivables.reduce((sum, r) => sum + r.remainingAmount, 0);
  },

  async getOverdueReceivables(): Promise<Receivable[]> {
    const now = new Date();
    const receivables = await this.getAllReceivables();
    return receivables.filter(r => {
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
    if (data.paidAmount === 0) {
      status = "pending";
    } else if (data.paidAmount >= data.totalAmount) {
      status = "paid";
    } else {
      status = "partial";
    }

    const { data: newReceivable, error } = await supabase
      .from("receivables")
      .insert({
        customer_id: data.customerId,
        customer_name: data.customerName,
        product_name: data.productName,
        cost_price: data.costPrice,
        sale_price: data.salePrice,
        profit,
        total_amount: data.totalAmount,
        paid_amount: data.paidAmount,
        remaining_amount: remainingAmount,
        due_date: data.dueDate || null,
        status,
        payments: data.payments || [],
        notes: data.notes || null,
        archived: false,
      })
      .select()
      .single();

    if (error) throw error;

    const receivables = await this.getAllReceivables();
    const receivable = receivables.find(r => r.id === newReceivable.id);
    if (!receivable) throw new Error("Recebível não encontrado");

    return receivable;
  },

  async addPayment(receivableId: string, payment: Omit<ReceivablePayment, "id">): Promise<Receivable> {
    const receivables = await this.getAllReceivables();
    const receivable = receivables.find(r => r.id === receivableId);

    if (!receivable) throw new Error("Conta a receber não encontrada");

    if (payment.amount <= 0) throw new Error("Valor do pagamento deve ser maior que zero");
    if (payment.amount > receivable.remainingAmount) {
      throw new Error("Valor do pagamento é maior que o saldo devedor");
    }

    const newPayment: ReceivablePayment = {
      ...payment,
      id: Date.now().toString(),
    };

    const updatedPayments = [...receivable.payments, newPayment];
    const newPaidAmount = receivable.paidAmount + payment.amount;
    const newRemainingAmount = receivable.totalAmount - newPaidAmount;
    
    let newStatus: "pending" | "partial" | "paid" = "partial";
    if (newRemainingAmount <= 0) {
      newStatus = "paid";
    }

    const { error } = await supabase
      .from("receivables")
      .update({
        payments: updatedPayments,
        paid_amount: newPaidAmount,
        remaining_amount: Math.max(0, newRemainingAmount),
        status: newStatus,
      })
      .eq("id", receivableId);

    if (error) throw error;

    const updated = await this.getAllReceivables();
    const result = updated.find(r => r.id === receivableId);
    if (!result) throw new Error("Recebível não encontrado");

    return result;
  },

  async updateReceivable(
    id: string,
    data: Partial<Omit<Receivable, "id" | "createdAt" | "profit">>
  ): Promise<Receivable> {
    const receivables = await this.getAllReceivables();
    const receivable = receivables.find(r => r.id === id);

    if (!receivable) throw new Error("Conta a receber não encontrada");

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

    const costPrice = data.costPrice ?? receivable.costPrice;
    const salePrice = data.salePrice ?? receivable.salePrice;
    if (costPrice && salePrice) {
      updateData.profit = salePrice - costPrice;
    }

    const totalAmount = data.totalAmount ?? receivable.totalAmount;
    const paidAmount = data.paidAmount ?? receivable.paidAmount;
    const remainingAmount = totalAmount - paidAmount;
    
    updateData.remaining_amount = Math.max(0, remainingAmount);

    if (remainingAmount <= 0) {
      updateData.status = "paid";
    } else if (paidAmount > 0) {
      updateData.status = "partial";
    } else {
      updateData.status = "pending";
    }

    const { error } = await supabase
      .from("receivables")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    const updated = await this.getAllReceivables();
    const result = updated.find(r => r.id === id);
    if (!result) throw new Error("Recebível não encontrado");

    return result;
  },

  async deleteReceivable(id: string): Promise<void> {
    const { error } = await supabase
      .from("receivables")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async archiveReceivable(id: string): Promise<Receivable> {
    const { error } = await supabase
      .from("receivables")
      .update({ archived: true })
      .eq("id", id);

    if (error) throw error;

    const receivables = await this.getAllReceivables();
    const result = receivables.find(r => r.id === id);
    if (!result) throw new Error("Recebível não encontrado");

    return result;
  },

  async unarchiveReceivable(id: string): Promise<Receivable> {
    const { error } = await supabase
      .from("receivables")
      .update({ archived: false })
      .eq("id", id);

    if (error) throw error;

    const receivables = await this.getAllReceivables();
    const result = receivables.find(r => r.id === id);
    if (!result) throw new Error("Recebível não encontrado");

    return result;
  },

  async getActiveReceivables(): Promise<Receivable[]> {
    const receivables = await this.getAllReceivables();
    return receivables.filter(r => !r.archived);
  },

  async getArchivedReceivables(): Promise<Receivable[]> {
    const receivables = await this.getAllReceivables();
    return receivables.filter(r => r.archived);
  },
};
