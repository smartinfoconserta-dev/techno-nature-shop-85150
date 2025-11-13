-- Remover a constraint CHECK que impede discount_percent = 0
ALTER TABLE public.coupons 
  DROP CONSTRAINT IF EXISTS coupons_discount_percent_check;

-- Tornar a coluna discount_percent nullable
ALTER TABLE public.coupons 
  ALTER COLUMN discount_percent DROP NOT NULL;

-- Atualizar registros existentes com valor 0 para NULL
UPDATE public.coupons 
  SET discount_percent = NULL 
  WHERE discount_percent = 0;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.coupons.discount_percent IS 'Percentual de desconto aplicado pelo cupom. NULL para cupons que apenas concedem acesso ao preço B2B sem desconto adicional.';