-- Fix the security vulnerability: restrict profile access to own profile only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add creator_name to projects table to avoid needing to access other users' profiles
ALTER TABLE public.projects 
ADD COLUMN creator_name TEXT;

-- Populate existing projects with creator names
UPDATE public.projects 
SET creator_name = profiles.full_name
FROM public.profiles 
WHERE public.projects.user_id = public.profiles.user_id;

-- Update the handle_new_user function to ensure profiles have the trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();