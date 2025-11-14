-- Adicionar coluna warranty_months à tabela receivables
ALTER TABLE receivables 
ADD COLUMN warranty_months INTEGER DEFAULT 3;

-- Comentário explicativo
COMMENT ON COLUMN receivables.warranty_months IS 
'Período de garantia em meses (0 = sem garantia, 1-36 = meses de garantia)';

-- Criar índice para filtros de garantia
CREATE INDEX idx_receivables_warranty 
ON receivables(warranty_months) 
WHERE warranty_months > 0;

-- Popular dados existentes - receivables que vieram de produtos
UPDATE receivables r
SET warranty_months = p.warranty_months
FROM products p
WHERE r.product_id = p.id
AND r.warranty_months = 3;

-- Popular dados existentes - receivables que vieram de customer_requests
UPDATE receivables r
SET warranty_months = cr.warranty_months
FROM customer_requests cr
WHERE r.id = cr.converted_to_receivable_id
AND r.warranty_months = 3;