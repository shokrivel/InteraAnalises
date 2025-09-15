-- Create table for editable page content
CREATE TABLE public.paginas_conteudo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  conteudo_texto TEXT NOT NULL,
  url_imagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paginas_conteudo ENABLE ROW LEVEL SECURITY;

-- Create policies for page content
CREATE POLICY "Anyone can view page content" 
ON public.paginas_conteudo 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage page content" 
ON public.paginas_conteudo 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for timestamps
CREATE TRIGGER update_paginas_conteudo_updated_at
BEFORE UPDATE ON public.paginas_conteudo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content for "saiba-mais" page
INSERT INTO public.paginas_conteudo (slug, titulo, conteudo_texto, url_imagem)
VALUES (
  'saiba-mais',
  'Saiba Mais sobre a InteraSaúde',
  'A InteraSaúde é uma plataforma inovadora que utiliza inteligência artificial para auxiliar na análise de sintomas e exames médicos. Nossa missão é democratizar o acesso à informação em saúde, fornecendo orientações precisas e personalizadas para cada usuário.\n\nCom nossa tecnologia avançada, você pode:\n• Consultar sobre sintomas de forma rápida e segura\n• Fazer upload de exames para análise\n• Receber orientações personalizadas baseadas no seu perfil\n• Manter um histórico completo das suas consultas\n\nNossa plataforma é desenvolvida com foco na segurança e privacidade dos seus dados, seguindo as melhores práticas de proteção de informações médicas.',
  null
);

-- Add columns to consultation_history table for reopening functionality
ALTER TABLE public.consultation_history 
ADD COLUMN consulta_original_id UUID REFERENCES public.consultation_history(id),
ADD COLUMN status TEXT NOT NULL DEFAULT 'finalizada';