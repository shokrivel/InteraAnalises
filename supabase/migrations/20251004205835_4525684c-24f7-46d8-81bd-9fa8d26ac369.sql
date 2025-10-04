-- Fix the RLS policies to remove inline logging that causes read-only transaction errors

-- Drop the problematic policies first
DROP POLICY IF EXISTS "Healthcare compliant profile access" ON public.profiles;
DROP POLICY IF EXISTS "Healthcare compliant profile update" ON public.profiles;

-- Drop the old function
DROP FUNCTION IF EXISTS public.log_profile_access(UUID, TEXT, TEXT);

-- Create new policies without inline INSERT operations
CREATE POLICY "Healthcare compliant profile access" ON public.profiles
FOR SELECT USING (
  -- Users can view their own profile
  auth.uid() = user_id OR 
  -- Healthcare authorized users can view other profiles
  can_access_healthcare_data(auth.uid())
);

CREATE POLICY "Healthcare compliant profile update" ON public.profiles
FOR UPDATE USING (
  -- Users can update their own profile
  auth.uid() = user_id OR 
  -- Healthcare authorized users can update profiles
  can_access_healthcare_data(auth.uid())
) WITH CHECK (
  auth.uid() = user_id OR can_access_healthcare_data(auth.uid())
);

-- Recreate the log_profile_access function to be called from application code
CREATE OR REPLACE FUNCTION public.log_profile_access(_profile_id UUID, _access_type TEXT, _reason TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.profile_access_logs (
      accessed_profile_id,
      accessed_by,
      access_type,
      access_reason,
      created_at
    ) VALUES (
      _profile_id,
      auth.uid(),
      _access_type,
      _reason,
      now()
    );
  END IF;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail if logging fails
    RETURN FALSE;
END;
$$;