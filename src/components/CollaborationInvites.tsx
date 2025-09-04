import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type CollaborationInvite = Tables<'collaboration_invites'> & {
  projects: {
    title: string;
    creator_name: string | null;
    user_id: string;
  } | null;
};

export const CollaborationInvites: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's pending invites
  const { data: invites, isLoading } = useQuery({
    queryKey: ['my-collaboration-invites'],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const { data, error } = await supabase
        .from('collaboration_invites')
        .select(`
          *,
          projects!inner (
            title,
            creator_name,
            user_id
          )
        `)
        .eq('invitee_email', user.email)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      // Get creator profiles for projects without creator_name
      const projectsNeedingCreatorName = data?.filter(invite => 
        !invite.projects?.creator_name && invite.projects?.user_id
      ) || [];
      
      if (projectsNeedingCreatorName.length > 0) {
        const creatorIds = projectsNeedingCreatorName.map(invite => invite.projects?.user_id).filter(Boolean);
        const { data: creatorProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', creatorIds);
          
        // Merge creator names into the data
        data?.forEach(invite => {
          if (!invite.projects?.creator_name && invite.projects?.user_id) {
            const creatorProfile = creatorProfiles?.find(p => p.user_id === invite.projects?.user_id);
            if (creatorProfile?.full_name) {
              invite.projects.creator_name = creatorProfile.full_name;
            }
          }
        });
      }
      
      return data as CollaborationInvite[];
    },
    enabled: !!user?.email
  });

  // Accept invite mutation
  const acceptMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { data, error } = await supabase.rpc('accept_collaboration_invite', {
        invite_id: inviteId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Invite accepted! You are now a collaborator on this project.' });
      queryClient.invalidateQueries({ queryKey: ['my-collaboration-invites'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to accept invite',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Decline invite mutation
  const declineMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('collaboration_invites')
        .update({ status: 'declined' })
        .eq('id', inviteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Invite declined' });
      queryClient.invalidateQueries({ queryKey: ['my-collaboration-invites'] });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Collaboration Invites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading invites...</p>
        </CardContent>
      </Card>
    );
  }

  if (!invites || invites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Collaboration Invites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No pending invites</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Collaboration Invites
          <Badge variant="secondary">{invites.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {invites.map((invite) => (
          <div key={invite.id} className="p-4 border rounded-lg space-y-3">
            <div>
              <h4 className="font-medium">{invite.projects?.title}</h4>
              <p className="text-sm text-muted-foreground">
                Invited by {invite.projects?.creator_name || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(invite.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => acceptMutation.mutate(invite.id)}
                disabled={acceptMutation.isPending || declineMutation.isPending}
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => declineMutation.mutate(invite.id)}
                disabled={acceptMutation.isPending || declineMutation.isPending}
              >
                <X className="w-4 h-4 mr-1" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};