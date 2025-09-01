import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload as UploadIcon, Image, Video, AlertCircle, Github, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
const majors = ["Dentistry", "Pharmacy", "Engineering", "Medicine", "Physical Therapy", "Business Administration", "Artificial Intelligence and Information", "Applied Health Sciences Technology", "Al_Alsun and Translation", "Fine Arts and Design"];
const Upload = () => {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    major: "",
    level: 0,
    videoLink: "",
    githubLink: "",
    files: [] as File[]
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    const validFiles: File[] = [];
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `File "${file.name}" is not supported. Please upload images, PDFs, or Office documents.`,
          variant: "destructive"
        });
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        toast({
          title: "File too large",
          description: `File "${file.name}" is too large. Please upload files smaller than 50MB.`,
          variant: "destructive"
        });
        continue;
      }
      validFiles.push(file);
    }
    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...validFiles]
      }));
    }
  };
  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.major || formData.files.length === 0) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields and upload at least one file.",
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
      // Upload all files to Supabase storage
      const uploadedFiles: string[] = [];
      let primaryFileUrl = "";
      for (let i = 0; i < formData.files.length; i++) {
        const file = formData.files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${i}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const {
          error: uploadError
        } = await supabase.storage.from('project-files').upload(filePath, file);
        if (uploadError) {
          throw uploadError;
        }

        // Get public URL for the uploaded file
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('project-files').getPublicUrl(filePath);
        uploadedFiles.push(publicUrl);

        // Set first uploaded file as primary file for backward compatibility
        if (i === 0) {
          primaryFileUrl = publicUrl;
        }
      }

      // Save project to database
      const {
        error: dbError
      } = await supabase.from('projects').insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        department: formData.major,
        level: formData.level,
        file_url: primaryFileUrl,
        // Backward compatibility
        files_urls: uploadedFiles,
        // New multiple files support
        video_url: formData.videoLink || null,
        github_url: formData.githubLink || null,
        creator_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown'
      });
      if (dbError) {
        throw dbError;
      }
      toast({
        title: "Project uploaded successfully!",
        description: "Your project has been submitted and is now visible in your profile."
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        major: "",
        level: 0,
        videoLink: "",
        githubLink: "",
        files: []
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
  return <div className="min-h-screen bg-background">
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
                <Input id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter your project title" required />
              </div>

              {/* Major */}
              <div className="space-y-2">
                <Label htmlFor="major">Major *</Label>
                <select id="major" name="major" value={formData.major} onChange={handleInputChange} className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground" required>
                  <option value="">Select your major</option>
                  {majors.map(major => <option key={major} value={major}>
                      {major}
                    </option>)}
                </select>
              </div>

              {/* Level */}
              <div className="space-y-2">
                <Label htmlFor="level">Level *</Label>
                <select id="level" name="level" value={formData.level} onChange={handleInputChange} className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground" required>
                  <option value={0}>Level 0</option>
                  <option value={1}>Level 1</option>
                  <option value={2}>Level 2</option>
                  <option value={3}>Level 3</option>
                  <option value={4}>Level 4</option>
                  <option value={5}>Level 5</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Project Description *</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe your project, its objectives, methodology, and key findings..." className="min-h-[120px]" required />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Project Files *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Upload project files (Images, PDFs, Documents - max 50MB each)
                    </p>
                    <Input id="file-upload" type="file" multiple accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" onChange={handleFileChange} className="max-w-xs mx-auto" />
                  </div>
                  {formData.files.length > 0 && <div className="mt-4 space-y-2">
                      <p className="text-sm text-hue-navy font-medium">
                        Selected files: {formData.files.length}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {formData.files.map((file, index) => <div key={index} className="bg-background border rounded-md px-2 py-1 text-xs flex items-center gap-1">
                            <span className="truncate max-w-[120px]">{file.name}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)} className="h-4 w-4 p-0 hover:bg-red-100">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>)}
                      </div>
                    </div>}
                </div>
              </div>

              {/* Video Link (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="videoLink">Demo Video Link (Optional)</Label>
                <div className="flex items-start gap-2">
                  <Video className="h-5 w-5 text-muted-foreground mt-3" />
                  <div className="flex-1">
                    <Input id="videoLink" name="videoLink" value={formData.videoLink} onChange={handleInputChange} placeholder="https://youtube.com/watch?v=..." />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Add a link to a video demonstration of your project
                    </p>
                  </div>
                </div>
              </div>

              {/* GitHub Link (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="githubLink">GitHub Repository Link (Optional)</Label>
                <div className="flex items-start gap-2">
                  <Github className="h-5 w-5 text-muted-foreground mt-3" />
                  <div className="flex-1">
                    <Input id="githubLink" name="githubLink" value={formData.githubLink} onChange={handleInputChange} placeholder="https://github.com/username/repository" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Add a link to your project's GitHub repository
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
                      <li>• Upload multiple files (images, PDFs, documents)</li>
                      <li>• Use high-quality files for better visibility</li>
                      <li>• Projects are immediately visible after upload</li>
                      <li>• Maximum file size: 50MB per file</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" variant="hero" disabled={isUploading}>
                {isUploading ? <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </> : <>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Submit Project
                  </>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Upload;