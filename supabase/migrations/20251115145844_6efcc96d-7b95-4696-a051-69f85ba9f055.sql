-- Adicionar campo specs (TEXT) para descrição/especificações de texto livre
-- Mantém specifications (JSONB) para dados estruturados de notebooks

ALTER TABLE products ADD COLUMN IF NOT EXISTS specs TEXT;