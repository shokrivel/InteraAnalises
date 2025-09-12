-- Create storage bucket for consultation attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('consultation-attachments', 'consultation-attachments', false);

-- Create policies for consultation attachments
CREATE POLICY "Users can upload their own consultation attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'consultation-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own consultation attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'consultation-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins and moderators can view all consultation attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'consultation-attachments' AND (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
));

CREATE POLICY "Users can delete their own consultation attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'consultation-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add attachments column to consultation_history table
ALTER TABLE consultation_history ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Insert the new field type for file attachments
INSERT INTO consultation_fields (
  field_name,
  field_label,
  field_type,
  field_options,
  required_for_levels,
  visible_for_levels,
  field_order,
  is_active
) VALUES (
  'exam_attachments',
  'Anexar Exames',
  'file_upload',
  '{"max_files": 10, "max_size_mb": 5, "allowed_types": ["image/jpeg", "image/jpg", "image/png", "application/pdf"]}'::jsonb,
  '{}',
  '{"patient", "academic", "health_professional"}',
  999,
  true
);