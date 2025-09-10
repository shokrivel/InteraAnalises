-- Insert profile for existing user if it doesn't exist
INSERT INTO public.profiles (user_id, name, birth_date, address, city, zip_code, profile_type)
SELECT 
  '6f779bbc-47ab-4b23-9dd0-3f575abfaefa'::uuid,
  'Igor Matheus de Souza Fellipe',
  '2000-07-31'::date,
  'Rua 53005, 348',
  'Maringá',
  '87084022',
  'academic'::user_profile_type
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = '6f779bbc-47ab-4b23-9dd0-3f575abfaefa'
);

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, birth_date, address, city, zip_code, profile_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE((NEW.raw_user_meta_data->>'birth_date')::date, CURRENT_DATE),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'zip_code', ''),
    COALESCE((NEW.raw_user_meta_data->>'profile_type')::user_profile_type, 'patient'::user_profile_type)
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();