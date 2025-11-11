-- ============================================
-- MIGRAÇÃO COMPLETA: localStorage → Supabase
-- ============================================

-- 1. CATEGORIAS
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode ver categorias"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Apenas admin pode criar categorias"
  ON public.categories FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode atualizar categorias"
  ON public.categories FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode deletar categorias"
  ON public.categories FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. MARCAS
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(name, category)
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode ver marcas"
  ON public.brands FOR SELECT
  USING (true);

CREATE POLICY "Apenas admin pode criar marcas"
  ON public.brands FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode atualizar marcas"
  ON public.brands FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode deletar marcas"
  ON public.brands FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. CLIENTES
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  cpf_cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  customer_type TEXT NOT NULL CHECK (customer_type IN ('lojista', 'cliente')),
  credit_limit DECIMAL(10,2) DEFAULT 0 NOT NULL,
  credit_balance DECIMAL(10,2) DEFAULT 0 NOT NULL,
  notes TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  portal_username TEXT UNIQUE,
  portal_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode ver todos clientes"
  ON public.customers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode criar clientes"
  ON public.customers FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode atualizar clientes"
  ON public.customers FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode deletar clientes"
  ON public.customers FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. PRODUTOS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  specifications JSONB,
  images TEXT[],
  base_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  installments INTEGER,
  installment_rate DECIMAL(5,2),
  warranty_months INTEGER DEFAULT 3,
  product_order INTEGER DEFAULT 0,
  sold BOOLEAN DEFAULT false NOT NULL,
  sold_date TIMESTAMP WITH TIME ZONE,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT,
  payment_method TEXT,
  payment_breakdown JSONB,
  digital_tax DECIMAL(10,2) DEFAULT 0,
  expenses JSONB DEFAULT '[]'::jsonb,
  profit DECIMAL(10,2),
  margin DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode ver produtos disponíveis"
  ON public.products FOR SELECT
  USING (sold = false OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode criar produtos"
  ON public.products FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode atualizar produtos"
  ON public.products FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode deletar produtos"
  ON public.products FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. VENDAS RÁPIDAS (Quick Sales)
CREATE TABLE public.quick_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  cost_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  installments INTEGER DEFAULT 1,
  installment_rate DECIMAL(5,2) DEFAULT 0,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_breakdown JSONB NOT NULL,
  digital_tax DECIMAL(10,2) DEFAULT 0,
  warranty_months INTEGER DEFAULT 3,
  profit DECIMAL(10,2) NOT NULL,
  margin DECIMAL(5,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.quick_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admin pode ver vendas rápidas"
  ON public.quick_sales FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode criar vendas rápidas"
  ON public.quick_sales FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode atualizar vendas rápidas"
  ON public.quick_sales FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode deletar vendas rápidas"
  ON public.quick_sales FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_quick_sales_updated_at BEFORE UPDATE ON public.quick_sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. RECEBÍVEIS (Receivables/Parcelas)
CREATE TABLE public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  customer_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  installments INTEGER NOT NULL,
  installment_rate DECIMAL(5,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
  remaining_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'partial', 'paid')),
  due_date DATE NOT NULL,
  payments JSONB DEFAULT '[]'::jsonb,
  cost_price DECIMAL(10,2),
  profit DECIMAL(10,2),
  notes TEXT,
  archived BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admin pode ver recebíveis"
  ON public.receivables FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode criar recebíveis"
  ON public.receivables FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode atualizar recebíveis"
  ON public.receivables FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode deletar recebíveis"
  ON public.receivables FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_receivables_updated_at BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. CUPONS
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode ver cupons ativos"
  ON public.coupons FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode criar cupons"
  ON public.coupons FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode atualizar cupons"
  ON public.coupons FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode deletar cupons"
  ON public.coupons FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. HISTÓRICO DE CRÉDITO
CREATE TABLE public.credit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('add', 'remove')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admin pode ver histórico de crédito"
  ON public.credit_history FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode criar histórico de crédito"
  ON public.credit_history FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode deletar histórico de crédito"
  ON public.credit_history FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. CONFIGURAÇÕES
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_tax_rate DECIMAL(5,2) DEFAULT 3.90 NOT NULL,
  include_cash_in_tax BOOLEAN DEFAULT false NOT NULL,
  installment_rates JSONB NOT NULL DEFAULT '[
    {"installments": 1, "rate": 0},
    {"installments": 2, "rate": 2.99},
    {"installments": 3, "rate": 3.99},
    {"installments": 4, "rate": 4.99},
    {"installments": 5, "rate": 5.99},
    {"installments": 6, "rate": 6.99},
    {"installments": 7, "rate": 7.99},
    {"installments": 8, "rate": 8.99},
    {"installments": 9, "rate": 9.99},
    {"installments": 10, "rate": 10.99},
    {"installments": 11, "rate": 11.99},
    {"installments": 12, "rate": 12.99}
  ]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Inserir configuração padrão
INSERT INTO public.settings (id) VALUES (gen_random_uuid());

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode ver configurações"
  ON public.settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode atualizar configurações"
  ON public.settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. RELATÓRIOS MENSAIS
CREATE TABLE public.monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL UNIQUE,
  total_sales DECIMAL(10,2) DEFAULT 0 NOT NULL,
  total_purchases DECIMAL(10,2) DEFAULT 0 NOT NULL,
  net_profit DECIMAL(10,2) DEFAULT 0 NOT NULL,
  taxes DECIMAL(10,2) DEFAULT 0 NOT NULL,
  sold_count INTEGER DEFAULT 0 NOT NULL,
  average_margin DECIMAL(5,2) DEFAULT 0 NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admin pode ver relatórios"
  ON public.monthly_reports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode criar relatórios"
  ON public.monthly_reports FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode atualizar relatórios"
  ON public.monthly_reports FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Inserir categorias padrão
INSERT INTO public.categories (name, icon) VALUES
  ('Notebooks', 'Laptop'),
  ('Celulares', 'Smartphone'),
  ('Tablets', 'Tablet'),
  ('Smartwatches', 'Watch'),
  ('Fones de Ouvido', 'Headphones')
ON CONFLICT (name) DO NOTHING;