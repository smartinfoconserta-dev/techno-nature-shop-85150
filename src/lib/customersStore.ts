export interface Customer {
  id: string;
  code: string; // Código único (ex: "LOJ001", "CLI042")
  name: string;
  cpfCnpj: string;
  phone?: string;
  email?: string;
  address?: string;
  type: "lojista" | "cliente"; // Tipo de cliente
  creditLimit?: number; // Limite de crédito
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "customers_data";

export const customersStore = {
  getAllCustomers(): Customer[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getActiveCustomers(): Customer[] {
    return this.getAllCustomers().filter(c => c.active);
  },

  getCustomerByCode(code: string): Customer | undefined {
    return this.getAllCustomers().find(c => c.code === code);
  },

  getCustomerById(id: string): Customer | undefined {
    return this.getAllCustomers().find(c => c.id === id);
  },

  generateNextCode(type: "lojista" | "cliente"): string {
    const customers = this.getAllCustomers();
    const prefix = type === "lojista" ? "LOJ" : "CLI";
    const ofType = customers.filter(c => c.code.startsWith(prefix));
    
    if (ofType.length === 0) return `${prefix}001`;
    
    const numbers = ofType.map(c => {
      const num = c.code.replace(prefix, "");
      return parseInt(num, 10);
    }).filter(n => !isNaN(n));
    
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = (maxNumber + 1).toString().padStart(3, "0");
    
    return `${prefix}${nextNumber}`;
  },

  addCustomer(data: Omit<Customer, "id" | "code" | "active" | "createdAt" | "updatedAt">): Customer {
    const customers = this.getAllCustomers();
    
    // Validações
    if (!data.name?.trim()) throw new Error("Nome é obrigatório");
    if (!data.cpfCnpj?.trim()) throw new Error("CPF/CNPJ é obrigatório");
    
    // Verificar CPF/CNPJ único
    const exists = customers.find(c => c.cpfCnpj === data.cpfCnpj.trim());
    if (exists) throw new Error("CPF/CNPJ já cadastrado");
    
    const code = this.generateNextCode(data.type);
    
    const newCustomer: Customer = {
      ...data,
      id: Date.now().toString(),
      code,
      name: data.name.trim(),
      cpfCnpj: data.cpfCnpj.trim(),
      phone: data.phone?.trim(),
      email: data.email?.trim(),
      address: data.address?.trim(),
      notes: data.notes?.trim(),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    customers.push(newCustomer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    return newCustomer;
  },

  updateCustomer(id: string, data: Partial<Omit<Customer, "id" | "code" | "createdAt">>): Customer {
    const customers = this.getAllCustomers();
    const index = customers.findIndex(c => c.id === id);
    
    if (index === -1) throw new Error("Cliente não encontrado");
    
    // Se estiver atualizando CPF/CNPJ, verificar unicidade
    if (data.cpfCnpj) {
      const exists = customers.find(c => c.id !== id && c.cpfCnpj === data.cpfCnpj.trim());
      if (exists) throw new Error("CPF/CNPJ já cadastrado");
    }
    
    customers[index] = {
      ...customers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    return customers[index];
  },

  deleteCustomer(id: string): void {
    const customers = this.getAllCustomers().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  },
};
