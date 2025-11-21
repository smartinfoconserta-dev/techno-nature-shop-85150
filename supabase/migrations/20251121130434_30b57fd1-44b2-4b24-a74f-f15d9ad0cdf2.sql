-- Remove a constraint UNIQUE antiga que não diferencia categorias deletadas
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- Cria um índice UNIQUE parcial que só valida nomes de categorias ativas
CREATE UNIQUE INDEX categories_name_active_key 
ON categories(name) 
WHERE deleted_at IS NULL;

-- Adiciona comentário explicativo
COMMENT ON INDEX categories_name_active_key IS 'Garante unicidade de nomes apenas para categorias não deletadas, permitindo reusar nomes de categorias soft-deleted';