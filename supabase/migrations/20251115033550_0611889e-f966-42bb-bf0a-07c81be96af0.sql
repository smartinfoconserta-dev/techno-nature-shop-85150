-- Adicionar colunas de sincronização na tabela products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Criar índice para melhorar performance de consultas por receivable_id
CREATE INDEX IF NOT EXISTS idx_products_receivable_id ON products(receivable_id) WHERE receivable_id IS NOT NULL;

-- Atualizar produtos existentes que têm receivable_id para sincronizar dados
UPDATE products p
SET 
  paid_amount = r.paid_amount,
  remaining_amount = r.remaining_amount,
  payment_status = r.status,
  warranty_days = r.warranty_days
FROM receivables r
WHERE p.receivable_id = r.id
  AND p.sold_on_credit = true;