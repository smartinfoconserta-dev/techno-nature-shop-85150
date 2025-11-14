-- FASE 1: Adicionar campo de ordenação às categorias
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Criar índice para melhorar performance de busca por parent_category_id
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(parent_category_id, display_order);