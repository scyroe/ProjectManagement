import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const historySelect =
  'id,task_id,user_id,user_email,action,created_at,started_at,stopped_at,duration_minutes,note';
const commentsSelect = 'id,task_id,user_id,user_email,action,created_at,note';
const initialHistoryPageSize = 10;
const additionalHistoryPageSize = 5;
const completeHistoryPageSize = 500;

function useTaskHistoryQuery({ task, tab, mode }) {
  const isComments = mode === 'comments';
  const loadCompleteHistory =
    !isComments && (tab === 'calendar' || tab === 'team');
  const action = isComments ? 'commented' : null;
  const queryKey = ['task-history', task?.id, mode];

  return useInfiniteQuery({
    queryKey,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const pageSize = pageParam?.pageSize ?? initialHistoryPageSize;
      let query = supabase
        .from('task_history')
        .select(isComments ? commentsSelect : historySelect)
        .eq('workspace_id', task.workspace_id)
        .eq('task_id', task.id)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(pageSize);

      if (action) query = query.eq('action', action);
      if (pageParam) {
        query = query.or(
          `created_at.lt.${pageParam.createdAt},and(created_at.eq.${pageParam.createdAt},id.lt.${pageParam.id})`,
        );
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const currentPageSize = lastPageParam?.pageSize ?? initialHistoryPageSize;
      if (lastPage.length < currentPageSize) return undefined;
      const lastEntry = lastPage[lastPage.length - 1];
      return {
        createdAt: lastEntry.created_at,
        id: lastEntry.id,
        pageSize: loadCompleteHistory
          ? completeHistoryPageSize
          : additionalHistoryPageSize,
      };
    },
    enabled: Boolean(
      task &&
        (isComments
          ? tab === 'comments'
          : ['calendar', 'activity', 'team'].includes(tab)),
    ),
  });
}

export function useTaskInspector(task) {
  const t = useStrings().toasts.taskInspector;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('details');
  const [visibleActivityCount, setVisibleActivityCount] = useState(
    initialHistoryPageSize,
  );
  const previousTaskId = useRef(task?.id);
  const historyLoadPending = useRef(false);
  const commentsLoadPending = useRef(false);
  const activeTab = previousTaskId.current === task?.id ? tab : 'details';
  const historyQuery = useTaskHistoryQuery({
    task,
    tab: activeTab,
    mode: 'timeline',
  });
  const commentsQuery = useTaskHistoryQuery({
    task,
    tab: activeTab,
    mode: 'comments',
  });
  const {
    data: profiles = [],
    error: profilesError,
    isLoading: profilesLoading,
  } = useQuery({
    queryKey: ['task-comment-profiles', task?.workspace_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(
          'profile:profiles!workspace_members_user_id_profiles_fkey(id,username,display_name)',
        )
        .eq('workspace_id', task.workspace_id);
      if (error) throw new Error(error.message);
      return (data ?? []).map((member) => member.profile).filter(Boolean);
    },
    enabled: Boolean(task && activeTab === 'comments'),
  });
  const history = historyQuery.data?.pages.flat() ?? [];
  const comments = commentsQuery.data?.pages.flat() ?? [];
  const activityHistory = history.slice(0, visibleActivityCount);
  const hasMoreActivity =
    visibleActivityCount < history.length || historyQuery.hasNextPage;
  const requiresCompleteHistory =
    activeTab === 'calendar' || activeTab === 'team';

  useEffect(() => {
    if (previousTaskId.current === task?.id) return;
    previousTaskId.current = task?.id;
    setTab('details');
    setVisibleActivityCount(initialHistoryPageSize);
  }, [task?.id]);

  useEffect(() => {
    if (historyQuery.error) {
      toast.error(t.loadHistoryError, {
        description: historyQuery.error.message,
      });
    }
  }, [historyQuery.error, t]);

  useEffect(() => {
    if (commentsQuery.error) {
      toast.error(t.loadHistoryError, {
        description: commentsQuery.error.message,
      });
    }
  }, [commentsQuery.error, t]);

  useEffect(() => {
    if (profilesError) {
      toast.error(t.loadProfilesError, { description: profilesError.message });
    }
  }, [profilesError, t]);

  useEffect(() => {
    if (!historyQuery.isFetchingNextPage) {
      historyLoadPending.current = false;
    }
  }, [historyQuery.isFetchingNextPage]);

  useEffect(() => {
    if (!commentsQuery.isFetchingNextPage) {
      commentsLoadPending.current = false;
    }
  }, [commentsQuery.isFetchingNextPage]);

  const loadMoreHistory = useCallback(() => {
    if (
      !historyQuery.hasNextPage ||
      historyQuery.isFetchingNextPage ||
      historyLoadPending.current
    ) {
      return;
    }
    historyLoadPending.current = true;
    historyQuery.fetchNextPage();
  }, [
    historyQuery.fetchNextPage,
    historyQuery.hasNextPage,
    historyQuery.isFetchingNextPage,
  ]);

  const loadMoreComments = useCallback(() => {
    if (
      !commentsQuery.hasNextPage ||
      commentsQuery.isFetchingNextPage ||
      commentsLoadPending.current
    ) {
      return;
    }
    commentsLoadPending.current = true;
    commentsQuery.fetchNextPage();
  }, [
    commentsQuery.fetchNextPage,
    commentsQuery.hasNextPage,
    commentsQuery.isFetchingNextPage,
  ]);

  const loadMoreActivity = useCallback(() => {
    if (historyQuery.isFetchingNextPage || historyLoadPending.current) return;

    if (visibleActivityCount < history.length) {
      setVisibleActivityCount((current) =>
        Math.min(current + additionalHistoryPageSize, history.length),
      );
      return;
    }

    if (!historyQuery.hasNextPage) return;
    setVisibleActivityCount((current) => current + additionalHistoryPageSize);
    loadMoreHistory();
  }, [
    history.length,
    historyQuery.hasNextPage,
    historyQuery.isFetchingNextPage,
    loadMoreHistory,
    visibleActivityCount,
  ]);

  useEffect(() => {
    if (
      requiresCompleteHistory &&
      historyQuery.hasNextPage &&
      !historyQuery.isFetchingNextPage &&
      !historyQuery.isFetchNextPageError
    ) {
      loadMoreHistory();
    }
  }, [
    historyQuery.hasNextPage,
    historyQuery.isFetchNextPageError,
    historyQuery.isFetchingNextPage,
    loadMoreHistory,
    requiresCompleteHistory,
  ]);

  const retryHistory = useCallback(() => {
    if (historyQuery.hasNextPage) {
      loadMoreHistory();
    } else {
      historyQuery.refetch();
    }
  }, [historyQuery.hasNextPage, historyQuery.refetch, loadMoreHistory]);

  const retryComments = useCallback(() => {
    if (commentsQuery.hasNextPage) {
      loadMoreComments();
    } else {
      commentsQuery.refetch();
    }
  }, [commentsQuery.hasNextPage, commentsQuery.refetch, loadMoreComments]);

  const addComment = async (note) => {
    const trimmedNote = note.trim();
    if (!trimmedNote) return false;
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      toast.error(t.signInToComment, { description: authError.message });
      return false;
    }
    if (!authData.user) {
      toast.error(t.signInToComment);
      return false;
    }
    const { error } = await supabase.from('task_history').insert({
      task_id: task.id,
      user_id: authData.user.id,
      user_email: authData.user.email,
      action: 'commented',
      note: trimmedNote,
    });
    if (error) {
      toast.error(t.addCommentError, { description: error.message });
      return false;
    }
    queryClient.invalidateQueries({ queryKey: ['task-history', task.id] });
    return true;
  };

  return {
    activityHistory,
    addComment,
    comments,
    commentsError: commentsQuery.error,
    commentsHasMore: commentsQuery.hasNextPage,
    commentsLoading: commentsQuery.isLoading,
    commentsLoadingMore: commentsQuery.isFetchingNextPage,
    hasMoreActivity,
    history,
    historyError: historyQuery.error,
    historyHasMore: historyQuery.hasNextPage,
    historyLoading: historyQuery.isLoading,
    historyLoadingMore: historyQuery.isFetchingNextPage,
    loadMoreActivity,
    loadMoreComments,
    loadMoreHistory,
    profiles,
    profilesLoading,
    requiresCompleteHistory,
    retryComments,
    retryHistory,
    setTab,
    tab: activeTab,
  };
}
