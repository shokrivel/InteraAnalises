-- Remove moderator access to personal profile data for healthcare privacy compliance
-- Update the profile access policy to restrict access to only profile owners and administrators
DROP POLICY IF EXISTS "Profile access policy" ON public.profiles;

-- Create a more restrictive SELECT policy that excludes moderators
CREATE POLICY "Profile access policy - healthcare compliant" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can view their own profile
  (auth.uid() = user_id) 
  OR 
  -- Only admins can view all profiles (removed moderator access for healthcare privacy)
  has_role(auth.uid(), 'admin'::app_role)
);

-- Also update the UPDATE policy to remove moderator access
DROP POLICY IF EXISTS "Profile update policy" ON public.profiles;

-- Create updated UPDATE policy without moderator access
CREATE POLICY "Profile update policy - healthcare compliant" 
ON public.profiles 
FOR UPDATE 
USING (
  -- Users can update their own profile
  (auth.uid() = user_id) 
  OR 
  -- Only admins can update any profile (removed moderator access)
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  -- Same conditions for the check
  (auth.uid() = user_id) 
  OR 
  has_role(auth.uid(), 'admin'::app_role)
);