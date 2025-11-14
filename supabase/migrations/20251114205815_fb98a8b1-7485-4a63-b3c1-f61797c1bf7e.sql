-- Adicionar suporte para categorias hierárquicas
ALTER TABLE categories 
ADD COLUMN parent_category_id UUID REFERENCES categories(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX idx_categories_parent ON categories(parent_category_id);

-- Comentários para documentação
COMMENT ON COLUMN categories.parent_category_id IS 'ID da categoria pai para estrutura hierárquica. NULL para categorias raiz.';