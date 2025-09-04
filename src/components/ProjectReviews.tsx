import { useState, useEffect } from 'react';
import { MessageSquare, Edit2, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProjectReviewsProps {
  projectId: string;
  projectOwnerId: string;
}

interface Review {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  reviewer_name: string;
}

export const ProjectReviews = ({ projectId, projectOwnerId }: ProjectReviewsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editComment, setEditComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [projectId]);

  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('project_reviews')
        .select(`
          id,
          user_id,
          comment,
          created_at,
          updated_at
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get reviewer names from auth.users metadata or use email
      const reviewsWithNames = await Promise.all(
        (reviewsData || []).map(async (review) => {
          // For now, we'll use a placeholder name since we can't access profiles directly
          // In a real app, you might store reviewer names in the reviews table
          return {
            ...review,
            reviewer_name: 'Student' // Placeholder - could be improved by adding reviewer_name to reviews table
          };
        })
      );

      setReviews(reviewsWithNames);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to submit a review.",
        variant: "destructive"
      });
      return;
    }

    if (user.id === projectOwnerId) {
      toast({
        title: "Cannot review own project",
        description: "You cannot review your own project.",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Comment required",
        description: "Please write a comment for your review.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('project_reviews')
        .upsert({
          user_id: user.id,
          project_id: projectId,
          comment: newComment.trim()
        });

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: "Your review has been posted successfully.",
      });

      setNewComment('');
      setShowReviewForm(false);
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Review failed",
        description: "There was an error submitting your review.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReview = async (reviewId: string) => {
    if (!editComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('project_reviews')
        .update({ comment: editComment.trim() })
        .eq('id', reviewId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Review updated",
        description: "Your review has been updated successfully.",
      });

      setEditingReview(null);
      setEditComment('');
      fetchReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating your review.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('project_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Review deleted",
        description: "Your review has been deleted successfully.",
      });

      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting your review.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (review: Review) => {
    setEditingReview(review.id);
    setEditComment(review.comment);
  };

  const cancelEditing = () => {
    setEditingReview(null);
    setEditComment('');
  };

  const userReview = reviews.find(r => r.user_id === user?.id);
  const canAddReview = user && user.id !== projectOwnerId && !userReview;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reviews ({reviews.length})
        </h3>
        
        {canAddReview && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            Write Review
          </Button>
        )}
      </div>

      {/* Add Review Form */}
      {showReviewForm && canAddReview && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Share your thoughts about this project..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || !newComment.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No reviews yet. Be the first to review this project!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="bg-muted/30">
              <CardContent className="pt-4">
                {editingReview === review.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={cancelEditing}>
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleEditReview(review.id)}
                        disabled={isSubmitting || !editComment.trim()}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{review.reviewer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()} 
                          {review.updated_at !== review.created_at && ' (edited)'}
                        </p>
                      </div>
                      
                      {user?.id === review.user_id && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(review)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Review</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this review? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Review
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{review.comment}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};