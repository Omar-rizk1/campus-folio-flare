import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Github, ExternalLink, Eye, Play, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { ProjectRating } from '@/components/ProjectRating';
import { ProjectReviews } from '@/components/ProjectReviews';
import { ProjectStats } from '@/components/ProjectStats';
import { ProjectCollaborators } from '@/components/ProjectCollaborators';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Check if current user is owner or collaborator
  const { data: userRole } = useQuery({
    queryKey: ['user-project-role', id, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.role || null;
    },
    enabled: !!user?.id && !!id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <Button onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/projects')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
          <p className="text-muted-foreground mb-4">
            by {project.creator_name || 'Unknown Student'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Badge variant="outline">{project.department}</Badge>
                  {project.level && (
                    <Badge variant="secondary">Level {project.level}</Badge>
                  )}
                  
                  {project.description && (
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground">{project.description}</p>
                    </div>
                  )}

                  {/* Project Files/Images Section */}
                  {project.file_url && (
                    <div>
                      <h3 className="font-semibold mb-2">Project Files</h3>
                      {(() => {
                        const fileUrl = project.file_url;
                        const isImage = /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(fileUrl);
                        
                        if (isImage) {
                          return (
                            <div className="mb-4">
                              <img 
                                src={fileUrl} 
                                alt="Project preview" 
                                className="max-w-full h-auto rounded-lg border shadow-sm"
                                style={{ maxHeight: '400px' }}
                              />
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    {project.github_url && (
                      <Button variant="outline" asChild>
                        <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4 mr-2" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {project.video_url && (
                      <Button variant="outline" asChild>
                        <a href={project.video_url} target="_blank" rel="noopener noreferrer">
                          <Play className="w-4 h-4 mr-2" />
                          Demo Video
                        </a>
                      </Button>
                    )}
                    {project.file_url && (
                      <Button variant="outline" asChild>
                        <a href={project.file_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="w-4 h-4 mr-2" />
                          Project Files
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <ProjectReviews projectId={id!} projectOwnerId={project.user_id} />
          </div>

          <div className="space-y-6">
            <ProjectStats projectId={id!} />
            <ProjectRating projectId={id!} projectOwnerId={project.user_id} />
            <ProjectCollaborators 
              projectId={id!} 
              isOwner={userRole === 'owner'} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;