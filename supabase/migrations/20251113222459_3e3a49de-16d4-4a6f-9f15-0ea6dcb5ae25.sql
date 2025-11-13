-- Adicionar coluna deleted_at em todas as tabelas relevantes
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE quick_sales ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_receivables_deleted_at ON receivables(deleted_at);
CREATE INDEX IF NOT EXISTS idx_quick_sales_deleted_at ON quick_sales(deleted_at);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_customer_requests_deleted_at ON customer_requests(deleted_at);
CREATE INDEX IF NOT EXISTS idx_brands_deleted_at ON brands(deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at);
CREATE INDEX IF NOT EXISTS idx_coupons_deleted_at ON coupons(deleted_at);

-- Função para limpar itens deletados há mais de 40 dias (hard delete)
CREATE OR REPLACE FUNCTION cleanup_old_deleted_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cutoff_date timestamp with time zone;
BEGIN
  cutoff_date := now() - interval '40 days';
  
  -- Deletar permanentemente itens antigos
  DELETE FROM products WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_date;
  DELETE FROM receivables WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_date;
  DELETE FROM quick_sales WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_date;
  DELETE FROM customer_requests WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_date;
  DELETE FROM brands WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_date;
  DELETE FROM categories WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_date;
  DELETE FROM coupons WHERE deleted_at IS NOT NULL AND deleted_at < cutoff_date;
  -- Customers não serão deletados permanentemente automaticamente por segurança
  
  RAISE NOTICE 'Limpeza de itens deletados concluída';
END;
$$;