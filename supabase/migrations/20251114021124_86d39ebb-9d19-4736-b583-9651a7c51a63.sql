-- Adicionar coluna para soft delete (ocultar do portal sem afetar relatórios)
ALTER TABLE receivables 
ADD COLUMN IF NOT EXISTS hidden_from_portal BOOLEAN DEFAULT false;

-- Criar índice para performance nas buscas do portal
CREATE INDEX IF NOT EXISTS idx_receivables_hidden_portal 
ON receivables(hidden_from_portal) 
WHERE hidden_from_portal = false;

-- Adicionar comentário explicativo
COMMENT ON COLUMN receivables.hidden_from_portal IS 
'Remove da visualização do cliente no portal mas mantém em relatórios financeiros. Soft delete que preserva histórico.';