-- Add enable_family_history column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS enable_family_history BOOLEAN DEFAULT false;