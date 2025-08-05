-- Add level field to projects table
ALTER TABLE public.projects 
ADD COLUMN level INTEGER CHECK (level >= 0 AND level <= 5) DEFAULT 0;