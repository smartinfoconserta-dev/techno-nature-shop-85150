import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
  parentCategoryId: string | null;
  displayOrder?: number;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
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
      parentCategoryId: cat.parent_category_id,
      displayOrder: cat.display_order || 0,
    }));
  },

  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    const allCategories = await this.getAllCategories();
    const categoryMap = new Map<string, CategoryTreeNode>();
    
    // Criar mapa de todas as categorias
    allCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });
    
    // Construir árvore
    const tree: CategoryTreeNode[] = [];
    allCategories.forEach(cat => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentCategoryId) {
        const parent = categoryMap.get(cat.parentCategoryId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        tree.push(node);
      }
    });
    
    // Ordenar por display_order e nome
    const sortNodes = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return (a.displayOrder || 0) - (b.displayOrder || 0);
        }
        return a.name.localeCompare(b.name);
      });
      nodes.forEach(node => sortNodes(node.children));
    };
    sortNodes(tree);
    
    return tree;
  },

  async getCategoryPath(categoryId: string): Promise<Category[]> {
    const path: Category[] = [];
    let currentId: string | null = categoryId;
    
    while (currentId) {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", currentId)
        .is("deleted_at", null)
        .single();
      
      if (error || !data) break;
      
      const category: Category = {
        id: data.id,
        name: data.name,
        icon: data.icon,
        createdAt: data.created_at,
        parentCategoryId: data.parent_category_id,
        displayOrder: data.display_order || 0,
      };
      
      path.unshift(category);
      currentId = data.parent_category_id;
    }
    
    return path;
  },

  async hasChildren(categoryId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_category_id", categoryId)
      .is("deleted_at", null)
      .limit(1);
    
    if (error) return false;
    return data.length > 0;
  },

  async getAllCategoryIdsRecursive(categoryId: string): Promise<string[]> {
    const ids = [categoryId];
    const children = await this.getSubCategories(categoryId);
    
    for (const child of children) {
      const childIds = await this.getAllCategoryIdsRecursive(child.id);
      ids.push(...childIds);
    }
    
    return ids;
  },

  async getCategoryNames(): Promise<string[]> {
    const categories = await this.getAllCategories();
    return categories.map((c) => c.name).sort();
  },

  async getParentCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .is("deleted_at", null)
      .is("parent_category_id", null)
      .order("name");

    if (error) {
      console.error("Erro ao buscar categorias pai:", error);
      return [];
    }

    return data.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      createdAt: cat.created_at,
      parentCategoryId: cat.parent_category_id,
    }));
  },

  async getSubCategories(parentId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .is("deleted_at", null)
      .eq("parent_category_id", parentId)
      .order("name");

    if (error) {
      console.error("Erro ao buscar subcategorias:", error);
      return [];
    }

    return data.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      createdAt: cat.created_at,
      parentCategoryId: cat.parent_category_id,
    }));
  },

  async addCategory(name: string, icon: string, parentCategoryId: string | null = null): Promise<Category> {
    const trimmedName = name.trim();

    if (trimmedName.length < 3 || trimmedName.length > 30) {
      throw new Error("O nome deve ter entre 3 e 30 caracteres");
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name: trimmedName, icon, parent_category_id: parentCategoryId }])
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
      parentCategoryId: data.parent_category_id,
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
      parentCategoryId: data.parent_category_id,
    };
  },

  async deleteCategory(id: string): Promise<void> {
    // SOFT DELETE
    const { error } = await supabase
      .from("categories")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", id);

    if (error) {
      console.error("Erro ao mover categoria para lixeira:", error);
      throw error;
    }
  },

  async restoreCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from("categories")
      .update({ deleted_at: null } as any)
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
        parentCategoryId: cat.parent_category_id,
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
