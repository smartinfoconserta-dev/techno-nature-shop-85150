-- Adicionar coluna para indicar que cupom é do tipo "fixed" (preço fixo)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'fixed';

-- Atualizar cupons existentes para o novo tipo
UPDATE coupons SET discount_type = 'fixed';

-- Tornar discount_percent nullable e com default 0
ALTER TABLE coupons ALTER COLUMN discount_percent SET DEFAULT 0;
ALTER TABLE coupons ALTER COLUMN discount_percent DROP NOT NULL;