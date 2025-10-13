-- Add explicit admin/moderator SELECT policy to ensure Admin Panel can list all users
-- This avoids relying on logging side-effects in RLS conditions
CREATE POLICY "Admins and moderators can view profiles (admin panel)"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);
