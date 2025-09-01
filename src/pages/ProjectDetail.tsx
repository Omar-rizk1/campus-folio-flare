import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Github, ExternalLink, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProjectRating } from '@/components/ProjectRating';
import { ProjectReviews } from '@/components/ProjectReviews';
import { ProjectStats } from '@/components/ProjectStats';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  file_url: string | null;
  video_url: string | null;
  github_url: string | null;
  department: string;
  user_id: string;
  level?: number;
  creator_name?: string | null;
  files_urls?: string[] | null;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        navigate('/projects');
        return;
      }

      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingUpdate = () => {
    // Refresh any data that might be affected by rating changes
    fetchProject();
  };

  if (loading) {
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

  const allImages = project.files_urls?.filter(url => 
    url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  ) || [];

  if (project.file_url && !allImages.includes(project.file_url)) {
    allImages.unshift(project.file_url);
  }

  const documents = project.files_urls?.filter(url => 
    !url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/projects')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex gap-2 mb-2">
                <Badge variant="secondary" className="bg-hue-gold text-hue-dark-navy">
                  {project.department}
                </Badge>
                {project.level !== undefined && (
                  <Badge variant="outline">
                    Level {project.level}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
              <p className="text-muted-foreground mb-4">
                by {project.creator_name || 'Unknown Student'}
              </p>
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(project.created_at).toLocaleDateString('en', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Images */}
            {allImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allImages.map((url, index) => (
                      <Dialog key={index}>
                        <DialogTrigger asChild>
                          <div className="cursor-pointer hover:opacity-90 transition-opacity group relative">
                            <img 
                              src={url} 
                              alt={`${project.title} - Image ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-full h-full max-h-[90vh] p-0">
                          <DialogHeader className="p-6 pb-0">
                            <DialogTitle>{project.title} - Image {index + 1}</DialogTitle>
                          </DialogHeader>
                          <div className="flex-1 overflow-auto p-6 pt-0">
                            <img 
                              src={url} 
                              alt={`${project.title} - Image ${index + 1}`}
                              className="w-full h-auto max-h-[70vh] object-contain rounded-md"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Description */}
            <Card>
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {project.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>

            {/* Project Links */}
            <Card>
              <CardHeader>
                <CardTitle>Project Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.video_url && (
                    <Button variant="navy" asChild className="w-full justify-start">
                      <a href={project.video_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Demo Video
                      </a>
                    </Button>
                  )}
                  
                  {project.github_url && (
                    <Button variant="outline" asChild className="w-full justify-start">
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4 mr-2" />
                        View Source Code
                      </a>
                    </Button>
                  )}

                  {documents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Project Documents</h4>
                      {documents.map((url, index) => (
                        <Button key={index} variant="outline" asChild className="w-full justify-start">
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Document {index + 1}
                          </a>
                        </Button>
                      ))}
                    </div>
                  )}

                  {!project.video_url && !project.github_url && documents.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No additional links or documents available.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardContent className="pt-6">
                <ProjectReviews 
                  projectId={project.id} 
                  projectOwnerId={project.user_id} 
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating Section */}
            <Card>
              <CardHeader>
                <CardTitle>Rate This Project</CardTitle>
                <CardDescription>
                  Share your feedback and help others discover great work
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectRating 
                  projectId={project.id} 
                  projectOwnerId={project.user_id}
                  onRatingUpdate={handleRatingUpdate}
                />
              </CardContent>
            </Card>

            {/* Project Statistics */}
            <ProjectStats projectId={project.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;