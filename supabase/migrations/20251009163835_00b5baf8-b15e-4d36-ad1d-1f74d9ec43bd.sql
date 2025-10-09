-- Update the has_healthcare_role function to enforce credential expiration validation
CREATE OR REPLACE FUNCTION public.has_healthcare_role(_user_id uuid, _role healthcare_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.healthcare_roles
    WHERE user_id = _user_id
      AND healthcare_role = _role
      -- CRITICAL SECURITY FIX: Only accept valid, non-expired credentials
      AND (valid_until IS NULL OR valid_until > now())
  )
$$;