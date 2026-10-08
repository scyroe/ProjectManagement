import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export function useWorkspaces(userId) {
  const queryClient = useQueryClient();
  const t = useStrings().workspaceManagement;
  const membershipsQuery = useQuery({
    queryKey: ['workspace-memberships', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(
          'workspace_id,user_id,role,workspace:workspaces!workspace_members_workspace_id_fkey(id,name,is_default)',
        )
        .eq('user_id', userId)
        .order('created_at');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const profileQuery = useQuery({
    queryKey: ['active-workspace', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('active_workspace_id,notification_preferences,digest_frequency')
        .eq('id', userId)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const memberships = membershipsQuery.data ?? [];
  const activeWorkspaceId = profileQuery.data?.active_workspace_id ?? null;
  const activeMembership =
    memberships.find(
      (membership) => membership.workspace_id === activeWorkspaceId,
    ) ??
    memberships[0] ??
    null;
  const invalidateWorkspaceQueries = useCallback(
    (workspaceIdToRefresh) =>
      Promise.all(
        [
          ['tasks', workspaceIdToRefresh],
          ['task-search', workspaceIdToRefresh],
          ['task-session', userId, workspaceIdToRefresh],
          ['clients', workspaceIdToRefresh],
          ['project-form-clients', workspaceIdToRefresh],
          ['calendar-projects', workspaceIdToRefresh],
          ['calendar-milestones', workspaceIdToRefresh],
          ['dashboard-summary', workspaceIdToRefresh],
          ['task-form-projects', workspaceIdToRefresh],
          ['task-form-profiles', workspaceIdToRefresh],
          ['task-templates', workspaceIdToRefresh],
          ['team-workload', workspaceIdToRefresh],
          ['notification-reminder-candidates', userId, workspaceIdToRefresh],
          ['notifications', userId, workspaceIdToRefresh],
          ['workspace-activity', userId, workspaceIdToRefresh],
          ['workspace-members', workspaceIdToRefresh],
          ['work-log', workspaceIdToRefresh],
          ['workspace-automations', workspaceIdToRefresh],
          ['project-templates', workspaceIdToRefresh],
          ['task-form-options', workspaceIdToRefresh],
          ['task-history'],
          ['task-dependencies'],
          ['project-activity'],
          ['client-activity'],
          ['profiles'],
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
    [queryClient, userId],
  );

  const handleWorkspaceChange = useCallback(
    async (workspaceId) => {
      if (
        !memberships.some(
          (membership) => membership.workspace_id === workspaceId,
        )
      ) {
        toast.error(t.switchError);
        return;
      }
      const { error } = await supabase
        .from('profiles')
        .update({ active_workspace_id: workspaceId })
        .eq('id', userId);
      if (error) {
        toast.error(t.switchError, { description: error.message });
        return;
      }
      queryClient.setQueryData(['active-workspace', userId], (current) => ({
        ...current,
        active_workspace_id: workspaceId,
      }));
      await invalidateWorkspaceQueries(workspaceId);
    },
    [
      invalidateWorkspaceQueries,
      memberships,
      queryClient,
      t.switchError,
      userId,
    ],
  );

  useEffect(() => {
    if (!profileQuery.isSuccess || !memberships.length) return;
    if (
      memberships.some(
        (membership) =>
          membership.workspace_id === profileQuery.data.active_workspace_id,
      )
    ) {
      return;
    }
    handleWorkspaceChange(memberships[0].workspace_id);
  }, [
    memberships,
    handleWorkspaceChange,
    profileQuery.data?.active_workspace_id,
    profileQuery.isSuccess,
  ]);

  const handleCreateWorkspace = async (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      toast.error(t.createError, { description: authError.message });
      return false;
    }
    if (!user) {
      toast.error(t.createError, { description: t.sessionRequired });
      return false;
    }
    if (user.id !== userId) {
      toast.error(t.createError, { description: t.sessionChanged });
      return false;
    }
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert({ name: trimmedName, owner_id: user.id })
      .select('id')
      .single();
    if (error) {
      toast.error(t.createError, { description: error.message });
      return false;
    }
    const { error: selectError } = await supabase
      .from('profiles')
      .update({ active_workspace_id: workspace.id })
      .eq('id', user.id);
    if (selectError) {
      toast.error(t.createError, { description: selectError.message });
      await queryClient.invalidateQueries({
        queryKey: ['active-workspace', user.id],
      });
      return false;
    }
    queryClient.setQueryData(['active-workspace', user.id], (current) => ({
      ...current,
      active_workspace_id: workspace.id,
    }));
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['workspace-memberships', user.id],
      }),
      invalidateWorkspaceQueries(workspace.id),
    ]);
    toast.success(t.created);
    return true;
  };

  const handleUpdateNotificationPreferences = async (values) => {
    const { error } = await supabase
      .from('profiles')
      .update(values)
      .eq('id', userId);
    if (error) {
      toast.error(t.preferencesError, { description: error.message });
      return false;
    }
    await queryClient.invalidateQueries({
      queryKey: ['active-workspace', userId],
    });
    return true;
  };

  const handleAddMember = async (username, role) => {
    const { data: profiles, error: profileError } = await supabase.rpc(
      'find_workspace_user',
      { target_username: username.trim() },
    );
    if (profileError) {
      toast.error(t.memberError, { description: profileError.message });
      return false;
    }
    const profile = profiles?.[0];
    if (!profile) {
      toast.error(t.memberNotFound);
      return false;
    }
    const { error } = await supabase.from('workspace_members').insert({
      workspace_id: activeMembership?.workspace_id,
      user_id: profile.id,
      role,
    });
    if (error) {
      toast.error(t.memberError, { description: error.message });
      return false;
    }
    await queryClient.invalidateQueries({
      queryKey: ['workspace-members', activeMembership?.workspace_id],
    });
    toast.success(t.memberAdded);
    return true;
  };

  const membersQuery = useQuery({
    queryKey: ['workspace-members', activeMembership?.workspace_id],
    enabled: Boolean(activeMembership?.workspace_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(
          'user_id,role,created_at,profile:profiles!workspace_members_user_id_profiles_fkey(username,display_name,weekly_capacity_minutes)',
        )
        .eq('workspace_id', activeMembership.workspace_id)
        .order('created_at');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const error =
    membershipsQuery.error ?? profileQuery.error ?? membersQuery.error;
  const isReady = !membershipsQuery.isLoading && !profileQuery.isLoading;
  useEffect(() => {
    if (error) toast.error(t.loadError, { description: error.message });
  }, [error, t.loadError]);

  const handleUpdateMemberRole = async (userIdToUpdate, role) => {
    const { error } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', activeMembership?.workspace_id)
      .eq('user_id', userIdToUpdate);
    if (error) {
      toast.error(t.memberError, { description: error.message });
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: ['workspace-members', activeMembership?.workspace_id],
    });
  };

  const handleUpdateMemberProfile = async ({
    userId,
    displayName,
    weeklyCapacityMinutes,
  }) => {
    const workspaceId = activeMembership?.workspace_id;
    if (!workspaceId) {
      toast.error(t.membersPage.profileUpdateError);
      return false;
    }
    const { error } = await supabase.rpc('update_workspace_member_profile', {
      p_workspace_id: workspaceId,
      p_user_id: userId,
      p_display_name: displayName.trim(),
      p_weekly_capacity_minutes: weeklyCapacityMinutes,
    });
    if (error) {
      toast.error(t.membersPage.profileUpdateError, {
        description: error.message,
      });
      return false;
    }
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['workspace-members', workspaceId],
      }),
      queryClient.invalidateQueries({ queryKey: ['profiles'] }),
    ]);
    toast.success(t.membersPage.profileUpdated);
    return true;
  };

  const handleRemoveMember = async (userIdToRemove) => {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', activeMembership?.workspace_id)
      .eq('user_id', userIdToRemove);
    if (error) {
      toast.error(t.memberError, { description: error.message });
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: ['workspace-members', activeMembership?.workspace_id],
    });
  };

  return {
    activeMembership,
    activeWorkspace: activeMembership?.workspace ?? null,
    activeWorkspaceId: activeMembership?.workspace_id ?? null,
    canManageMembers: ['owner', 'admin'].includes(activeMembership?.role),
    createWorkspace: handleCreateWorkspace,
    digestFrequency: profileQuery.data?.digest_frequency ?? 'off',
    error,
    handleAddMember,
    handleRemoveMember,
    handleUpdateMemberProfile,
    handleUpdateMemberRole,
    memberships,
    members: membersQuery.data ?? [],
    membersLoading: membersQuery.isLoading,
    notificationPreferences: profileQuery.data?.notification_preferences ?? {},
    isReady,
    setActiveWorkspace: handleWorkspaceChange,
    strings: t,
    updateNotificationPreferences: handleUpdateNotificationPreferences,
  };
}
