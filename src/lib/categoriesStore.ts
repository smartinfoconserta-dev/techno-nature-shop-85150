export interface Category {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
}

const STORAGE_KEY = "categories_data";

const initialCategories: Category[] = [
  {
    id: "1",
    name: "Notebooks",
    icon: "Laptop",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Celulares",
    icon: "Smartphone",
    createdAt: new Date().toISOString(),
  },
];

export const categoriesStore = {
  getAllCategories(): Category[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialCategories));
      return initialCategories;
    }
    return JSON.parse(stored);
  },

  getCategoryNames(): string[] {
    return this.getAllCategories()
      .map((c) => c.name)
      .sort();
  },

  addCategory(name: string, icon: string): Category {
    const categories = this.getAllCategories();
    
    const nameLower = name.trim().toLowerCase();
    const exists = categories.some((c) => c.name.toLowerCase() === nameLower);
    
    if (exists) {
      throw new Error("Já existe uma categoria com este nome");
    }

    if (name.trim().length < 3 || name.trim().length > 30) {
      throw new Error("O nome deve ter entre 3 e 30 caracteres");
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: name.trim(),
      icon,
      createdAt: new Date().toISOString(),
    };

    categories.push(newCategory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    return newCategory;
  },

  updateCategory(id: string, name: string, icon: string): Category {
    const categories = this.getAllCategories();
    const index = categories.findIndex((c) => c.id === id);

    if (index === -1) throw new Error("Categoria não encontrada");

    const nameLower = name.trim().toLowerCase();
    const exists = categories.some(
      (c) => c.id !== id && c.name.toLowerCase() === nameLower
    );

    if (exists) {
      throw new Error("Já existe uma categoria com este nome");
    }

    if (name.trim().length < 3 || name.trim().length > 30) {
      throw new Error("O nome deve ter entre 3 e 30 caracteres");
    }

    categories[index] = {
      ...categories[index],
      name: name.trim(),
      icon,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    return categories[index];
  },

  deleteCategory(id: string): void {
    const categories = this.getAllCategories();
    const filtered = categories.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  getCategoryIcon(categoryName: string): string {
    const category = this.getAllCategories().find(
      (c) => c.name === categoryName
    );
    return category?.icon || "Package";
  },
};
