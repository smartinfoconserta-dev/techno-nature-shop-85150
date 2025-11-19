-- Adicionar campos de overlay/máscara na tabela banners
ALTER TABLE public.banners
ADD COLUMN overlay_color TEXT NOT NULL DEFAULT '#000000',
ADD COLUMN overlay_opacity INTEGER NOT NULL DEFAULT 30;

-- Adicionar constraint para garantir opacidade entre 0 e 100
ALTER TABLE public.banners
ADD CONSTRAINT overlay_opacity_range CHECK (overlay_opacity >= 0 AND overlay_opacity <= 100);