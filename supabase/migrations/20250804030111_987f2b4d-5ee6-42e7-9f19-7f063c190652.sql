-- Add github_url column to projects table
ALTER TABLE public.projects 
ADD COLUMN github_url TEXT;