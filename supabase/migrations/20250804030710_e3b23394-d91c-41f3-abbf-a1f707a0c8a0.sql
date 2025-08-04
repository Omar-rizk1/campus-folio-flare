-- Update projects table to support multiple files
ALTER TABLE public.projects 
ADD COLUMN files_urls TEXT[];

-- Update column to allow multiple file types, not just images
COMMENT ON COLUMN public.projects.file_url IS 'Primary file URL (backwards compatibility)';
COMMENT ON COLUMN public.projects.files_urls IS 'Array of multiple file URLs';