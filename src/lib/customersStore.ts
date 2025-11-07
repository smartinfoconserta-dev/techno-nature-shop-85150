export interface Customer {
  id: string;
  code: string; // Código único (ex: "LOJ001", "CLI042")
  name: string;
  cpfCnpj?: string; // Tornado opcional
  phone?: string;
  email?: string;
  address?: string;
  type: "lojista" | "cliente"; // Tipo de cliente
  creditLimit?: number; // Limite de crédito
  creditBalance?: number; // Saldo de crédito a favor do cliente (haver)
  notes?: string;
  username?: string; // Username para login no portal
  password?: string; // Senha para acessar o portal (opcional)
  hasPortalAccess?: boolean; // Se tem acesso ao portal
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
    
    // Verificar CPF/CNPJ único (se fornecido)
    if (data.cpfCnpj?.trim()) {
      const exists = customers.find(c => c.cpfCnpj === data.cpfCnpj.trim());
      if (exists) throw new Error("CPF/CNPJ já cadastrado");
    }
    
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

  isUsernameAvailable(username: string, excludeId?: string): boolean {
    const normalized = username.trim().toLowerCase();
    const customers = this.getAllCustomers();
    return !customers.some(c => 
      c.id !== excludeId && 
      c.username?.toLowerCase() === normalized
    );
  },

  setPassword(id: string, username: string, password: string): Customer {
    const customers = this.getAllCustomers();
    const index = customers.findIndex(c => c.id === id);
    
    if (index === -1) throw new Error("Cliente não encontrado");
    
    // Validar username
    const normalizedUsername = username.trim().toLowerCase();
    
    if (!normalizedUsername) {
      throw new Error("Username é obrigatório");
    }
    
    if (normalizedUsername.length < 3) {
      throw new Error("Username deve ter no mínimo 3 caracteres");
    }
    
    if (!/^[a-z0-9._]+$/.test(normalizedUsername)) {
      throw new Error("Username deve conter apenas letras, números, pontos e underscores");
    }
    
    // Verificar se username já existe
    if (!this.isUsernameAvailable(username, id)) {
      throw new Error("Username já está em uso");
    }
    
    customers[index].username = normalizedUsername;
    customers[index].password = password;
    customers[index].hasPortalAccess = true;
    customers[index].updatedAt = new Date().toISOString();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    return customers[index];
  },

  authenticateCustomer(cpfCnpj: string, password: string): Customer | null {
    const customer = this.getAllCustomers().find(
      c => c.cpfCnpj === cpfCnpj && c.password === password && c.hasPortalAccess
    );
    return customer || null;
  },

  authenticateCustomerByIdentifier(identifier: string, password: string): Customer | null {
    const normalized = identifier.trim();
    const normalizedUpper = normalized.toUpperCase();
    const normalizedLower = normalized.toLowerCase();
    
    const customer = this.getAllCustomers().find(
      c => (
        c.code.toUpperCase() === normalizedUpper || 
        c.cpfCnpj === normalized ||
        c.username?.toLowerCase() === normalizedLower
      ) && c.password === password && c.hasPortalAccess
    );
    return customer || null;
  },

  getCustomerByIdentifier(identifier: string): Customer | undefined {
    const normalized = identifier.trim().toUpperCase();
    return this.getAllCustomers().find(
      c => c.code.toUpperCase() === normalized || c.cpfCnpj === identifier
    );
  },

  addCredit(customerId: string, amount: number, description: string): Customer {
    const customers = this.getAllCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    
    if (index === -1) throw new Error("Cliente não encontrado");
    
    const currentBalance = customers[index].creditBalance || 0;
    customers[index].creditBalance = currentBalance + amount;
    customers[index].updatedAt = new Date().toISOString();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    return customers[index];
  },

  removeCredit(customerId: string, amount: number): Customer {
    const customers = this.getAllCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    
    if (index === -1) throw new Error("Cliente não encontrado");
    
    const currentBalance = customers[index].creditBalance || 0;
    if (currentBalance < amount) {
      throw new Error("Saldo de crédito insuficiente");
    }
    
    customers[index].creditBalance = currentBalance - amount;
    customers[index].updatedAt = new Date().toISOString();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    return customers[index];
  },

  getCreditBalance(customerId: string): number {
    const customer = this.getCustomerById(customerId);
    return customer?.creditBalance || 0;
  },
};
