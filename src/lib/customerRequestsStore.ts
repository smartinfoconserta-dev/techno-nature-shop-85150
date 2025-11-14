import { supabase } from "@/integrations/supabase/client";

export interface CustomerRequest {
  id: string;
  customer_id: string;
  customer_name: string;
  product_name: string;
  sale_price: number;
  notes?: string;
  cost_price?: number;
  brand?: string;
  category?: string;
  warranty_months?: number;
  payment_method?: string;
  installments?: number;
  installment_rate?: number;
  admin_notes?: string;
  status: "pending" | "confirmed" | "rejected";
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
  converted_to_receivable_id?: string;
}

export const customerRequestsStore = {
  // CLIENTE: Criar solicitação
  async createRequest(data: {
    productName: string;
    salePrice: number;
    notes?: string;
  }): Promise<CustomerRequest> {
    const token = localStorage.getItem("customer_token");
    
    const { data: result, error } = await supabase.functions.invoke(
      "customer-create-request",
      {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          productName: data.productName,
          salePrice: data.salePrice,
          notes: data.notes,
        },
      }
    );

    if (error || !result.success) {
      throw new Error(result?.error || "Erro ao criar solicitação");
    }

    return result.request;
  },

  // CLIENTE: Buscar suas solicitações
  async getCustomerRequests(): Promise<CustomerRequest[]> {
    const token = localStorage.getItem("customer_token");
    
    const { data: result, error } = await supabase.functions.invoke(
      "customer-get-requests",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (error || !result.success) {
      throw new Error(result?.error || "Erro ao buscar solicitações");
    }

    return result.requests || [];
  },

  // ADMIN: Buscar todas solicitações
  async getAllRequests(): Promise<CustomerRequest[]> {
    const { data, error } = await (supabase as any)
      .from("customer_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as CustomerRequest[];
  },

  // ADMIN: Buscar por cliente
  async getRequestsByCustomer(customerId: string): Promise<CustomerRequest[]> {
    const { data, error } = await (supabase as any)
      .from("customer_requests")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as CustomerRequest[];
  },

  // ADMIN: Atualizar solicitação
  async updateRequest(
    id: string,
    updates: Partial<CustomerRequest>
  ): Promise<CustomerRequest> {
    const { data, error } = await (supabase as any)
      .from("customer_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as CustomerRequest;
  },

  async deleteRequest(id: string): Promise<void> {
    // SOFT DELETE
    const { error } = await (supabase as any)
      .from("customer_requests")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Erro ao mover solicitação para lixeira:", error);
      throw error;
    }
  },

  async restoreRequest(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from("customer_requests")
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) {
      console.error("Erro ao restaurar solicitação:", error);
      throw error;
    }
  },

  async permanentlyDeleteRequest(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from("customer_requests")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar solicitação permanentemente:", error);
      throw error;
    }
  },

  async getDeletedRequests(): Promise<CustomerRequest[]> {
    const { data, error } = await (supabase as any)
      .from("customer_requests")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar solicitações deletadas:", error);
      return [];
    }

    return (
      data?.map((req: any) => ({
        id: req.id,
        customerId: req.customer_id,
        customerName: req.customer_name,
        productName: req.product_name,
        brand: req.brand || "",
        category: req.category || "",
        costPrice: req.cost_price || 0,
        salePrice: req.sale_price || 0,
        paymentMethod: req.payment_method || "",
        installments: req.installments || 1,
        installmentRate: req.installment_rate || 0,
        warrantyMonths: req.warranty_months || 0,
        notes: req.notes || "",
      })) || []
    );
  },

  // ADMIN: Confirmar e converter em venda
  async confirmAndConvert(requestId: string, receivableId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from("customer_requests")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        converted_to_receivable_id: receivableId,
      })
      .eq("id", requestId);

    if (error) throw error;
  },

  // ADMIN: Rejeitar solicitação
  async rejectRequest(id: string, reason?: string): Promise<void> {
    const { error } = await (supabase as any)
      .from("customer_requests")
      .update({
        status: "rejected",
        admin_notes: reason,
      })
      .eq("id", id);

    if (error) throw error;
  },
};
