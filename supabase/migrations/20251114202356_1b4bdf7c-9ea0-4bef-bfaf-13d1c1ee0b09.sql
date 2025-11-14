-- Adicionar colunas para opções configuráveis de processadores e RAM
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS processor_options jsonb DEFAULT '["i3", "i5", "i7", "i9", "Ryzen 3", "Ryzen 5", "Ryzen 7", "Ryzen 9"]'::jsonb,
ADD COLUMN IF NOT EXISTS ram_options jsonb DEFAULT '["4GB", "8GB", "16GB", "32GB", "64GB"]'::jsonb;