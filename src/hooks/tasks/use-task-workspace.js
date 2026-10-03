import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const tasksQueryKey = ['tasks'];
const taskSessionQueryKey = ['task-session'];
const workspaceActivityQueryKey = ['workspace-activity'];
const workspaceActivityPageSize = 100;

const taskSelect =
  'id,title,description,priority,due_date,estimate_minutes,tags,assigned_to,parent_task_id,state_id,project:projects!project_id(id,name,code,status,start_date,due_date,client_id,client:clients!client_id(id,name)),state:task_states(id,name,color,is_completed),linked_projects:task_projects(project:projects!project_id(id,name,code,status,start_date,due_date,client_id,client:clients!client_id(id,name)))';
const dayInMs = 24 * 60 * 60 * 1000;

const isDueSoon = (task, today, dueSoonEnd) => {
  if (!task.due_date || task.state?.is_completed) return false;
  const due = new Date(`${task.due_date}T00:00:00`);
  return due >= today && due <= dueSoonEnd;
};

const isOverdue = (task, today) => {
  if (!task.due_date || task.state?.is_completed) return false;
  return new Date(`${task.due_date}T00:00:00`) < today;
};

export function useTaskWorkspace({
  enabled = true,
  defaultTaskFilter = 'current',
  includeWorkspaceActivity = false,
  onMetricsChange,
  searchQuery,
  userId,
}) {
  const t = useStrings().toasts.taskWorkspace;
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(defaultTaskFilter);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [recentlyCreatedTaskId, setRecentlyCreatedTaskId] = useState(null);
  const clearRecentlyCreatedTask = useCallback((taskId) => {
    setRecentlyCreatedTaskId((currentTaskId) =>
      currentTaskId === taskId ? null : currentTaskId,
    );
  }, []);

  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksQueryError,
  } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: async () => {
      const { data, error: taskError } = await supabase
        .from('tasks')
        .select(taskSelect)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (taskError) throw new Error(taskError.message);
      return data ?? [];
    },
    enabled,
  });

  const {
    data: workspaceActivityPages,
    fetchNextPage: fetchNextWorkspaceActivityPage,
    hasNextPage: hasMoreWorkspaceActivity,
    isFetchingNextPage: workspaceActivityLoadingMore,
    isLoading: workspaceActivityLoading,
    error: workspaceActivityQueryError,
  } = useInfiniteQuery({
    queryKey: [...workspaceActivityQueryKey, userId],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('workspace_activity')
        .select(
          'id,task_id,user_email,action,note,started_at,duration_minutes,created_at,entity_type,entity_title,entity_detail,project_id',
        )
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(workspaceActivityPageSize);

      if (pageParam) {
        query = query.or(
          `created_at.lt.${pageParam.createdAt},and(created_at.eq.${pageParam.createdAt},id.lt.${pageParam.id})`,
        );
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < workspaceActivityPageSize) return undefined;
      const lastEntry = lastPage[lastPage.length - 1];
      return { createdAt: lastEntry.created_at, id: lastEntry.id };
    },
    enabled: enabled && includeWorkspaceActivity && Boolean(userId),
  });
  const workspaceActivity = useMemo(
    () => workspaceActivityPages?.pages.flat() ?? [],
    [workspaceActivityPages],
  );

  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionQueryError,
  } = useQuery({
    queryKey: taskSessionQueryKey,
    queryFn: async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error(t.signInToLoad);

      const [historyResponse, activeResponse] = await Promise.all([
        supabase
          .from('task_history')
          .select(
            'id,task_id,user_id,user_email,action,note,started_at,stopped_at,duration_minutes,created_at',
          )
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('task_history')
          .select('id,task_id')
          .eq('user_id', userData.user.id)
          .eq('action', 'started')
          .is('stopped_at', null)
          .order('created_at', { ascending: false })
          .maybeSingle(),
      ]);

      return {
        activity: historyResponse.data ?? [],
        runningHistoryId: activeResponse.data?.id ?? null,
        runningTaskId: activeResponse.data?.task_id ?? null,
      };
    },
    enabled,
  });

  const activity = session?.activity ?? [];
  const runningHistoryId = session?.runningHistoryId ?? null;
  const runningTaskId = session?.runningTaskId ?? null;
  const loading = tasksLoading || sessionLoading;
  const error = tasksQueryError?.message || sessionQueryError?.message || '';

  useEffect(() => {
    setFilter(defaultTaskFilter);
  }, [defaultTaskFilter]);

  const todayKey = new Date().setHours(0, 0, 0, 0);
  const filteredTasks = useMemo(() => {
    if (filter === 'completed')
      return tasks.filter((task) => task.state?.is_completed);
    if (filter === 'active')
      return tasks.filter((task) => task.id === runningTaskId);
    if (filter === 'due-soon') {
      const today = new Date(todayKey);
      const dueSoonEnd = new Date(today.getTime() + 7 * dayInMs);
      return tasks.filter((task) => isDueSoon(task, today, dueSoonEnd));
    }
    if (filter === 'overdue') {
      const today = new Date(todayKey);
      return tasks.filter((task) => isOverdue(task, today));
    }
    return tasks.filter((task) => !task.state?.is_completed);
  }, [filter, runningTaskId, tasks, todayKey]);

  const visibleTasks = useMemo(() => {
    const value = query.toLowerCase().trim();
    return value
      ? filteredTasks.filter((task) =>
          `${task.title} ${task.description ?? ''} ${task.project?.name ?? ''}`
            .toLowerCase()
            .includes(value),
        )
      : filteredTasks;
  }, [filteredTasks, query]);

  const searchResults = useMemo(() => {
    const value = (searchQuery ?? '').toLowerCase().trim();
    if (!value) return [];
    return tasks.filter((task) =>
      `${task.title} ${task.description ?? ''} ${task.project?.name ?? ''}`
        .toLowerCase()
        .includes(value),
    );
  }, [searchQuery, tasks]);

  const selected = useMemo(
    () => tasks.find((task) => task.id === selectedId) ?? tasks[0],
    [selectedId, tasks],
  );
  const completedCount = useMemo(
    () => tasks.filter((task) => task.state?.is_completed).length,
    [tasks],
  );

  useEffect(() => {
    onMetricsChange?.({
      currentCount: tasks.length - completedCount,
      completedCount,
      activeCount: runningTaskId ? 1 : 0,
    });
  }, [completedCount, onMetricsChange, runningTaskId, tasks.length]);

  const handleTaskUpdated = (updatedTask) => {
    queryClient.setQueryData(tasksQueryKey, (current = []) =>
      current.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
    if (updatedTask.state?.is_completed && runningTaskId === updatedTask.id) {
      queryClient.setQueryData(taskSessionQueryKey, (current) => ({
        ...current,
        runningTaskId: null,
        runningHistoryId: null,
      }));
      setHistoryVersion((version) => version + 1);
    }
  };

  const handleTaskCreated = (createdTask) => {
    setRecentlyCreatedTaskId(createdTask.id);
    queryClient.setQueryData(tasksQueryKey, (current = []) => [
      ...current,
      createdTask,
    ]);
    setSelectedId(createdTask.id);
    setFilter('current');
  };

  const handleProjectUpdated = (updatedProject) => {
    queryClient.setQueryData(tasksQueryKey, (current = []) =>
      current.map((task) =>
        task.project?.id === updatedProject.id
          ? { ...task, project: { ...task.project, ...updatedProject } }
          : task,
      ),
    );
  };

  const toggleTimer = async (task, note) => {
    const action = runningTaskId === task.id ? 'stopped' : 'started';
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      toast.error(t.signInToTrack);
      return;
    }

    if (action === 'started') {
      if (runningTaskId) {
        toast.error(t.stopActiveFirst);
        return;
      }
      const { data: inserted, error: insertError } = await supabase
        .from('task_history')
        .insert({
          task_id: task.id,
          user_id: data.user.id,
          user_email: data.user.email,
          action,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (insertError) {
        toast.error(t.startTaskError, {
          description: insertError.message,
        });
        return;
      }
      queryClient.setQueryData(taskSessionQueryKey, (current) => ({
        ...current,
        runningTaskId: task.id,
        runningHistoryId: inserted.id,
      }));
    } else {
      const { error: updateError } = await supabase
        .from('task_history')
        .update({
          action: 'stopped',
          note: note?.trim() || null,
          stopped_at: new Date().toISOString(),
        })
        .eq('id', runningHistoryId)
        .eq('user_id', data.user.id);
      if (updateError) {
        toast.error(t.stopTaskError, {
          description: updateError.message,
        });
        return;
      }
      const { error: commentError } = await supabase
        .from('task_history')
        .insert({
          task_id: task.id,
          user_id: data.user.id,
          user_email: data.user.email,
          action: 'commented',
          note: note.trim(),
        });
      if (commentError) {
        toast.error(t.addStopCommentError, {
          description: commentError.message,
        });
      }
      queryClient.setQueryData(taskSessionQueryKey, (current) => ({
        ...current,
        runningTaskId: null,
        runningHistoryId: null,
      }));
    }
    queryClient.invalidateQueries({ queryKey: taskSessionQueryKey });
    queryClient.invalidateQueries({ queryKey: ['task-history', task.id] });
    setHistoryVersion((version) => version + 1);
  };

  const updateTaskState = async (task, state) => {
    if (!state || task.state_id === state.id) return;
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ state_id: state.id })
      .eq('id', task.id);
    if (updateError) {
      toast.error(t.updateStatusError, {
        description: updateError.message,
      });
      return;
    }
    const updatedTask = {
      ...task,
      state_id: state.id,
      state,
    };
    handleTaskUpdated(updatedTask);
    toast.success(t.statusUpdated);
  };

  return {
    activity,
    workspaceActivity,
    workspaceActivityHasMore: Boolean(hasMoreWorkspaceActivity),
    workspaceActivityError: workspaceActivityQueryError?.message ?? '',
    workspaceActivityLoading,
    workspaceActivityLoadingMore,
    error,
    filter,
    handleTaskCreated,
    clearRecentlyCreatedTask,
    handleProjectUpdated,
    handleTaskUpdated,
    historyVersion,
    loadMoreWorkspaceActivity: fetchNextWorkspaceActivityPage,
    loading,
    query,
    recentlyCreatedTaskId,
    runningTaskId,
    searchResults,
    selected,
    setFilter,
    setQuery,
    setSelectedId,
    tasks,
    toggleTimer,
    updateTaskState,
    visibleTasks,
  };
}
