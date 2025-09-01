import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Search,
  Calendar,
  TrendingUp,
  Star,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ProjectStats } from "@/components/ProjectStats";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  file_url: string | null;
  video_url: string | null;
  department: string;
  user_id: string;
  creator_name?: string | null;
  averageRating?: number;
  totalLikes?: number;
  totalReviews?: number;
}

const Admin = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [feedback, setFeedback] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalStudents: 0,
    thisMonthUploads: 0,
    totalRatings: 0,
    totalLikes: 0,
    totalReviews: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  const isAdmin = user?.email === "Omar.mo.rizk@gmail.com";

  useEffect(() => {
    if (isAdmin) {
      fetchProjects();
      fetchStats();
    }
  }, [isAdmin]);

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

  const fetchStats = async () => {
    try {
      // Get total projects count
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Get unique students count from projects (since we can't access profiles directly)
      const { data: uniqueUsers } = await supabase
        .from('projects')
        .select('user_id');

      // Get this month's uploads
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: thisMonthCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Get engagement stats
      const [ratingsData, likesData, reviewsData] = await Promise.all([
        supabase.from('project_ratings').select('rating'),
        supabase.from('project_likes').select('id'),
        supabase.from('project_reviews').select('id')
      ]);

      const totalRatings = ratingsData.data?.length || 0;
      const averageRating = totalRatings > 0 
        ? ratingsData.data!.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0;

      setStats({
        totalProjects: projectCount || 0,
        totalStudents: new Set(uniqueUsers?.map(u => u.user_id) || []).size,
        thisMonthUploads: thisMonthCount || 0,
        totalRatings,
        totalLikes: likesData.data?.length || 0,
        totalReviews: reviewsData.data?.length || 0,
        averageRating
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.creator_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage and review student project submissions
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold text-hue-navy">{stats.totalProjects}</p>
                </div>
                <FileText className="h-8 w-8 text-hue-gold" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold text-hue-navy">{stats.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-hue-gold" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold text-green-600">{stats.thisMonthUploads}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects">All Projects ({stats.totalProjects})</TabsTrigger>
            <TabsTrigger value="engagement">Engagement Stats</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* All Projects */}
          <TabsContent value="projects" className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search projects, students, or departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Loading projects...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-elegant transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{project.title}</h3>
                            <Badge className="bg-green-100 text-green-800">
                              Published
                            </Badge>
                            {project.averageRating && project.averageRating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs">{project.averageRating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Student:</strong> {project.creator_name || "Unknown"} | 
                            <strong> Department:</strong> {project.department}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                            {(project.totalLikes || 0) > 0 && (
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-red-500" />
                                <span>{project.totalLikes} likes</span>
                              </div>
                            )}
                            {(project.totalReviews || 0) > 0 && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3 text-blue-500" />
                                <span>{project.totalReviews} reviews</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {project.file_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={project.file_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </a>
                            </Button>
                          )}
                          {project.video_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={project.video_url} target="_blank" rel="noopener noreferrer">
                                Video
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredProjects.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">
                      No projects found matching your criteria.
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Engagement Stats */}
          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Engagement Stats */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Overall Engagement</h3>
                <ProjectStats />
              </div>
              
              {/* Top Projects */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Most Engaging Projects</h3>
                <ProjectStats showTopProjects />
              </div>
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Project Analytics
                </CardTitle>
                <CardDescription>
                  Overview of project submissions and engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Analytics dashboard will be implemented with charts and detailed metrics
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;