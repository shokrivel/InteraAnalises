-- Create pages table for the page management system
CREATE TABLE public.pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content jsonb NOT NULL DEFAULT '{}',
  page_type text NOT NULL CHECK (page_type IN ('informative', 'interactive')),
  parent_id uuid REFERENCES public.pages(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Create policies for pages
CREATE POLICY "Anyone can view active pages" 
ON public.pages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage pages" 
ON public.pages 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create page_components table for storing page components
CREATE TABLE public.page_components (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  component_type text NOT NULL CHECK (component_type IN ('text', 'image', 'video', 'card_slider', 'quiz', 'external_link', 'filter')),
  content jsonb NOT NULL DEFAULT '{}',
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on page_components
ALTER TABLE public.page_components ENABLE ROW LEVEL SECURITY;

-- Create policies for page_components
CREATE POLICY "Anyone can view active page components" 
ON public.page_components 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage page components" 
ON public.page_components 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates on page_components
CREATE TRIGGER update_page_components_updated_at
BEFORE UPDATE ON public.page_components
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();