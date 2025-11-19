-- Criar tabela de banners
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer um pode ver banners ativos
CREATE POLICY "Qualquer um pode ver banners ativos"
ON public.banners
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Policy: Apenas admin pode criar banners
CREATE POLICY "Apenas admin pode criar banners"
ON public.banners
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Apenas admin pode atualizar banners
CREATE POLICY "Apenas admin pode atualizar banners"
ON public.banners
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Apenas admin pode deletar banners
CREATE POLICY "Apenas admin pode deletar banners"
ON public.banners
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();