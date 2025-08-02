import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload as UploadIcon, Image, Video, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const majors = [
  "Computer Science",
  "Engineering",
  "Business Administration",
  "Medicine",
  "Arts & Humanities",
  "Sciences",
  "Law",
  "Architecture"
];

const Upload = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    major: "",
    videoLink: "",
    file: null as File | null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG, GIF, or WebP).",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      setFormData(prev => ({
        ...prev,
        file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.major || !formData.file) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields and upload an image file.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload a project.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload image to Supabase storage
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, formData.file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      // Save project to database
      const { error: dbError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          department: formData.major,
          file_url: publicUrl,
          video_url: formData.videoLink || null
        });

      if (dbError) {
        throw dbError;
      }
      
      toast({
        title: "Project uploaded successfully!",
        description: "Your project has been submitted and is now visible in your profile.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        major: "",
        videoLink: "",
        file: null
      });
      
      // Reset file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Navigate to profile page
      navigate("/profile");

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Upload Your Project
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Share your innovative work with the HUE community
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="h-5 w-5 text-hue-navy" />
              Project Submission
            </CardTitle>
            <CardDescription>
              Please provide all the required information about your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter your project title"
                  required
                />
              </div>

              {/* Major */}
              <div className="space-y-2">
                <Label htmlFor="major">Major *</Label>
                <select
                  id="major"
                  name="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  required
                >
                  <option value="">Select your major</option>
                  {majors.map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your project, its objectives, methodology, and key findings..."
                  className="min-h-[120px]"
                  required
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Project Image *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Upload an image of your project (JPEG, PNG, GIF, or WebP - max 10MB)
                    </p>
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                  {formData.file && (
                    <p className="text-sm text-hue-navy mt-2 font-medium">
                      Selected: {formData.file.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Video Link (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="videoLink">Demo Video Link (Optional)</Label>
                <div className="flex items-start gap-2">
                  <Video className="h-5 w-5 text-muted-foreground mt-3" />
                  <div className="flex-1">
                    <Input
                      id="videoLink"
                      name="videoLink"
                      value={formData.videoLink}
                      onChange={handleInputChange}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Add a link to a video demonstration of your project
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-hue-navy flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Before submitting:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Ensure your image clearly shows your project</li>
                      <li>• Use high-quality images for better visibility</li>
                      <li>• Projects are immediately visible after upload</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                variant="hero"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Submit Project
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;