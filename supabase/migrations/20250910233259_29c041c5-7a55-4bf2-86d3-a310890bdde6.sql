-- Create enum for field types
CREATE TYPE public.field_type AS ENUM (
  'text',
  'textarea', 
  'select',
  'checkbox',
  'number',
  'date'
);

-- Create table for consultation fields
CREATE TABLE public.consultation_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type field_type NOT NULL DEFAULT 'text',
  field_options JSONB NULL, -- For select options, validation rules, etc.
  required_for_levels TEXT[] NOT NULL DEFAULT '{}', -- Array of profile types that must fill this field
  visible_for_levels TEXT[] NOT NULL DEFAULT '{"patient", "academic", "health_professional"}', -- Array of profile types that can see this field
  field_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(field_name)
);

-- Enable RLS
ALTER TABLE public.consultation_fields ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active consultation fields"
ON public.consultation_fields
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage consultation fields"
ON public.consultation_fields
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_consultation_fields_updated_at
BEFORE UPDATE ON public.consultation_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default fields
INSERT INTO public.consultation_fields (field_name, field_label, field_type, required_for_levels, visible_for_levels, field_order) VALUES
('symptoms', 'Sintomas apresentados', 'textarea', '{"patient", "academic", "health_professional"}', '{"patient", "academic", "health_professional"}', 1),
('symptom_duration', 'Duração dos sintomas (em dias)', 'number', '{"patient", "academic", "health_professional"}', '{"patient", "academic", "health_professional"}', 2),
('family_history', 'Histórico familiar relevante', 'checkbox', '{"patient"}', '{"patient", "academic", "health_professional"}', 3),
('previous_exams', 'Exames laboratoriais anteriores', 'textarea', '{}', '{"academic", "health_professional"}', 4),
('clinical_hypothesis', 'Hipóteses clínicas', 'textarea', '{}', '{"health_professional"}', 5),
('differential_diagnosis', 'Diagnóstico diferencial', 'textarea', '{}', '{"health_professional"}', 6);