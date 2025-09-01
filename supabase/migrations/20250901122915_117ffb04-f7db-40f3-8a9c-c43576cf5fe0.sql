-- Create project ratings table
CREATE TABLE public.project_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id) -- One rating per user per project
);

-- Create project reviews table  
CREATE TABLE public.project_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id) -- One review per user per project
);

-- Create project likes table
CREATE TABLE public.project_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id) -- One like per user per project
);

-- Enable RLS on all tables
ALTER TABLE public.project_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_ratings
CREATE POLICY "Users can view all ratings" ON public.project_ratings FOR SELECT USING (true);
CREATE POLICY "Users can create their own ratings" ON public.project_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON public.project_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ratings" ON public.project_ratings FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for project_reviews  
CREATE POLICY "Users can view all reviews" ON public.project_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.project_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.project_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.project_reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for project_likes
CREATE POLICY "Users can view all likes" ON public.project_likes FOR SELECT USING (true);
CREATE POLICY "Users can create their own likes" ON public.project_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.project_likes FOR DELETE USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_project_ratings_updated_at
  BEFORE UPDATE ON public.project_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_reviews_updated_at
  BEFORE UPDATE ON public.project_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_project_ratings_project_id ON public.project_ratings(project_id);
CREATE INDEX idx_project_ratings_user_id ON public.project_ratings(user_id);
CREATE INDEX idx_project_reviews_project_id ON public.project_reviews(project_id);
CREATE INDEX idx_project_reviews_user_id ON public.project_reviews(user_id);
CREATE INDEX idx_project_likes_project_id ON public.project_likes(project_id);
CREATE INDEX idx_project_likes_user_id ON public.project_likes(user_id);