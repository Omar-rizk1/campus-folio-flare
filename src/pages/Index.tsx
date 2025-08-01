import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Upload, Search, Users, Award, BookOpen, TrendingUp } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Welcome to <span className="text-hue-gold">HUE Projects</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Showcase your innovative projects, discover amazing work from fellow students, 
            and contribute to the growing community at Horus University Egypt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gold" size="lg" className="text-lg px-8" asChild>
              <Link to="/upload">
                <Upload className="mr-2 h-5 w-5" />
                Upload Your Project
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 border-white text-white hover:bg-white hover:text-hue-navy" asChild>
              <Link to="/projects">
                <Search className="mr-2 h-5 w-5" />
                Explore Projects
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-hue-navy">HUE Projects</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The perfect platform for students to showcase their academic achievements and innovations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center shadow-elegant hover:shadow-gold transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-hue-gold rounded-full flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-hue-dark-navy" />
                </div>
                <CardTitle>Easy Project Upload</CardTitle>
                <CardDescription>
                  Upload your projects with detailed descriptions, PDFs, and optional demo videos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center shadow-elegant hover:shadow-gold transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-hue-gold rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-hue-dark-navy" />
                </div>
                <CardTitle>Community Collaboration</CardTitle>
                <CardDescription>
                  Connect with students across different majors and discover innovative projects
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center shadow-elegant hover:shadow-gold transition-all duration-300 hover:-translate-y-2">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-hue-gold rounded-full flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-hue-dark-navy" />
                </div>
                <CardTitle>Academic Recognition</CardTitle>
                <CardDescription>
                  Get recognized for your work with admin feedback and community engagement
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-hue-navy mb-2">127</div>
              <div className="text-muted-foreground">Total Projects</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-hue-navy mb-2">45</div>
              <div className="text-muted-foreground">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-hue-navy mb-2">8</div>
              <div className="text-muted-foreground">Academic Majors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-hue-navy mb-2">23</div>
              <div className="text-muted-foreground">This Month</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Share Your Innovation?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the HUE community and start showcasing your projects today
          </p>
          <Button variant="hero" size="lg" className="text-lg px-8" asChild>
            <Link to="/projects">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
