import { supabase } from "@/integrations/supabase/client";

export interface Customer {
  id: string;
  code: string;
  name: string;
  cpfCnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  type: "lojista" | "cliente";
  creditLimit?: number;
  creditBalance?: number;
  notes?: string;
  username?: string;
  password?: string;
  hasPortalAccess?: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const customersStore = {
  async getAllCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar clientes:", error);
      return [];
    }

    return data.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      cpfCnpj: c.cpf_cnpj || undefined,
      phone: c.phone || undefined,
      email: c.email || undefined,
      address: c.address || undefined,
      city: c.city || undefined,
      state: c.state || undefined,
      zipCode: c.zip_code || undefined,
      type: c.customer_type as "lojista" | "cliente",
      creditLimit: c.credit_limit ? Number(c.credit_limit) : undefined,
      creditBalance: c.credit_balance ? Number(c.credit_balance) : undefined,
      notes: c.notes || undefined,
      username: c.portal_username || undefined,
      password: c.portal_password || undefined,
      hasPortalAccess: !!c.portal_username,
      active: c.active,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  },

  async getActiveCustomers(): Promise<Customer[]> {
    const customers = await this.getAllCustomers();
    return customers.filter((c) => c.active);
  },

  async getCustomerByCode(code: string): Promise<Customer | undefined> {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("code", code)
      .single();

    if (!data) return undefined;

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      cpfCnpj: data.cpf_cnpj || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zip_code || undefined,
      type: data.customer_type as "lojista" | "cliente",
      creditLimit: data.credit_limit ? Number(data.credit_limit) : undefined,
      creditBalance: data.credit_balance ? Number(data.credit_balance) : undefined,
      notes: data.notes || undefined,
      username: data.portal_username || undefined,
      password: data.portal_password || undefined,
      hasPortalAccess: !!data.portal_username,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (!data) return undefined;

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      cpfCnpj: data.cpf_cnpj || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zip_code || undefined,
      type: data.customer_type as "lojista" | "cliente",
      creditLimit: data.credit_limit ? Number(data.credit_limit) : undefined,
      creditBalance: data.credit_balance ? Number(data.credit_balance) : undefined,
      notes: data.notes || undefined,
      username: data.portal_username || undefined,
      password: data.portal_password || undefined,
      hasPortalAccess: !!data.portal_username,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async generateNextCode(type: "lojista" | "cliente"): Promise<string> {
    const prefix = type === "lojista" ? "LOJ" : "CLI";
    
    const { data } = await supabase
      .from("customers")
      .select("code")
      .ilike("code", `${prefix}%`)
      .order("code", { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return `${prefix}001`;

    const lastCode = data[0].code;
    const num = parseInt(lastCode.replace(prefix, ""), 10);
    const nextNumber = (num + 1).toString().padStart(3, "0");
    
    return `${prefix}${nextNumber}`;
  },

  async addCustomer(
    data: Omit<Customer, "id" | "code" | "active" | "createdAt" | "updatedAt">
  ): Promise<Customer> {
    if (!data.name?.trim()) throw new Error("Nome é obrigatório");

    // Verificar CPF/CNPJ único
    if (data.cpfCnpj?.trim()) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("cpf_cnpj", data.cpfCnpj.trim())
        .single();

      if (existing) throw new Error("CPF/CNPJ já cadastrado");
    }

    const code = await this.generateNextCode(data.type);

    const { data: inserted, error } = await supabase
      .from("customers")
      .insert([
        {
          code,
          name: data.name.trim(),
          cpf_cnpj: data.cpfCnpj?.trim() || null,
          phone: data.phone?.trim() || null,
          email: data.email?.trim() || null,
          address: data.address?.trim() || null,
          city: data.city || null,
          state: data.state || null,
          zip_code: data.zipCode || null,
          customer_type: data.type,
          credit_limit: data.creditLimit || 0,
          credit_balance: data.creditBalance || 0,
          notes: data.notes?.trim() || null,
          portal_username: data.username?.trim() || null,
          portal_password: data.password || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: inserted.id,
      code: inserted.code,
      name: inserted.name,
      cpfCnpj: inserted.cpf_cnpj || undefined,
      phone: inserted.phone || undefined,
      email: inserted.email || undefined,
      address: inserted.address || undefined,
      city: inserted.city || undefined,
      state: inserted.state || undefined,
      zipCode: inserted.zip_code || undefined,
      type: inserted.customer_type as "lojista" | "cliente",
      creditLimit: Number(inserted.credit_limit),
      creditBalance: Number(inserted.credit_balance),
      notes: inserted.notes || undefined,
      username: inserted.portal_username || undefined,
      password: inserted.portal_password || undefined,
      hasPortalAccess: !!inserted.portal_username,
      active: inserted.active,
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at,
    };
  },

  async updateCustomer(
    id: string,
    data: Partial<Omit<Customer, "id" | "code" | "createdAt">>
  ): Promise<Customer> {
    // Verificar CPF/CNPJ único se estiver atualizando
    if (data.cpfCnpj) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("cpf_cnpj", data.cpfCnpj.trim())
        .neq("id", id)
        .single();

      if (existing) throw new Error("CPF/CNPJ já cadastrado");
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.cpfCnpj !== undefined) updateData.cpf_cnpj = data.cpfCnpj?.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.city !== undefined) updateData.city = data.city || null;
    if (data.state !== undefined) updateData.state = data.state || null;
    if (data.zipCode !== undefined) updateData.zip_code = data.zipCode || null;
    if (data.type) updateData.customer_type = data.type;
    if (data.creditLimit !== undefined) updateData.credit_limit = data.creditLimit;
    if (data.creditBalance !== undefined) updateData.credit_balance = data.creditBalance;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
    if (data.username !== undefined) updateData.portal_username = data.username?.trim() || null;
    if (data.password !== undefined) updateData.portal_password = data.password || null;
    if (data.active !== undefined) updateData.active = data.active;

    const { data: updated, error } = await supabase
      .from("customers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      cpfCnpj: updated.cpf_cnpj || undefined,
      phone: updated.phone || undefined,
      email: updated.email || undefined,
      address: updated.address || undefined,
      city: updated.city || undefined,
      state: updated.state || undefined,
      zipCode: updated.zip_code || undefined,
      type: updated.customer_type as "lojista" | "cliente",
      creditLimit: Number(updated.credit_limit),
      creditBalance: Number(updated.credit_balance),
      notes: updated.notes || undefined,
      username: updated.portal_username || undefined,
      password: updated.portal_password || undefined,
      hasPortalAccess: !!updated.portal_username,
      active: updated.active,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  },

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) throw error;
  },

  async isUsernameAvailable(username: string, excludeId?: string): Promise<boolean> {
    const normalized = username.trim().toLowerCase();
    
    let query = supabase
      .from("customers")
      .select("id")
      .ilike("portal_username", normalized);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data } = await query.single();
    return !data;
  },

  async setPassword(id: string, username: string, password: string): Promise<Customer> {
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername) throw new Error("Username é obrigatório");
    if (normalizedUsername.length < 3) throw new Error("Username deve ter no mínimo 3 caracteres");
    if (!/^[a-z0-9._]+$/.test(normalizedUsername)) {
      throw new Error("Username deve conter apenas letras, números, pontos e underscores");
    }

    const available = await this.isUsernameAvailable(username, id);
    if (!available) throw new Error("Username já está em uso");

    const { data: updated, error } = await supabase
      .from("customers")
      .update({
        portal_username: normalizedUsername,
        portal_password: password,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      cpfCnpj: updated.cpf_cnpj || undefined,
      phone: updated.phone || undefined,
      email: updated.email || undefined,
      address: updated.address || undefined,
      city: updated.city || undefined,
      state: updated.state || undefined,
      zipCode: updated.zip_code || undefined,
      type: updated.customer_type as "lojista" | "cliente",
      creditLimit: Number(updated.credit_limit),
      creditBalance: Number(updated.credit_balance),
      notes: updated.notes || undefined,
      username: updated.portal_username || undefined,
      password: updated.portal_password || undefined,
      hasPortalAccess: !!updated.portal_username,
      active: updated.active,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  },

  async authenticateCustomer(cpfCnpj: string, password: string): Promise<Customer | null> {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("cpf_cnpj", cpfCnpj)
      .eq("portal_password", password)
      .not("portal_username", "is", null)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      cpfCnpj: data.cpf_cnpj || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zip_code || undefined,
      type: data.customer_type as "lojista" | "cliente",
      creditLimit: Number(data.credit_limit),
      creditBalance: Number(data.credit_balance),
      notes: data.notes || undefined,
      username: data.portal_username || undefined,
      password: data.portal_password || undefined,
      hasPortalAccess: !!data.portal_username,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async authenticateCustomerByIdentifier(
    identifier: string,
    password: string
  ): Promise<Customer | null> {
    const normalized = identifier.trim();
    
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("portal_password", password)
      .not("portal_username", "is", null)
      .or(`code.ilike.${normalized},cpf_cnpj.eq.${normalized},portal_username.ilike.${normalized}`)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      cpfCnpj: data.cpf_cnpj || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zip_code || undefined,
      type: data.customer_type as "lojista" | "cliente",
      creditLimit: Number(data.credit_limit),
      creditBalance: Number(data.credit_balance),
      notes: data.notes || undefined,
      username: data.portal_username || undefined,
      password: data.portal_password || undefined,
      hasPortalAccess: !!data.portal_username,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async getCustomerByIdentifier(identifier: string): Promise<Customer | undefined> {
    const normalized = identifier.trim().toUpperCase();
    
    const { data } = await supabase
      .from("customers")
      .select("*")
      .or(`code.ilike.${normalized},cpf_cnpj.eq.${identifier}`)
      .single();

    if (!data) return undefined;

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      cpfCnpj: data.cpf_cnpj || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zip_code || undefined,
      type: data.customer_type as "lojista" | "cliente",
      creditLimit: Number(data.credit_limit),
      creditBalance: Number(data.credit_balance),
      notes: data.notes || undefined,
      username: data.portal_username || undefined,
      password: data.portal_password || undefined,
      hasPortalAccess: !!data.portal_username,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async addCredit(customerId: string, amount: number, description: string): Promise<Customer> {
    const customer = await this.getCustomerById(customerId);
    if (!customer) throw new Error("Cliente não encontrado");

    const newBalance = (customer.creditBalance || 0) + amount;

    return await this.updateCustomer(customerId, { creditBalance: newBalance });
  },

  async removeCredit(customerId: string, amount: number): Promise<Customer> {
    const customer = await this.getCustomerById(customerId);
    if (!customer) throw new Error("Cliente não encontrado");

    const currentBalance = customer.creditBalance || 0;
    if (currentBalance < amount) {
      throw new Error("Saldo de crédito insuficiente");
    }

    const newBalance = currentBalance - amount;

    return await this.updateCustomer(customerId, { creditBalance: newBalance });
  },

  async getCreditBalance(customerId: string): Promise<number> {
    const customer = await this.getCustomerById(customerId);
    return customer?.creditBalance || 0;
  },
};
