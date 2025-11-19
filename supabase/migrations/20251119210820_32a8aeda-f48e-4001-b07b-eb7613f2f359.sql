-- Adicionar coluna para imagem mobile
ALTER TABLE banners 
ADD COLUMN mobile_image_url TEXT;

-- Comentário explicativo
COMMENT ON COLUMN banners.mobile_image_url IS 'URL da imagem otimizada para dispositivos móveis';