import { supabase } from "@/integrations/supabase/client";

export interface Coupon {
  id: string;
  code: string;
  active: boolean;
  discountPercent: number;
  createdAt: string;
  updatedAt: string;
}

export const couponsStore = {
  async getAllCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar cupons:", error);
      return [];
    }

    return data.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      active: coupon.active,
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
        discountPercent: data.discount_percent,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  },

  async addCoupon(code: string, discountPercent: number): Promise<Coupon> {
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedCode.length < 3 || trimmedCode.length > 20) {
      throw new Error("O código deve ter entre 3 e 20 caracteres");
    }

    if (discountPercent <= 0 || discountPercent > 100) {
      throw new Error("O desconto deve ser entre 1% e 100%");
    }

    const { data, error } = await supabase
      .from("coupons")
      .insert([{ code: trimmedCode, discount_percent: discountPercent }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Já existe um cupom com este código");
      }
      throw error;
    }

    return {
      id: data.id,
      code: data.code,
      active: data.active,
      discountPercent: data.discount_percent,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateCoupon(
    id: string,
    code: string,
    discountPercent: number,
    active: boolean
  ): Promise<Coupon> {
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedCode.length < 3 || trimmedCode.length > 20) {
      throw new Error("O código deve ter entre 3 e 20 caracteres");
    }

    if (discountPercent <= 0 || discountPercent > 100) {
      throw new Error("O desconto deve ser entre 1% e 100%");
    }

    const { data, error } = await supabase
      .from("coupons")
      .update({ code: trimmedCode, discount_percent: discountPercent, active })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Já existe um cupom com este código");
      }
      throw error;
    }

    return {
      id: data.id,
      code: data.code,
      active: data.active,
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
    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) {
      console.error("Erro ao deletar cupom:", error);
      throw error;
    }
  },
};
