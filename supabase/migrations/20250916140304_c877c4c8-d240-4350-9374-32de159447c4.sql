-- Fix conflicting RLS policies on profiles table
-- Drop the duplicate/conflicting SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- The remaining policy "Admins and moderators can view all profiles" already includes user access
-- Update it to be more clear and secure
DROP POLICY IF EXISTS "Admins and moderators can view all profiles" ON public.profiles;

-- Create a single, consolidated SELECT policy
CREATE POLICY "Profile access policy" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can view their own profile
  (auth.uid() = user_id) 
  OR 
  -- Admins and moderators can view all profiles
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
);

-- Also consolidate the UPDATE policies for clarity
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles and users can update own" ON public.profiles;

-- Create a single, clear UPDATE policy
CREATE POLICY "Profile update policy" 
ON public.profiles 
FOR UPDATE 
USING (
  -- Users can update their own profile
  (auth.uid() = user_id) 
  OR 
  -- Admins can update any profile
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  -- Same conditions for the check
  (auth.uid() = user_id) 
  OR 
  has_role(auth.uid(), 'admin'::app_role)
);