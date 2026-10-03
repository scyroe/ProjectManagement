import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

const invalidationKeysByTable = {
  clients: [
    ['clients'],
    ['calendar-projects'],
    ['task-form-options'],
    ['workspace-activity'],
  ],
  projects: [
    ['tasks'],
    ['clients'],
    ['calendar-projects'],
    ['task-form-options'],
    ['workspace-activity'],
    ['client-activity'],
  ],
  project_clients: [['clients'], ['calendar-projects'], ['client-activity']],
  tasks: [
    ['tasks'],
    ['clients'],
    ['task-history'],
    ['project-activity'],
    ['client-activity'],
  ],
  task_projects: [
    ['tasks'],
    ['clients'],
    ['project-activity'],
    ['client-activity'],
  ],
  task_states: [['tasks'], ['clients'], ['task-form-options']],
  task_history: [
    ['task-session'],
    ['task-history'],
    ['workspace-activity'],
    ['project-activity'],
    ['client-activity'],
  ],
  notifications: [['notifications']],
  profiles: [['profiles']],
  task_dependencies: [['task-dependencies']],
  project_milestones: [['project-milestones']],
  task_templates: [['task-templates'], ['task-form-options']],
};

export function useRealtimeSync() {
  const t = useStrings().layout.syncStatus;
  const [syncStatus, setSyncStatus] = useState(() =>
    navigator.onLine ? 'connecting' : 'offline',
  );

  useEffect(() => {
    const channel = supabase.channel('db-changes');
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

    for (const [table, queryKeys] of Object.entries(invalidationKeysByTable)) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => queueInvalidation(queryKeys),
      );
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
  }, [t.connectionError, t.offlineMessage, t.reconnecting]);

  return syncStatus;
}
