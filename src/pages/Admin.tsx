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
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
  profiles?: {
    full_name: string | null;
  } | null;
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
    thisMonthUploads: 0
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

  const fetchStats = async () => {
    try {
      // Get total projects count
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Get unique students count
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id');

      // Get this month's uploads
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: thisMonthCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      setStats({
        totalProjects: projectCount || 0,
        totalStudents: profiles?.length || 0,
        thisMonthUploads: thisMonthCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.profiles?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects">All Projects ({stats.totalProjects})</TabsTrigger>
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
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Student:</strong> {project.profiles?.full_name || "Unknown"} | 
                            <strong> Department:</strong> {project.department}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
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