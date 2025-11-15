-- Add sale_date column to receivables table
ALTER TABLE receivables 
ADD COLUMN IF NOT EXISTS sale_date DATE;

-- Backfill existing records: use created_at as sale_date
UPDATE receivables 
SET sale_date = created_at::date 
WHERE sale_date IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_receivables_sale_date ON receivables(sale_date);

-- Add comment
COMMENT ON COLUMN receivables.sale_date IS 'Data real da venda usada para garantia e relatórios';