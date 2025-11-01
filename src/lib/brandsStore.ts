export interface Brand {
  id: string;
  name: string;
  category: string;
  createdAt: Date;
}

const STORAGE_KEY = "catalog_brands";

// Marcas iniciais
const initialBrands: Brand[] = [
  { id: "1", name: "Samsung", category: "Celulares", createdAt: new Date() },
  { id: "2", name: "Motorola", category: "Celulares", createdAt: new Date() },
  { id: "3", name: "Apple", category: "Celulares", createdAt: new Date() },
  { id: "4", name: "Xiaomi", category: "Celulares", createdAt: new Date() },
  { id: "5", name: "Acer", category: "Notebooks", createdAt: new Date() },
  { id: "6", name: "HP", category: "Notebooks", createdAt: new Date() },
  { id: "7", name: "Dell", category: "Notebooks", createdAt: new Date() },
  { id: "8", name: "Lenovo", category: "Notebooks", createdAt: new Date() },
  { id: "9", name: "Samsung", category: "Notebooks", createdAt: new Date() },
  { id: "10", name: "Apple", category: "Notebooks", createdAt: new Date() },
];

export const brandsStore = {
  getAllBrands: (): Brand[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialBrands));
      return initialBrands;
    }
    return JSON.parse(stored).map((b: any) => ({
      ...b,
      createdAt: new Date(b.createdAt),
    }));
  },

  getBrandsByCategory: (category: string): Brand[] => {
    const allBrands = brandsStore.getAllBrands();
    return allBrands
      .filter(b => b.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  addBrand: (name: string, category: string): Brand => {
    const brands = brandsStore.getAllBrands();
    
    // Verificar duplicata
    const exists = brands.some(
      b => b.name.toLowerCase() === name.toLowerCase() && b.category === category
    );
    
    if (exists) {
      throw new Error("Esta marca já existe nesta categoria");
    }

    const newBrand: Brand = {
      id: Date.now().toString(),
      name: name.trim(),
      category,
      createdAt: new Date(),
    };

    const updatedBrands = [...brands, newBrand];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBrands));
    return newBrand;
  },

  updateBrand: (id: string, name: string, category: string): Brand => {
    const brands = brandsStore.getAllBrands();
    const index = brands.findIndex(b => b.id === id);
    
    if (index === -1) {
      throw new Error("Marca não encontrada");
    }

    // Verificar duplicata (exceto ela mesma)
    const exists = brands.some(
      b => b.id !== id && b.name.toLowerCase() === name.toLowerCase() && b.category === category
    );
    
    if (exists) {
      throw new Error("Já existe uma marca com este nome nesta categoria");
    }

    brands[index] = {
      ...brands[index],
      name: name.trim(),
      category,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
    return brands[index];
  },

  deleteBrand: (id: string): void => {
    const brands = brandsStore.getAllBrands();
    const filtered = brands.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },
};
