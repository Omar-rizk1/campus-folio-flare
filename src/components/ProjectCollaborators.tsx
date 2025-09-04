import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type ProjectCollaborator = Tables<'project_collaborators'> & {
  profile: {
    full_name: string | null;
  } | null;
};

type CollaborationInvite = Tables<'collaboration_invites'>;

interface ProjectCollaboratorsProps {
  projectId: string;
  isOwner: boolean;
}

export const ProjectCollaborators: React.FC<ProjectCollaboratorsProps> = ({ projectId, isOwner }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');

  // Fetch collaborators with their profile information
  const { data: collaborators } = useQuery({
    queryKey: ['project-collaborators', projectId],
    queryFn: async () => {
      const { data: collaboratorData, error } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      
      if (!collaboratorData?.length) return [];
      
      // Fetch profiles for all collaborators
      const userIds = collaboratorData.map(c => c.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      if (profileError) {
        console.warn('Could not fetch profiles:', profileError);
      }
      
      // Merge profile data with collaborator data
      const collaboratorsWithProfiles = collaboratorData.map(collaborator => ({
        ...collaborator,
        profile: profileData?.find(p => p.user_id === collaborator.user_id) || null
      }));
      
      return collaboratorsWithProfiles;
    }
  });

  // Fetch pending invites
  const { data: invites } = useQuery({
    queryKey: ['collaboration-invites', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaboration_invites')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'pending');
      
      if (error) throw error;
      return data as CollaborationInvite[];
    },
    enabled: isOwner
  });

  // Send invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase
        .from('collaboration_invites')
        .insert({
          project_id: projectId,
          inviter_id: user!.id,
          invitee_email: email.toLowerCase().trim()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Invite sent successfully!' });
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['collaboration-invites', projectId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send invite',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Remove collaborator mutation
  const removeMutation = useMutation({
    mutationFn: async (collaboratorId: string) => {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collaboratorId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Collaborator removed successfully!' });
      queryClient.invalidateQueries({ queryKey: ['project-collaborators', projectId] });
    }
  });

  // Cancel invite mutation
  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('collaboration_invites')
        .delete()
        .eq('id', inviteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Invite cancelled successfully!' });
      queryClient.invalidateQueries({ queryKey: ['collaboration-invites', projectId] });
    }
  });

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    inviteMutation.mutate(inviteEmail);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Collaborators */}
        <div className="space-y-2">
          {collaborators?.map((collaborator) => {
            return (
              <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">
                      {collaborator.profile?.full_name || 'User'}
                    </p>
                    <Badge variant={collaborator.role === 'owner' ? 'default' : 'secondary'}>
                      {collaborator.role}
                    </Badge>
                  </div>
                </div>
                {isOwner && collaborator.role !== 'owner' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMutation.mutate(collaborator.id)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Pending Invites */}
        {isOwner && invites && invites.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-muted-foreground">Pending Invites</h4>
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{invite.invitee_email}</p>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelInviteMutation.mutate(invite.id)}
                  disabled={cancelInviteMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Invite New Collaborator */}
        {isOwner && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium text-muted-foreground">Invite Collaborator</h4>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendInvite()}
              />
              <Button
                onClick={handleSendInvite}
                disabled={inviteMutation.isPending || !inviteEmail.trim()}
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};