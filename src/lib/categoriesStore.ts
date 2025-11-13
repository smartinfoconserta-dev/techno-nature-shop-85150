import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
}

export const categoriesStore = {
  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .is("deleted_at", null)
      .order("name");

    if (error) {
      console.error("Erro ao buscar categorias:", error);
      return [];
    }

    return data.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      createdAt: cat.created_at,
    }));
  },

  async getCategoryNames(): Promise<string[]> {
    const categories = await this.getAllCategories();
    return categories.map((c) => c.name).sort();
  },

  async addCategory(name: string, icon: string): Promise<Category> {
    const trimmedName = name.trim();

    if (trimmedName.length < 3 || trimmedName.length > 30) {
      throw new Error("O nome deve ter entre 3 e 30 caracteres");
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name: trimmedName, icon }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Já existe uma categoria com este nome");
      }
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      icon: data.icon,
      createdAt: data.created_at,
    };
  },

  async updateCategory(id: string, name: string, icon: string): Promise<Category> {
    const trimmedName = name.trim();

    if (trimmedName.length < 3 || trimmedName.length > 30) {
      throw new Error("O nome deve ter entre 3 e 30 caracteres");
    }

    const { data, error } = await supabase
      .from("categories")
      .update({ name: trimmedName, icon })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Já existe uma categoria com este nome");
      }
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      icon: data.icon,
      createdAt: data.created_at,
    };
  },

  async deleteCategory(id: string): Promise<void> {
    // SOFT DELETE
    const { error } = await supabase
      .from("categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Erro ao mover categoria para lixeira:", error);
      throw error;
    }
  },

  async restoreCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from("categories")
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) {
      console.error("Erro ao restaurar categoria:", error);
      throw error;
    }
  },

  async permanentlyDeleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      console.error("Erro ao deletar categoria permanentemente:", error);
      throw error;
    }
  },

  async getDeletedCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar categorias deletadas:", error);
      return [];
    }

    return (
      data?.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        createdAt: cat.created_at,
      })) || []
    );
  },

  async getCategoryIcon(categoryName: string): Promise<string> {
    const { data } = await supabase
      .from("categories")
      .select("icon")
      .eq("name", categoryName)
      .single();

    return data?.icon || "Package";
  },
};
