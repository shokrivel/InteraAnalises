-- CRITICAL SECURITY FIX: Remove moderator access to sensitive medical data
-- Consultation history contains patient symptoms, AI responses, exam results - highly sensitive medical information
-- Only patients and healthcare administrators should have access

-- Drop the existing policy that allows moderator access to all medical records
DROP POLICY IF EXISTS "Admins and moderators can view all consultation history" ON public.consultation_history;

-- Create a healthcare-compliant policy that restricts access to patients and administrators only
CREATE POLICY "Healthcare compliant consultation access" 
ON public.consultation_history 
FOR SELECT 
USING (
  -- Patients can view their own medical records
  (auth.uid() = user_id) 
  OR 
  -- Only healthcare administrators can view all records (removed moderator access)
  has_role(auth.uid(), 'admin'::app_role)
);

-- Also ensure UPDATE/DELETE operations are properly restricted
-- Patients should not be able to modify completed consultations for audit trail integrity
-- Only allow INSERT (creating new consultations)