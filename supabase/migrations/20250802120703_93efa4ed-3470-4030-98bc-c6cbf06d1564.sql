-- Add student_id and major fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN student_id TEXT,
ADD COLUMN major TEXT;