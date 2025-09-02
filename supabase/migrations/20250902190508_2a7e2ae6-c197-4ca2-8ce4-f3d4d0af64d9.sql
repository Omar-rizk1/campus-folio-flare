-- Create project collaborators table
CREATE TABLE public.project_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create collaboration invites table
CREATE TABLE public.collaboration_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, invitee_email)
);

-- Enable RLS on both tables
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_collaborators
CREATE POLICY "Users can view collaborators for projects they can see" ON public.project_collaborators FOR SELECT USING (true);
CREATE POLICY "Project owners can manage collaborators" ON public.project_collaborators FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Project owners can update collaborators" ON public.project_collaborators FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Project owners can delete collaborators" ON public.project_collaborators FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND user_id = auth.uid()
  )
);

-- RLS Policies for collaboration_invites
CREATE POLICY "Users can view invites they sent or received" ON public.collaboration_invites FOR SELECT USING (
  inviter_id = auth.uid() OR 
  invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
CREATE POLICY "Project owners can create invites" ON public.collaboration_invites FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Invitees can update their invites" ON public.collaboration_invites FOR UPDATE USING (
  invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
CREATE POLICY "Project owners can delete invites" ON public.collaboration_invites FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND user_id = auth.uid()
  )
);

-- Add trigger for updated_at on invites
CREATE TRIGGER update_collaboration_invites_updated_at
  BEFORE UPDATE ON public.collaboration_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON public.project_collaborators(user_id);
CREATE INDEX idx_collaboration_invites_project_id ON public.collaboration_invites(project_id);
CREATE INDEX idx_collaboration_invites_invitee_email ON public.collaboration_invites(invitee_email);

-- Function to automatically add project creator as owner
CREATE OR REPLACE FUNCTION public.add_project_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_collaborators (project_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to add owner when project is created
CREATE TRIGGER add_project_owner_trigger
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.add_project_owner();

-- Function to handle invite acceptance
CREATE OR REPLACE FUNCTION public.accept_collaboration_invite(invite_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invite_record public.collaboration_invites;
  user_email TEXT;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Get the invite
  SELECT * INTO invite_record FROM public.collaboration_invites 
  WHERE id = invite_id AND invitee_email = user_email AND status = 'pending';
  
  IF invite_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Add user as collaborator
  INSERT INTO public.project_collaborators (project_id, user_id, role)
  VALUES (invite_record.project_id, auth.uid(), 'collaborator')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  
  -- Update invite status
  UPDATE public.collaboration_invites 
  SET status = 'accepted', updated_at = now()
  WHERE id = invite_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;