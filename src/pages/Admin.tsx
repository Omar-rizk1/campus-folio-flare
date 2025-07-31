import { useState } from "react";
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

// Mock data for admin dashboard
const mockStats = {
  totalProjects: 127,
  pendingReview: 8,
  totalStudents: 45,
  thisMonthUploads: 23
};

const mockPendingProjects = [
  {
    id: 1,
    title: "Blockchain-based Voting System",
    student: "Fatma Ali",
    major: "Computer Science",
    submittedDate: "2024-01-20",
    description: "A secure electronic voting system using blockchain technology to ensure transparency and prevent fraud."
  },
  {
    id: 2,
    title: "Green Architecture Design",
    student: "Youssef Ibrahim",
    major: "Architecture",
    submittedDate: "2024-01-19",
    description: "Sustainable building design incorporating renewable energy sources and eco-friendly materials."
  },
  {
    id: 3,
    title: "Mobile Health Monitoring App",
    student: "Nour Hassan",
    major: "Medicine",
    submittedDate: "2024-01-18",
    description: "A mobile application for continuous health monitoring and early disease detection."
  }
];

const mockRecentProjects = [
  {
    id: 4,
    title: "AI-Powered Healthcare System",
    student: "Ahmed Hassan",
    major: "Computer Science",
    status: "Approved",
    reviewDate: "2024-01-15",
    views: 42
  },
  {
    id: 5,
    title: "Sustainable Energy Management",
    student: "Sara Mohamed",
    major: "Engineering",
    status: "Approved",
    reviewDate: "2024-01-10",
    views: 38
  }
];

const Admin = () => {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleApprove = (projectId: number) => {
    toast({
      title: "Project Approved",
      description: "The project has been approved and published.",
    });
    // In a real app, this would make an API call
  };

  const handleReject = (projectId: number) => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide feedback for project rejection.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Project Rejected",
      description: "The project has been rejected with feedback sent to the student.",
    });
    setSelectedProject(null);
    setFeedback("");
  };

  const filteredPendingProjects = mockPendingProjects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.major.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <p className="text-2xl font-bold text-hue-navy">{mockStats.totalProjects}</p>
                </div>
                <FileText className="h-8 w-8 text-hue-gold" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-orange-600">{mockStats.pendingReview}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold text-hue-navy">{mockStats.totalStudents}</p>
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
                  <p className="text-2xl font-bold text-green-600">{mockStats.thisMonthUploads}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending Review ({mockStats.pendingReview})</TabsTrigger>
            <TabsTrigger value="recent">Recently Reviewed</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Pending Projects */}
          <TabsContent value="pending" className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search projects, students, or majors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Projects List */}
              <div className="space-y-4">
                {filteredPendingProjects.map((project) => (
                  <Card 
                    key={project.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-elegant ${
                      selectedProject?.id === project.id ? 'ring-2 ring-hue-navy' : ''
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Pending Review
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(project.submittedDate).toLocaleDateString()}
                        </div>
                      </div>
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <CardDescription>
                        <div className="space-y-1">
                          <p><strong>Student:</strong> {project.student}</p>
                          <p><strong>Major:</strong> {project.major}</p>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Review Panel */}
              <div className="lg:sticky lg:top-8">
                {selectedProject ? (
                  <Card className="shadow-elegant">
                    <CardHeader>
                      <CardTitle>Review Project</CardTitle>
                      <CardDescription>{selectedProject.title}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p><strong>Student:</strong> {selectedProject.student}</p>
                        <p><strong>Major:</strong> {selectedProject.major}</p>
                        <p><strong>Submitted:</strong> {new Date(selectedProject.submittedDate).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="font-medium">Description:</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedProject.description}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Feedback (optional for approval, required for rejection):</label>
                        <Textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Provide feedback to the student..."
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => handleReject(selectedProject.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button 
                          variant="hero" 
                          className="flex-1"
                          onClick={() => handleApprove(selectedProject.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>

                      <Button variant="outline" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="shadow-elegant">
                    <CardContent className="p-8 text-center">
                      <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Select a project to review
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Recently Reviewed */}
          <TabsContent value="recent" className="space-y-6">
            <div className="space-y-4">
              {mockRecentProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-elegant transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{project.title}</h3>
                          <Badge className="bg-green-100 text-green-800">
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>Student:</strong> {project.student} | <strong>Major:</strong> {project.major}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Reviewed: {new Date(project.reviewDate).toLocaleDateString()}</span>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {project.views} views
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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