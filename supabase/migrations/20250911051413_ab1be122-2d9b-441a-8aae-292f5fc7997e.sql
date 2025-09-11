-- Create function to check if user can manage roles (only admins can)
CREATE OR REPLACE FUNCTION public.can_manage_roles(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(_user_id, 'admin'::app_role)
$$;

-- Update user_roles policies to allow moderators to view but not manage
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Allow admins and moderators to view all roles
CREATE POLICY "Admins and moderators can view all roles"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Only admins can insert roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (can_manage_roles(auth.uid()));

-- Only admins can update roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (can_manage_roles(auth.uid()));

-- Only admins can delete roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (can_manage_roles(auth.uid()));

-- Update profiles policies to allow moderators to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Allow admins and moderators to view all profiles
CREATE POLICY "Admins and moderators can view all profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role) OR
  auth.uid() = user_id
);

-- Only admins can update other users' profiles
CREATE POLICY "Admins can update all profiles and users can update own"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  auth.uid() = user_id
);

-- Update consultation_fields policies
DROP POLICY IF EXISTS "Admins can manage consultation fields" ON public.consultation_fields;

-- Allow admins and moderators to view consultation fields
CREATE POLICY "Admins and moderators can view consultation fields"
ON public.consultation_fields
FOR SELECT
USING (
  is_active = true OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Only admins can manage consultation fields
CREATE POLICY "Only admins can manage consultation fields"
ON public.consultation_fields
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update consultation_history policies
DROP POLICY IF EXISTS "Admins can view all consultation history" ON public.consultation_history;

-- Allow admins and moderators to view all consultation history
CREATE POLICY "Admins and moderators can view all consultation history"
ON public.consultation_history
FOR SELECT
USING (
  auth.uid() = user_id OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role)
);