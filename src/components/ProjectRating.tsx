import { useState, useEffect } from 'react';
import { Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProjectRatingProps {
  projectId: string;
  projectOwnerId: string;
  onRatingUpdate?: () => void;
}

interface RatingData {
  averageRating: number;
  totalRatings: number;
  totalLikes: number;
  userRating: number | null;
  userLiked: boolean;
}

export const ProjectRating = ({ projectId, projectOwnerId, onRatingUpdate }: ProjectRatingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ratingData, setRatingData] = useState<RatingData>({
    averageRating: 0,
    totalRatings: 0,
    totalLikes: 0,
    userRating: null,
    userLiked: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    fetchRatingData();
  }, [projectId, user]);

  const fetchRatingData = async () => {
    try {
      // Get average rating and total ratings
      const { data: ratings } = await supabase
        .from('project_ratings')
        .select('rating')
        .eq('project_id', projectId);

      // Get total likes
      const { data: likes } = await supabase
        .from('project_likes')
        .select('id')
        .eq('project_id', projectId);

      // Get user's rating if logged in
      let userRating = null;
      let userLiked = false;
      if (user) {
        const { data: userRatingData } = await supabase
          .from('project_ratings')
          .select('rating')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: userLikeData } = await supabase
          .from('project_likes')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .maybeSingle();

        userRating = userRatingData?.rating || null;
        userLiked = !!userLikeData;
      }

      const totalRatings = ratings?.length || 0;
      const averageRating = totalRatings > 0 
        ? ratings!.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0;

      setRatingData({
        averageRating,
        totalRatings,
        totalLikes: likes?.length || 0,
        userRating,
        userLiked
      });
    } catch (error) {
      console.error('Error fetching rating data:', error);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to rate projects.",
        variant: "destructive"
      });
      return;
    }

    if (user.id === projectOwnerId) {
      toast({
        title: "Cannot rate own project",
        description: "You cannot rate your own project.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('project_ratings')
        .upsert({
          user_id: user.id,
          project_id: projectId,
          rating: rating
        });

      if (error) throw error;

      toast({
        title: "Rating submitted",
        description: `You rated this project ${rating} stars.`,
      });

      fetchRatingData();
      onRatingUpdate?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Rating failed",
        description: "There was an error submitting your rating.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to like projects.",
        variant: "destructive"
      });
      return;
    }

    if (user.id === projectOwnerId) {
      toast({
        title: "Cannot like own project",
        description: "You cannot like your own project.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (ratingData.userLiked) {
        // Unlike
        const { error } = await supabase
          .from('project_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('project_id', projectId);

        if (error) throw error;

        toast({
          title: "Like removed",
          description: "You unliked this project.",
        });
      } else {
        // Like
        const { error } = await supabase
          .from('project_likes')
          .insert({
            user_id: user.id,
            project_id: projectId
          });

        if (error) throw error;

        toast({
          title: "Project liked",
          description: "You liked this project!",
        });
      }

      fetchRatingData();
      onRatingUpdate?.();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Action failed",
        description: "There was an error processing your request.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canInteract = user && user.id !== projectOwnerId;

  return (
    <div className="space-y-3">
      {/* Rating Display */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-5 w-5 cursor-pointer transition-colors ${
                (hoveredRating || ratingData.averageRating) >= star
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              } ${canInteract ? 'hover:text-yellow-400' : 'cursor-default'}`}
              onMouseEnter={() => canInteract && setHoveredRating(star)}
              onMouseLeave={() => canInteract && setHoveredRating(0)}
              onClick={() => canInteract && !isSubmitting && handleRating(star)}
            />
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {ratingData.averageRating > 0 
              ? `${ratingData.averageRating.toFixed(1)} (${ratingData.totalRatings})` 
              : 'No ratings yet'
            }
          </span>
        </div>

        {/* Like Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 ${ratingData.userLiked ? 'text-red-500' : 'text-muted-foreground'} ${!canInteract ? 'cursor-default' : ''}`}
          onClick={canInteract ? handleLike : undefined}
          disabled={isSubmitting || !canInteract}
        >
          <Heart 
            className={`h-4 w-4 ${ratingData.userLiked ? 'fill-red-500' : ''}`}
          />
          <span className="text-xs">{ratingData.totalLikes}</span>
        </Button>
      </div>

      {/* User's Current Rating */}
      {ratingData.userRating && (
        <div className="text-xs text-muted-foreground">
          Your rating: {ratingData.userRating} stars
        </div>
      )}
    </div>
  );
};