import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const notificationsQueryKey = (userId, workspaceId) => [
  'notifications',
  userId,
  workspaceId,
  'pages',
];
const profileQueryKey = (userId) => ['profile', userId];
const dayInMs = 24 * 60 * 60 * 1000;
const initialNotificationPageSize = 10;
const additionalNotificationPageSize = 5;

export function useNotifications({
  tasks,
  userId,
  enabled = true,
  workspaceId,
}) {
  const t = useStrings().layout.userPanel;
  const queryClient = useQueryClient();
  const notificationBaseline = useRef(null);
  const notificationScope = `${userId ?? ''}:${workspaceId ?? ''}`;

  const notificationsQuery = useInfiniteQuery({
    queryKey: notificationsQueryKey(userId, workspaceId),
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const pageSize =
        pageParam === null
          ? initialNotificationPageSize
          : additionalNotificationPageSize;
      let query = supabase
        .from('notifications')
        .select('id,kind,title,body,task_id,read_at,created_at')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(pageSize);
      if (pageParam) {
        query = query.or(
          `created_at.lt.${pageParam.createdAt},and(created_at.eq.${pageParam.createdAt},id.lt.${pageParam.id})`,
        );
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    getNextPageParam: (lastPage, pages) => {
      const pageSize =
        pages.length === 1
          ? initialNotificationPageSize
          : additionalNotificationPageSize;
      if (lastPage.length < pageSize) return undefined;
      const lastNotification = lastPage[lastPage.length - 1];
      return {
        createdAt: lastNotification.created_at,
        id: lastNotification.id,
      };
    },
    enabled: Boolean(userId) && enabled,
    refetchInterval: (query) =>
      (query.state.data?.pages.length ?? 1) > 1 ? false : 60_000,
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

  useEffect(() => {
    if (!enabled || !userId || !workspaceId || !notificationsQuery.isSuccess) {
      return;
    }

    const latestNotifications = notificationsQuery.data?.pages[0] ?? [];
    const previous = notificationBaseline.current;
    const currentIds = new Set(
      latestNotifications.map((notification) => notification.id),
    );

    if (!previous || previous.scope !== notificationScope) {
      notificationBaseline.current = {
        scope: notificationScope,
        ids: currentIds,
      };
      return;
    }

    const newNotifications = latestNotifications.filter(
      (notification) =>
        !notification.read_at && !previous.ids.has(notification.id),
    );
    notificationBaseline.current = {
      scope: notificationScope,
      ids: currentIds,
    };

    if (document.visibilityState !== 'visible') return;

    for (const notification of newNotifications) {
      toast.info(t.notificationKinds[notification.kind] ?? notification.title, {
        description: notification.body ?? undefined,
      });
    }
  }, [
    enabled,
    notificationScope,
    notificationsQuery.data,
    notificationsQuery.isSuccess,
    t.notificationKinds,
    userId,
    workspaceId,
  ]);

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
          workspace_id: workspaceId,
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

  const notifications = useMemo(
    () => notificationsQuery.data?.pages.flat() ?? [],
    [notificationsQuery.data],
  );

  return {
    hasMoreNotifications: notificationsQuery.hasNextPage,
    loadMoreNotifications: notificationsQuery.fetchNextPage,
    loadingMoreNotifications: notificationsQuery.isFetchingNextPage,
    markRead,
    notifications,
    profile: profileQuery.data,
    unreadCount: notifications.filter((notification) => !notification.read_at)
      .length,
  };
}
