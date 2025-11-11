import { supabase } from "@/integrations/supabase/client";

export interface CreditTransaction {
  id: string;
  customerId: string;
  type: "add" | "remove";
  amount: number;
  description: string;
  createdAt: string;
}

export const creditHistoryStore = {
  async getAllTransactions(): Promise<CreditTransaction[]> {
    const { data, error } = await supabase
      .from("credit_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar histórico de crédito:", error);
      return [];
    }

    return data.map((trans) => ({
      id: trans.id,
      customerId: trans.customer_id,
      type: trans.transaction_type as "add" | "remove",
      amount: Number(trans.amount),
      description: trans.description,
      createdAt: trans.created_at,
    }));
  },

  async getTransactionsByCustomer(customerId: string): Promise<CreditTransaction[]> {
    const { data, error } = await supabase
      .from("credit_history")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar histórico por cliente:", error);
      return [];
    }

    return data.map((trans) => ({
      id: trans.id,
      customerId: trans.customer_id,
      type: trans.transaction_type as "add" | "remove",
      amount: Number(trans.amount),
      description: trans.description,
      createdAt: trans.created_at,
    }));
  },

  async addTransaction(
    data: Omit<CreditTransaction, "id" | "createdAt">
  ): Promise<CreditTransaction> {
    const { data: insertedData, error } = await supabase
      .from("credit_history")
      .insert([
        {
          customer_id: data.customerId,
          transaction_type: data.type,
          amount: data.amount,
          description: data.description,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar transação:", error);
      throw error;
    }

    return {
      id: insertedData.id,
      customerId: insertedData.customer_id,
      type: insertedData.transaction_type as "add" | "remove",
      amount: Number(insertedData.amount),
      description: insertedData.description,
      createdAt: insertedData.created_at,
    };
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase.from("credit_history").delete().eq("id", id);

    if (error) {
      console.error("Erro ao deletar transação:", error);
      throw error;
    }
  },
};
