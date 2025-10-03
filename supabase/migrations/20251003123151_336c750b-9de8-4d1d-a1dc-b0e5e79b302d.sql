-- Step 1: Create healthcare-specific roles
CREATE TYPE public.healthcare_role AS ENUM ('healthcare_professional', 'healthcare_admin', 'system_admin');

-- Step 2: Create healthcare roles table
CREATE TABLE public.healthcare_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  healthcare_role healthcare_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  department TEXT,
  license_number TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, healthcare_role)
);

-- Enable RLS on healthcare_roles
ALTER TABLE public.healthcare_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create audit log table for profile access
CREATE TABLE public.profile_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_profile_id UUID NOT NULL,
  accessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL, -- 'view', 'update', 'create'
  access_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profile access logs
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security definer function to check healthcare roles
CREATE OR REPLACE FUNCTION public.has_healthcare_role(_user_id UUID, _role healthcare_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.healthcare_roles
    WHERE user_id = _user_id
      AND healthcare_role = _role
      AND (valid_until IS NULL OR valid_until > now())
  )
$$;

-- Step 5: Create function to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access(_profile_id UUID, _access_type TEXT, _reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
END;
$$;

-- Step 6: Create function to check if user can access healthcare data
CREATE OR REPLACE FUNCTION public.can_access_healthcare_data(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- System admins can access (but it will be logged)
    has_role(_user_id, 'admin'::app_role) OR
    -- Healthcare professionals can access
    has_healthcare_role(_user_id, 'healthcare_professional'::healthcare_role) OR
    -- Healthcare admins can access
    has_healthcare_role(_user_id, 'healthcare_admin'::healthcare_role)
$$;

-- Step 7: Update RLS policies for profiles table with stricter controls
DROP POLICY IF EXISTS "Profile access policy - healthcare compliant" ON public.profiles;
DROP POLICY IF EXISTS "Profile update policy - healthcare compliant" ON public.profiles;

-- New restrictive profile access policy
CREATE POLICY "Healthcare compliant profile access" ON public.profiles
FOR SELECT USING (
  -- Users can view their own profile
  auth.uid() = user_id OR 
  -- Only healthcare authorized users can view other profiles
  (can_access_healthcare_data(auth.uid()) AND 
   -- Log the access when healthcare users view profiles
   public.log_profile_access(id, 'view', 'Healthcare professional access') IS NOT DISTINCT FROM NULL)
);

-- New restrictive profile update policy
CREATE POLICY "Healthcare compliant profile update" ON public.profiles
FOR UPDATE USING (
  -- Users can update their own profile
  auth.uid() = user_id OR 
  -- Only healthcare authorized users can update profiles (and it gets logged)
  (can_access_healthcare_data(auth.uid()) AND
   public.log_profile_access(id, 'update', 'Healthcare professional update') IS NOT DISTINCT FROM NULL)
) WITH CHECK (
  -- Same conditions for the check
  auth.uid() = user_id OR can_access_healthcare_data(auth.uid())
);

-- Step 8: Add RLS policies for healthcare_roles table
CREATE POLICY "Users can view their own healthcare roles" ON public.healthcare_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Healthcare admins can view all roles" ON public.healthcare_roles
FOR SELECT USING (has_healthcare_role(auth.uid(), 'healthcare_admin'::healthcare_role));

CREATE POLICY "Only healthcare admins can manage roles" ON public.healthcare_roles
FOR ALL USING (has_healthcare_role(auth.uid(), 'healthcare_admin'::healthcare_role))
WITH CHECK (has_healthcare_role(auth.uid(), 'healthcare_admin'::healthcare_role));

-- Step 9: Add RLS policies for audit logs
CREATE POLICY "Healthcare authorized users can view audit logs" ON public.profile_access_logs
FOR SELECT USING (
  has_healthcare_role(auth.uid(), 'healthcare_admin'::healthcare_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Step 10: Add triggers for automatic timestamp updates
CREATE TRIGGER update_healthcare_roles_updated_at
  BEFORE UPDATE ON public.healthcare_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 11: Insert sample healthcare admin role for the existing admin
INSERT INTO public.healthcare_roles (user_id, healthcare_role, department, assigned_by)
SELECT ur.user_id, 'healthcare_admin'::healthcare_role, 'Administration', ur.user_id
FROM public.user_roles ur
WHERE ur.role = 'admin'::app_role
ON CONFLICT (user_id, healthcare_role) DO NOTHING;