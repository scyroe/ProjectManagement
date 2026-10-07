import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const notificationsQueryKey = (userId, workspaceId) => [
  'notifications',
  userId,
  workspaceId,
];
const profileQueryKey = (userId) => ['profile', userId];
const dayInMs = 24 * 60 * 60 * 1000;

export function useNotifications({
  tasks,
  userId,
  enabled = true,
  workspaceId,
}) {
  const t = useStrings().layout.userPanel;
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: notificationsQueryKey(userId, workspaceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id,kind,title,body,task_id,read_at,created_at')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: Boolean(userId) && enabled,
    refetchInterval: 60_000,
  });

  const profileQuery = useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username,display_name,notification_preferences')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: Boolean(userId),
  });

  const reminderRows = useMemo(() => {
    if (!userId) return [];
    const now = new Date();
    const reminderEnd = new Date(now.getTime() + dayInMs);

    return tasks
      .filter((task) => {
        if (
          task.workspace_id !== workspaceId ||
          !task.due_date ||
          task.assigned_to !== userId ||
          task.state?.is_completed
        ) {
          return false;
        }
        const dueStart = new Date(`${task.due_date}T00:00:00`);
        const dueEnd = new Date(`${task.due_date}T23:59:59`);
        return dueStart <= reminderEnd || dueEnd < now;
      })
      .filter((task) => {
        const kind =
          new Date(`${task.due_date}T23:59:59`) < new Date()
            ? 'overdue'
            : 'reminder';
        return profileQuery.data?.notification_preferences?.[kind] !== false;
      })
      .map((task) => {
        const overdue = new Date(`${task.due_date}T23:59:59`) < new Date();
        return {
          recipient_id: userId,
          actor_id: userId,
          task_id: task.id,
          kind: overdue ? 'overdue' : 'reminder',
          title: overdue ? t.overdueReminderTitle : t.reminderTitle,
          body: `${task.title} · ${task.due_date}`,
          dedupe_key: `due:${task.id}:${task.due_date}`,
        };
      });
  }, [
    profileQuery.data?.notification_preferences,
    tasks,
    t.overdueReminderTitle,
    t.reminderTitle,
    userId,
    workspaceId,
  ]);

  useEffect(() => {
    if (!enabled || !profileQuery.isSuccess || !reminderRows.length) return;

    const createReminders = async () => {
      const { error } = await supabase
        .from('notifications')
        .upsert(reminderRows, {
          onConflict: 'recipient_id,dedupe_key',
          ignoreDuplicates: true,
        });
      if (error) {
        toast.error(t.reminderError, { description: error.message });
        return;
      }
      queryClient.invalidateQueries({
        queryKey: notificationsQueryKey(userId, workspaceId),
      });
    };

    createReminders();
  }, [
    enabled,
    profileQuery.isSuccess,
    queryClient,
    reminderRows,
    t.reminderError,
    userId,
    workspaceId,
  ]);

  useEffect(() => {
    if (notificationsQuery.error) {
      toast.error(t.loadError, {
        description: notificationsQuery.error.message,
      });
    }
  }, [notificationsQuery.error, t.loadError]);

  useEffect(() => {
    if (profileQuery.error) {
      toast.error(t.profileError, { description: profileQuery.error.message });
    }
  }, [profileQuery.error, t.profileError]);

  const markRead = async (notification) => {
    if (notification.read_at) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notification.id)
      .eq('recipient_id', userId);
    if (error) {
      toast.error(t.markReadError, { description: error.message });
      return;
    }
    queryClient.invalidateQueries({
      queryKey: notificationsQueryKey(userId, workspaceId),
    });
  };

  return {
    markRead,
    notifications: notificationsQuery.data ?? [],
    profile: profileQuery.data,
    unreadCount: (notificationsQuery.data ?? []).filter(
      (notification) => !notification.read_at,
    ).length,
  };
}
