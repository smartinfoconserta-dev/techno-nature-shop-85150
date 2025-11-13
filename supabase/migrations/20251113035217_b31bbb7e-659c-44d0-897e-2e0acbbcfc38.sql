-- Adicionar colunas para preço de lojista B2B e repasse de desconto à vista
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS discount_price numeric,
ADD COLUMN IF NOT EXISTS pass_on_cash_discount boolean DEFAULT false;

-- Criar índice para melhorar performance em queries de produtos com desconto
CREATE INDEX IF NOT EXISTS idx_products_discount_price ON public.products(discount_price) WHERE discount_price IS NOT NULL;