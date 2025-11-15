-- Renomear coluna warranty_months para warranty_days em todas as tabelas
-- Isso garante que todas as garantias sejam armazenadas e calculadas em DIAS

-- Renomear em products
ALTER TABLE products 
RENAME COLUMN warranty_months TO warranty_days;

-- Renomear em quick_sales
ALTER TABLE quick_sales 
RENAME COLUMN warranty_months TO warranty_days;

-- Renomear em receivables
ALTER TABLE receivables 
RENAME COLUMN warranty_months TO warranty_days;

-- Renomear em customer_requests
ALTER TABLE customer_requests 
RENAME COLUMN warranty_months TO warranty_days;