import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Edit3, Save, X, Eye, Download, Calendar, Book } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock user data
const mockUser = {
  id: "1",
  name: "Ahmed Hassan",
  email: "ahmed.hassan@hue.edu.eg",
  studentId: "CS2021001",
  major: "Computer Science",
  year: "4th Year",
  avatar: "",
  projects: [
    {
      id: 1,
      title: "AI-Powered Healthcare System",
      description: "A machine learning application for medical diagnosis assistance",
      date: "2024-01-15",
      status: "Published",
      views: 42
    },
    {
      id: 2,
      title: "Smart Campus Management",
      description: "IoT-based system for efficient campus resource management",
      date: "2024-01-08",
      status: "Under Review",
      views: 0
    }
  ]
};

const Profile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: mockUser.name,
    email: mockUser.email,
    major: mockUser.major,
    year: mockUser.year
  });

  const handleSave = () => {
    // In a real app, this would make an API call
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setUserInfo({
      name: mockUser.name,
      email: mockUser.email,
      major: mockUser.major,
      year: mockUser.year
    });
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "Under Review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Student Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your profile and view your submitted projects
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="projects">My Projects</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={mockUser.avatar} />
                      <AvatarFallback className="text-lg bg-hue-gold text-hue-dark-navy">
                        {mockUser.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">{userInfo.name}</CardTitle>
                      <CardDescription className="text-lg">
                        Student ID: {mockUser.studentId}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={handleCancel}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button variant="hero" onClick={handleSave}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="major">Major</Label>
                    <Input
                      id="major"
                      value={userInfo.major}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, major: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Academic Year</Label>
                    <Input
                      id="year"
                      value={userInfo.year}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, year: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-hue-navy">{mockUser.projects.length}</div>
                    <div className="text-sm text-muted-foreground">Total Projects</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-hue-navy">
                      {mockUser.projects.filter(p => p.status === "Published").length}
                    </div>
                    <div className="text-sm text-muted-foreground">Published</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-hue-navy">
                      {mockUser.projects.reduce((sum, p) => sum + p.views, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Views</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Projects</h2>
                <Button variant="hero" asChild>
                  <a href="/upload">Upload New Project</a>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockUser.projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        {project.status === "Published" && (
                          <div className="flex items-center text-muted-foreground text-sm">
                            <Eye className="h-4 w-4 mr-1" />
                            {project.views}
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(project.date).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {project.status === "Published" && (
                            <Button variant="navy" size="sm" className="flex-1">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {mockUser.projects.length === 0 && (
                <div className="text-center py-12">
                  <Book className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by uploading your first project to showcase your work.
                  </p>
                  <Button variant="hero" asChild>
                    <a href="/upload">Upload Your First Project</a>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;