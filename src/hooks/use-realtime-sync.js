import { useEffect } from 'react';
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
};

export function useRealtimeSync() {
  useEffect(() => {
    const channel = supabase.channel('db-changes');
    const pendingQueryKeys = new Map();
    let invalidateTimeout;

    const queueInvalidation = (queryKeys) => {
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

    channel.subscribe();

    return () => {
      if (invalidateTimeout) window.clearTimeout(invalidateTimeout);
      supabase.removeChannel(channel);
    };
  }, []);
}
