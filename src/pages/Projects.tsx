import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Filter, Eye, Download, Calendar, Trash2, Github, ExternalLink, Star, Heart, MessageSquare } from "lucide-react";
import { ProjectRating } from "@/components/ProjectRating";
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
  level?: number;
  creator_name?: string | null;
  averageRating?: number;
  totalLikes?: number;
  totalReviews?: number;
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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("All Majors");
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [sortBy, setSortBy] = useState("newest");
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

      // Fetch rating and engagement stats for each project
      const projectsWithStats = await Promise.all(
        (projectsData || []).map(async (project) => {
          const [ratingsData, likesData, reviewsData] = await Promise.all([
            supabase.from('project_ratings').select('rating').eq('project_id', project.id),
            supabase.from('project_likes').select('id').eq('project_id', project.id),
            supabase.from('project_reviews').select('id').eq('project_id', project.id)
          ]);

          const totalRatings = ratingsData.data?.length || 0;
          const averageRating = totalRatings > 0 
            ? ratingsData.data!.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
            : 0;

          return {
            ...project,
            averageRating,
            totalLikes: likesData.data?.length || 0,
            totalReviews: reviewsData.data?.length || 0
          };
        })
      );
      
      setProjects(projectsWithStats);
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

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (project.creator_name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMajor = selectedMajor === "All Majors" || project.department === selectedMajor;
      const matchesLevel = selectedLevel === "All Levels" || project.level?.toString() === selectedLevel;
      return matchesSearch && matchesMajor && matchesLevel;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'likes':
          return (b.totalLikes || 0) - (a.totalLikes || 0);
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
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
        <div className="mb-6 sm:mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search projects or students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <select
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {majors.map((major) => (
                  <option key={major} value={major}>
                    {major}
                  </option>
                ))}
              </select>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="All Levels">All Levels</option>
                <option value="0">Level 0</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
                <option value="4">Level 4</option>
                <option value="5">Level 5</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating">Highest Rated</option>
                <option value="likes">Most Liked</option>
              </select>
            </div>
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
              {filteredAndSortedProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 flex flex-col h-full cursor-pointer group">
                  <div onClick={() => navigate(`/project/${project.id}`)}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="secondary" className="bg-hue-gold text-hue-dark-navy text-xs">
                            {project.department}
                          </Badge>
                          {project.level !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              Level {project.level}
                            </Badge>
                          )}
                        </div>
                        {user && user.id === project.user_id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
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
                      <CardTitle className="text-base sm:text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {expandedDescription === project.id ? (
                          <span>
                            {project.description}
                            {project.description && project.description.length > 100 && (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDescription(null);
                                }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDescription(project.id);
                                }}
                                className="p-0 h-auto text-xs text-hue-navy ml-1"
                              >
                                Show more
                              </Button>
                            )}
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                  </div>
                  {project.file_url && (
                    <div className="px-4 sm:px-6 pb-2" onClick={() => navigate(`/project/${project.id}`)}>
                      <img 
                        src={project.file_url} 
                        alt={project.title}
                        className="w-full h-24 sm:h-32 object-cover rounded-md group-hover:opacity-90 transition-opacity"
                      />
                    </div>
                  )}
                  <CardContent className="pt-3 mt-auto">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium truncate pr-2">{project.creator_name || "Unknown Student"}</span>
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

                      {/* Rating and Engagement Stats */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          {project.averageRating && project.averageRating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-muted-foreground">
                                {project.averageRating.toFixed(1)}
                              </span>
                            </div>
                          )}
                          {(project.totalLikes || 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-red-500" />
                              <span className="text-muted-foreground">{project.totalLikes}</span>
                            </div>
                          )}
                          {(project.totalReviews || 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-blue-500" />
                              <span className="text-muted-foreground">{project.totalReviews}</span>
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-6 px-2 hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/project/${project.id}`);
                          }}
                        >
                          View Details
                        </Button>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          {project.video_url && (
                            <Button 
                              variant="navy" 
                              size="sm" 
                              className="flex-1 text-xs sm:text-sm h-8 sm:h-9" 
                              asChild
                            >
                              <a 
                                href={project.video_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Demo</span>
                                <span className="sm:hidden">Demo</span>
                              </a>
                            </Button>
                          )}
                          {project.github_url && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 text-xs sm:text-sm h-8 sm:h-9" 
                              asChild
                            >
                              <a 
                                href={project.github_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
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

        {filteredAndSortedProjects.length === 0 && !loading && (
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