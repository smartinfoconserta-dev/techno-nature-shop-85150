import { supabase } from "@/integrations/supabase/client";

export interface Coupon {
  id: string;
  code: string;
  active: boolean;
  discountType: 'fixed';
  discountPercent: number | null;
  createdAt: string;
  updatedAt: string;
}

export const couponsStore = {
  async getAllCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar cupons:", error);
      return [];
    }

    return data.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      active: coupon.active,
      discountType: 'fixed' as const,
      discountPercent: coupon.discount_percent,
      createdAt: coupon.created_at,
      updatedAt: coupon.updated_at,
    }));
  },

  async getActiveCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar cupons ativos:", error);
      return [];
    }

    return data.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      active: coupon.active,
      discountType: 'fixed' as const,
      discountPercent: coupon.discount_percent,
      createdAt: coupon.created_at,
      updatedAt: coupon.updated_at,
    }));
  },

  async validateCoupon(code: string): Promise<{ valid: boolean; coupon?: Coupon }> {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("active", true)
      .single();

    if (error || !data) {
      return { valid: false };
    }

    return {
      valid: true,
      coupon: {
        id: data.id,
        code: data.code,
        active: data.active,
        discountType: 'fixed' as const,
        discountPercent: data.discount_percent,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  },

  async addCoupon(code: string): Promise<Coupon> {
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedCode.length < 3 || trimmedCode.length > 20) {
      throw new Error("O código deve ter entre 3 e 20 caracteres");
    }

    const { data, error } = await supabase
      .from("coupons")
      .insert([{ 
        code: trimmedCode, 
        discount_type: 'fixed',
        discount_percent: null 
      }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar cupom:", error);
      if (error.code === "23505") {
        throw new Error("Já existe um cupom com este código");
      }
      if (error.code === "42501" || error.message?.includes("permission denied") || error.message?.includes("row-level security")) {
        throw new Error("Você precisa estar logado como administrador para criar cupons");
      }
      throw new Error(error.message || "Erro ao adicionar cupom");
    }

    return {
      id: data.id,
      code: data.code,
      active: data.active,
      discountType: 'fixed',
      discountPercent: data.discount_percent,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateCoupon(
    id: string,
    code: string,
    active: boolean
  ): Promise<Coupon> {
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedCode.length < 3 || trimmedCode.length > 20) {
      throw new Error("O código deve ter entre 3 e 20 caracteres");
    }

    const { data, error } = await supabase
      .from("coupons")
      .update({ 
        code: trimmedCode, 
        active,
        discount_type: 'fixed',
        discount_percent: null 
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar cupom:", error);
      if (error.code === "23505") {
        throw new Error("Já existe um cupom com este código");
      }
      if (error.code === "42501" || error.message?.includes("permission denied") || error.message?.includes("row-level security")) {
        throw new Error("Você precisa estar logado como administrador para atualizar cupons");
      }
      throw new Error(error.message || "Erro ao atualizar cupom");
    }

    return {
      id: data.id,
      code: data.code,
      active: data.active,
      discountType: 'fixed',
      discountPercent: data.discount_percent,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async toggleCouponStatus(id: string): Promise<void> {
    const { data: current } = await supabase
      .from("coupons")
      .select("active")
      .eq("id", id)
      .single();

    if (!current) return;

    const { error } = await supabase
      .from("coupons")
      .update({ active: !current.active })
      .eq("id", id);

    if (error) {
      console.error("Erro ao alternar status do cupom:", error);
      throw error;
    }
  },

  async deleteCoupon(id: string): Promise<void> {
    // SOFT DELETE
    const { error } = await supabase
      .from("coupons")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", id);

    if (error) {
      console.error("Erro ao mover cupom para lixeira:", error);
      throw error;
    }
  },

  async restoreCoupon(id: string): Promise<void> {
    const { error } = await supabase
      .from("coupons")
      .update({ deleted_at: null } as any)
      .eq("id", id);

    if (error) {
      console.error("Erro ao restaurar cupom:", error);
      throw error;
    }
  },

  async permanentlyDeleteCoupon(id: string): Promise<void> {
    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) {
      console.error("Erro ao deletar cupom permanentemente:", error);
      throw error;
    }
  },

  async getDeletedCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar cupons deletados:", error);
      return [];
    }

    return (
      data?.map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        active: coupon.active,
        discountType: (coupon.discount_type || "fixed") as "fixed",
        discountPercent: coupon.discount_percent,
        createdAt: coupon.created_at,
        updatedAt: coupon.updated_at,
      })) || []
    );
  },
};
