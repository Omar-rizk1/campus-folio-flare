import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye, Download, Calendar } from "lucide-react";

// Mock data for demonstration
const mockProjects = [
  {
    id: 1,
    title: "AI-Powered Healthcare System",
    description: "A machine learning application for medical diagnosis assistance",
    student: "Ahmed Hassan",
    major: "Computer Science",
    date: "2024-01-15",
    views: 42,
    pdf: "healthcare-ai.pdf"
  },
  {
    id: 2,
    title: "Sustainable Energy Management",
    description: "IoT-based smart grid system for renewable energy optimization",
    student: "Sara Mohamed",
    major: "Engineering",
    date: "2024-01-10",
    views: 38,
    pdf: "energy-management.pdf"
  },
  {
    id: 3,
    title: "Digital Marketing Analytics",
    description: "Data-driven marketing campaign optimization platform",
    student: "Omar Khaled",
    major: "Business",
    date: "2024-01-08",
    views: 31,
    pdf: "marketing-analytics.pdf"
  }
];

const majors = ["All Majors", "Computer Science", "Engineering", "Business", "Medicine", "Arts"];

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("All Majors");

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.student.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMajor = selectedMajor === "All Majors" || project.major === selectedMajor;
    return matchesSearch && matchesMajor;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Student Projects
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore innovative projects created by HUE students across different majors
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects or students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              {majors.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="bg-hue-gold text-hue-dark-navy">
                    {project.major}
                  </Badge>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Eye className="h-4 w-4 mr-1" />
                    {project.views}
                  </div>
                </div>
                <CardTitle className="text-xl line-clamp-2">{project.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{project.student}</span>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(project.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="navy" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No projects found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;