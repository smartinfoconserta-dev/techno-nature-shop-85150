-- Remove política pública de SELECT da tabela settings
DROP POLICY IF EXISTS "Qualquer um pode ver configurações" ON settings;

-- Mantém apenas a política para admin
-- (A política "Admin pode ver configurações" já existe)