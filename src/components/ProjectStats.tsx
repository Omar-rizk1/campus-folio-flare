import { useState, useEffect } from 'react';
import { Star, Heart, MessageSquare, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface ProjectStatsProps {
  projectId?: string; // If provided, shows stats for specific project
  showTopProjects?: boolean; // If true, shows top-rated projects
}

interface ProjectStat {
  id: string;
  title: string;
  creator_name: string | null;
  averageRating: number;
  totalRatings: number;
  totalLikes: number;
  totalReviews: number;
}

export const ProjectStats = ({ projectId, showTopProjects = false }: ProjectStatsProps) => {
  const [stats, setStats] = useState<ProjectStat[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalRatings: 0,
    totalLikes: 0,
    totalReviews: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProjectStats();
    } else if (showTopProjects) {
      fetchTopProjects();
    } else {
      fetchOverallStats();
    }
  }, [projectId, showTopProjects]);

  const fetchProjectStats = async () => {
    if (!projectId) return;

    try {
      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('id, title, creator_name')
        .eq('id', projectId)
        .single();

      if (!project) return;

      // Get ratings
      const { data: ratings } = await supabase
        .from('project_ratings')
        .select('rating')
        .eq('project_id', projectId);

      // Get likes count
      const { data: likes } = await supabase
        .from('project_likes')
        .select('id')
        .eq('project_id', projectId);

      // Get reviews count
      const { data: reviews } = await supabase
        .from('project_reviews')
        .select('id')
        .eq('project_id', projectId);

      const totalRatings = ratings?.length || 0;
      const averageRating = totalRatings > 0 
        ? ratings!.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0;

      setStats([{
        id: project.id,
        title: project.title,
        creator_name: project.creator_name,
        averageRating,
        totalRatings,
        totalLikes: likes?.length || 0,
        totalReviews: reviews?.length || 0
      }]);
    } catch (error) {
      console.error('Error fetching project stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopProjects = async () => {
    try {
      // Get all projects with their stats
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, creator_name');

      if (!projects) return;

      const projectStats = await Promise.all(
        projects.map(async (project) => {
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
            id: project.id,
            title: project.title,
            creator_name: project.creator_name,
            averageRating,
            totalRatings,
            totalLikes: likesData.data?.length || 0,
            totalReviews: reviewsData.data?.length || 0
          };
        })
      );

      // Sort by average rating (min 3 ratings) then by total likes
      const topProjects = projectStats
        .filter(p => p.totalRatings >= 3 || p.totalLikes >= 5)
        .sort((a, b) => {
          if (a.averageRating !== b.averageRating) {
            return b.averageRating - a.averageRating;
          }
          return b.totalLikes - a.totalLikes;
        })
        .slice(0, 5);

      setStats(topProjects);
    } catch (error) {
      console.error('Error fetching top projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverallStats = async () => {
    try {
      const [ratingsData, likesData, reviewsData] = await Promise.all([
        supabase.from('project_ratings').select('rating'),
        supabase.from('project_likes').select('id'),
        supabase.from('project_reviews').select('id')
      ]);

      const totalRatings = ratingsData.data?.length || 0;
      const averageRating = totalRatings > 0 
        ? ratingsData.data!.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0;

      setOverallStats({
        totalRatings,
        totalLikes: likesData.data?.length || 0,
        totalReviews: reviewsData.data?.length || 0,
        averageRating
      });
    } catch (error) {
      console.error('Error fetching overall stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (projectId && stats.length > 0) {
    const stat = stats[0];
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-lg font-bold">{stat.averageRating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <MessageSquare className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-lg font-bold">{stat.totalRatings}</span>
              </div>
              <p className="text-xs text-muted-foreground">Ratings</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Heart className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-lg font-bold">{stat.totalLikes}</span>
              </div>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <MessageSquare className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-lg font-bold">{stat.totalReviews}</span>
              </div>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showTopProjects) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Rated Projects
          </CardTitle>
          <CardDescription>
            Projects with highest ratings and engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No projects have enough ratings yet.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.map((project, index) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{project.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {project.creator_name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      <span>{project.averageRating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-red-500" />
                      <span>{project.totalLikes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Star className="h-5 w-5 text-yellow-400 mr-1" />
            <span className="text-xl font-bold">{overallStats.averageRating.toFixed(1)}</span>
          </div>
          <p className="text-sm text-muted-foreground">Avg Rating</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <MessageSquare className="h-5 w-5 text-blue-500 mr-1" />
            <span className="text-xl font-bold">{overallStats.totalRatings}</span>
          </div>
          <p className="text-sm text-muted-foreground">Total Ratings</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Heart className="h-5 w-5 text-red-500 mr-1" />
            <span className="text-xl font-bold">{overallStats.totalLikes}</span>
          </div>
          <p className="text-sm text-muted-foreground">Total Likes</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <MessageSquare className="h-5 w-5 text-green-500 mr-1" />
            <span className="text-xl font-bold">{overallStats.totalReviews}</span>
          </div>
          <p className="text-sm text-muted-foreground">Total Reviews</p>
        </CardContent>
      </Card>
    </div>
  );
};