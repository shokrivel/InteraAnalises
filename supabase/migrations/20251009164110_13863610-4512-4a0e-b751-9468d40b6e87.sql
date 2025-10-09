-- Create a function to automatically log profile access
CREATE OR REPLACE FUNCTION public.log_profile_select()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only log if user is authenticated and not accessing their own profile
  IF auth.uid() IS NOT NULL THEN
    -- Insert audit log for each profile access by healthcare staff
    -- We don't log when users access their own profiles to reduce noise
    INSERT INTO public.profile_access_logs (
      accessed_profile_id,
      accessed_by,
      access_type,
      access_reason,
      created_at
    )
    SELECT 
      p.id,
      auth.uid(),
      'SELECT',
      'Automated access log',
      now()
    FROM public.profiles p
    WHERE p.user_id != auth.uid()
      AND (
        has_role(auth.uid(), 'admin'::app_role) OR
        has_healthcare_role(auth.uid(), 'healthcare_professional'::healthcare_role) OR
        has_healthcare_role(auth.uid(), 'healthcare_admin'::healthcare_role)
      )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- Update the can_access_healthcare_data function to be more explicit about logging
CREATE OR REPLACE FUNCTION public.can_access_healthcare_data(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  has_access boolean;
BEGIN
  -- Check if user has required roles
  has_access := (
    has_role(_user_id, 'admin'::app_role) OR
    has_healthcare_role(_user_id, 'healthcare_professional'::healthcare_role) OR
    has_healthcare_role(_user_id, 'healthcare_admin'::healthcare_role)
  );
  
  -- CRITICAL: All access through this function will be logged via RLS policies
  -- that call log_profile_access before granting access
  RETURN has_access;
END;
$function$;

-- Add a more restrictive RLS policy that requires explicit logging for healthcare data access
DROP POLICY IF EXISTS "Healthcare compliant profile access" ON public.profiles;

CREATE POLICY "Healthcare compliant profile access"
ON public.profiles
FOR SELECT
USING (
  -- Users can always view their own profile
  auth.uid() = user_id
  OR
  -- Healthcare staff can access if they have valid roles AND we log the access
  (
    can_access_healthcare_data(auth.uid()) 
    AND log_profile_access(id, 'SELECT', 'Healthcare data access via RLS policy')
  )
);