-- Adicionar coluna has_portal_access para controlar bloqueio do portal
ALTER TABLE customers 
ADD COLUMN has_portal_access BOOLEAN DEFAULT true;

-- Atualizar registros existentes: 
-- Se tem portal_username = acesso liberado (true)
-- Se não tem portal_username = acesso bloqueado (false)
UPDATE customers 
SET has_portal_access = (portal_username IS NOT NULL AND portal_username != '');