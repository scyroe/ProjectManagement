import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

const workspaceScopedTables = {
  clients: [
    ['clients'],
    ['project-form-clients'],
    ['calendar-projects'],
    ['task-form-projects'],
    ['task-form-options'],
    ['workspace-activity'],
  ],
  projects: [
    ['tasks'],
    ['clients'],
    ['calendar-projects'],
    ['task-form-projects'],
    ['task-form-options'],
    ['workspace-activity'],
    ['client-activity'],
    ['dashboard-summary'],
    ['team-workload'],
  ],
  tasks: [
    ['tasks'],
    ['clients'],
    ['task-history'],
    ['project-activity'],
    ['client-activity'],
    ['task-session'],
    ['work-log'],
    ['workspace-activity'],
    ['dashboard-summary'],
    ['team-workload'],
    ['notification-reminder-candidates'],
  ],
  task_states: [
    ['tasks'],
    ['clients'],
    ['task-form-options'],
    ['dashboard-summary'],
    ['team-workload'],
    ['notification-reminder-candidates'],
  ],
  task_history: [
    ['task-session'],
    ['task-history'],
    ['work-log'],
    ['workspace-activity'],
    ['project-activity'],
    ['client-activity'],
    ['dashboard-summary'],
  ],
  project_clients: [['clients'], ['calendar-projects'], ['client-activity']],
  task_projects: [
    ['tasks'],
    ['clients'],
    ['project-activity'],
    ['client-activity'],
    ['dashboard-summary'],
  ],
  task_dependencies: [['task-dependencies']],
  project_milestones: [['calendar-milestones']],
  task_templates: [['task-templates']],
  project_templates: [['project-templates']],
  workspace_members: [
    ['workspace-members'],
    ['task-form-profiles'],
    ['task-form-options'],
    ['profiles'],
    ['workspace-memberships'],
  ],
  workspace_automations: [['workspace-automations']],
};

const userScopedTables = {
  notifications: [['notifications']],
  profiles: [
    ['profile'],
    ['profiles'],
    ['active-workspace'],
    ['task-form-profiles'],
  ],
};

const getScopedQueryKeys = (queryKeys, workspaceId, userId) =>
  queryKeys.flatMap((queryKey) => {
    const [key] = queryKey;
    if (key === 'notifications') return [[key, userId]];
    if (
      key === 'workspace-activity' ||
      key === 'task-session' ||
      key === 'notifications' ||
      key === 'notification-reminder-candidates'
    ) {
      return [[key, userId, workspaceId]];
    }
    if (
      key === 'workspace-memberships' ||
      key === 'profile' ||
      key === 'active-workspace'
    ) {
      return [[key, userId]];
    }
    if (
      key === 'task-history' ||
      key === 'project-activity' ||
      key === 'client-activity' ||
      key === 'task-dependencies'
    ) {
      return [queryKey];
    }
    if (key === 'task-templates') {
      return workspaceId ? [[key, workspaceId]] : [queryKey];
    }
    if (key === 'profiles') {
      return workspaceId ? [[key, workspaceId], queryKey] : [queryKey];
    }
    return workspaceId ? [[...queryKey, workspaceId]] : [queryKey];
  });

export function useRealtimeSync({ userId, workspaceId } = {}) {
  const t = useStrings().layout.syncStatus;
  const [syncStatus, setSyncStatus] = useState(() =>
    navigator.onLine ? 'connecting' : 'offline',
  );

  useEffect(() => {
    const channel = supabase.channel(
      `db-changes-${userId ?? 'none'}-${workspaceId ?? 'none'}`,
    );
    const pendingQueryKeys = new Map();
    let invalidateTimeout;
    let failureReported = false;
    let disposed = false;

    const queueInvalidation = (queryKeys) => {
      if (disposed) return;
      for (const queryKey of queryKeys) {
        pendingQueryKeys.set(JSON.stringify(queryKey), queryKey);
      }

      if (invalidateTimeout) return;
      invalidateTimeout = window.setTimeout(() => {
        for (const queryKey of pendingQueryKeys.values()) {
          queryClient.invalidateQueries({ queryKey });
        }
        pendingQueryKeys.clear();
        invalidateTimeout = undefined;
      }, 50);
    };

    if (workspaceId) {
      for (const [table, queryKeys] of Object.entries(workspaceScopedTables)) {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: `workspace_id=eq.${workspaceId}`,
          },
          () =>
            queueInvalidation(
              getScopedQueryKeys(queryKeys, workspaceId, userId),
            ),
        );
      }
    }

    if (userId) {
      for (const [table, queryKeys] of Object.entries(userScopedTables)) {
        const config = { event: '*', schema: 'public', table };
        if (table === 'notifications') {
          config.filter = `recipient_id=eq.${userId}`;
        }
        channel.on('postgres_changes', config, () =>
          queueInvalidation(getScopedQueryKeys(queryKeys, workspaceId, userId)),
        );
      }
    }

    channel.subscribe((status, error) => {
      if (disposed) return;
      if (!navigator.onLine) {
        setSyncStatus('offline');
        return;
      }
      if (status === 'SUBSCRIBED') {
        setSyncStatus('connected');
        failureReported = false;
      } else if (
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT' ||
        status === 'CLOSED'
      ) {
        setSyncStatus('error');
        if (!failureReported) {
          toast.error(t.connectionError, {
            description: error?.message ?? status,
          });
          failureReported = true;
        }
      } else {
        setSyncStatus('connecting');
      }
    });

    const handleOffline = () => {
      setSyncStatus('offline');
      toast.warning(t.offlineMessage);
    };
    const handleOnline = () => {
      setSyncStatus('connecting');
      toast.message(t.reconnecting);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      disposed = true;
      if (invalidateTimeout) window.clearTimeout(invalidateTimeout);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      supabase.removeChannel(channel);
    };
  }, [
    t.connectionError,
    t.offlineMessage,
    t.reconnecting,
    userId,
    workspaceId,
  ]);

  return syncStatus;
}
