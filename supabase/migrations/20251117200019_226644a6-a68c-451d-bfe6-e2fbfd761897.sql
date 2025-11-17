-- Adicionar coluna para ribbon decorativo de "vendido"
ALTER TABLE products 
ADD COLUMN show_sold_overlay BOOLEAN DEFAULT FALSE;