import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Filter, Eye, Download, Calendar, Trash2, Github, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  file_url: string | null;
  video_url: string | null;
  github_url?: string | null;
  department: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

const majors = [
  "All Majors", 
  "Dentistry",
  "Pharmacy", 
  "Engineering",
  "Medicine",
  "Physical Therapy",
  "Business Administration",
  "Artificial Intelligence and Information",
  "Applied Health Sciences Technology",
  "Al_Alsun and Translation",
  "Fine Arts and Design"
];

const Projects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("All Majors");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDescription, setExpandedDescription] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately to get full names
      const userIds = [...new Set(projectsData?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      const projectsWithProfiles = projectsData?.map(project => ({
        ...project,
        profiles: profileMap.get(project.user_id) || null
      })) || [];

      setProjects(projectsWithProfiles);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Project deleted",
        description: "Your project has been successfully deleted.",
      });
      
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting your project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const truncateDescription = (text: string | null, maxLength: number = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.profiles?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMajor = selectedMajor === "All Majors" || project.department === selectedMajor;
    return matchesSearch && matchesMajor;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 sm:py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2 sm:mb-4">
            Student Projects
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            Explore innovative projects created by HUE students across different majors
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 sm:mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects or students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {majors.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-base sm:text-lg">Loading projects...</p>
          </div>
        ) : (
          <>
            {/* Project Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="bg-hue-gold text-hue-dark-navy text-xs">
                        {project.department}
                      </Badge>
                      {user && user.id === project.user_id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Project</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this project? This action cannot be undone and will permanently remove your project from the database.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteProject(project.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Project
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <CardTitle className="text-base sm:text-lg line-clamp-2 leading-tight">{project.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {expandedDescription === project.id ? (
                        <span>
                          {project.description}
                          {project.description && project.description.length > 100 && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => setExpandedDescription(null)}
                              className="p-0 h-auto text-xs text-hue-navy ml-1"
                            >
                              Show less
                            </Button>
                          )}
                        </span>
                      ) : (
                        <span>
                          {truncateDescription(project.description)}
                          {project.description && project.description.length > 100 && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => setExpandedDescription(project.id)}
                              className="p-0 h-auto text-xs text-hue-navy ml-1"
                            >
                              Show more
                            </Button>
                          )}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  {project.file_url && (
                    <div className="px-4 sm:px-6 pb-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="cursor-pointer hover:opacity-90 transition-opacity">
                            <img 
                              src={project.file_url} 
                              alt={project.title}
                              className="w-full h-24 sm:h-32 object-cover rounded-md"
                            />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-full h-full max-h-[90vh] p-0">
                          <DialogHeader className="p-6 pb-0">
                            <DialogTitle>{project.title}</DialogTitle>
                          </DialogHeader>
                          <div className="flex-1 overflow-auto p-6 pt-0">
                            <img 
                              src={project.file_url} 
                              alt={project.title}
                              className="w-full h-auto max-h-[70vh] object-contain rounded-md"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                  <CardContent className="pt-3 mt-auto">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium truncate pr-2">{project.profiles?.full_name || "Unknown Student"}</span>
                        <div className="flex items-center text-muted-foreground flex-shrink-0">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                          <span className="sm:hidden">
                            {new Date(project.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          {project.video_url && (
                            <Button variant="navy" size="sm" className="flex-1 text-xs sm:text-sm h-8 sm:h-9" asChild>
                              <a href={project.video_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Demo</span>
                                <span className="sm:hidden">Demo</span>
                              </a>
                            </Button>
                          )}
                          {project.github_url && (
                            <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm h-8 sm:h-9" asChild>
                              <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                                <Github className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">GitHub</span>
                                <span className="sm:hidden">GitHub</span>
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {filteredProjects.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-base sm:text-lg">
              No projects found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;