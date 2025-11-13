import { supabase } from "@/integrations/supabase/client";

export interface Brand {
  id: string;
  name: string;
  category: string;
  createdAt: string;
}

export const brandsStore = {
  async getAllBrands(): Promise<Brand[]> {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .is("deleted_at", null)
      .order("name");

    if (error) {
      console.error("Erro ao buscar marcas:", error);
      return [];
    }

    return data.map((brand) => ({
      id: brand.id,
      name: brand.name,
      category: brand.category,
      createdAt: brand.created_at,
    }));
  },

  async getBrandsByCategory(category: string): Promise<Brand[]> {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("category", category)
      .order("name");

    if (error) {
      console.error("Erro ao buscar marcas por categoria:", error);
      return [];
    }

    return data.map((brand) => ({
      id: brand.id,
      name: brand.name,
      category: brand.category,
      createdAt: brand.created_at,
    }));
  },

  async addBrand(name: string, category: string): Promise<Brand> {
    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 30) {
      throw new Error("O nome deve ter entre 2 e 30 caracteres");
    }

    const { data, error } = await supabase
      .from("brands")
      .insert([{ name: trimmedName, category }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Já existe uma marca com este nome nesta categoria");
      }
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      createdAt: data.created_at,
    };
  },

  async updateBrand(id: string, name: string, category: string): Promise<Brand> {
    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 30) {
      throw new Error("O nome deve ter entre 2 e 30 caracteres");
    }

    const { data, error } = await supabase
      .from("brands")
      .update({ name: trimmedName, category })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Já existe uma marca com este nome nesta categoria");
      }
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      createdAt: data.created_at,
    };
  },

  async deleteBrand(id: string): Promise<void> {
    // SOFT DELETE
    const { error } = await supabase
      .from("brands")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Erro ao mover marca para lixeira:", error);
      throw error;
    }
  },

  async restoreBrand(id: string): Promise<void> {
    const { error } = await supabase
      .from("brands")
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) {
      console.error("Erro ao restaurar marca:", error);
      throw error;
    }
  },

  async permanentlyDeleteBrand(id: string): Promise<void> {
    const { error } = await supabase.from("brands").delete().eq("id", id);

    if (error) {
      console.error("Erro ao deletar marca permanentemente:", error);
      throw error;
    }
  },

  async getDeletedBrands(): Promise<Brand[]> {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar marcas deletadas:", error);
      return [];
    }

    return (
      data?.map((brand) => ({
        id: brand.id,
        name: brand.name,
        category: brand.category,
        createdAt: brand.created_at,
      })) || []
    );
  },
};
