-- Adicionar coluna sale_date na tabela quick_sales
ALTER TABLE quick_sales
ADD COLUMN sale_date date;

-- Preencher valores existentes com a data de created_at para manter histórico
UPDATE quick_sales
SET sale_date = created_at::date
WHERE sale_date IS NULL;

-- Tornar coluna obrigatória após preencher dados existentes
ALTER TABLE quick_sales
ALTER COLUMN sale_date SET NOT NULL;

-- Adicionar valor padrão para novas inserções
ALTER TABLE quick_sales
ALTER COLUMN sale_date SET DEFAULT CURRENT_DATE;

-- Criar índice para otimizar consultas por data
CREATE INDEX idx_quick_sales_sale_date ON quick_sales(sale_date);