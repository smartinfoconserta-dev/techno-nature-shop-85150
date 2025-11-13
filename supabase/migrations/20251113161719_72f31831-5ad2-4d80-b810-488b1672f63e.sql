-- Adicionar colunas para vincular receivables aos produtos do catálogo
ALTER TABLE receivables 
ADD COLUMN IF NOT EXISTS product_id uuid,
ADD COLUMN IF NOT EXISTS coupon_code text,
ADD COLUMN IF NOT EXISTS coupon_discount numeric;

-- Adicionar colunas para vincular produtos aos receivables
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS receivable_id uuid,
ADD COLUMN IF NOT EXISTS sold_on_credit boolean NOT NULL DEFAULT false;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_receivables_product_id ON receivables(product_id);
CREATE INDEX IF NOT EXISTS idx_products_receivable_id ON products(receivable_id);