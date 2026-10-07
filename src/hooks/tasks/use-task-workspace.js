import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const tasksQueryKey = (workspaceId) => ['tasks', workspaceId];
const taskSessionQueryKey = (userId, workspaceId) => [
  'task-session',
  userId,
  workspaceId,
];
const workspaceActivityQueryKey = ['workspace-activity'];
const workspaceActivityPageSize = 100;
const taskSearchPageSize = 50;
const taskPageSize = 250;

const taskSelect =
  'id,workspace_id,title,description,priority,due_date,estimate_minutes,recurrence_interval,recurrence_unit,recurrence_until,tags,assigned_to,parent_task_id,state_id,project:projects!project_id(id,name,code,status,start_date,due_date,client_id,client:clients!client_id(id,name)),state:task_states(id,name,color,sort_order,is_completed),linked_projects:task_projects(project:projects!project_id(id,name,code,status,start_date,due_date,client_id,client:clients!client_id(id,name)))';
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

const isDueThisWeekend = (task, today) => {
  if (!task.due_date || task.state?.is_completed) return false;
  const weekendStart = new Date(today);
  const daysUntilSaturday =
    today.getDay() === 0 ? -1 : (6 - today.getDay() + 7) % 7;
  weekendStart.setDate(weekendStart.getDate() + daysUntilSaturday);
  const nextMonday = new Date(weekendStart);
  nextMonday.setDate(nextMonday.getDate() + 2);
  const dueDate = new Date(`${task.due_date}T00:00:00`);
  return dueDate >= weekendStart && dueDate < nextMonday;
};

const getServerSearchText = (value = '') =>
  value
    .replace(/(?:^|\s)(status|priority|project|tag):(?:"([^"]+)"|(\S+))/gi, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 120);

const matchesSearchQuery = (task, rawQuery) => {
  const query = rawQuery.toLocaleLowerCase().trim();
  if (!query) return false;

  const filters = [];
  const textQuery = query.replace(
    /(?:^|\s)(status|priority|project|tag):(?:"([^"]+)"|(\S+))/gi,
    (_match, field, quotedValue, plainValue) => {
      filters.push([field.toLowerCase(), (quotedValue ?? plainValue).trim()]);
      return ' ';
    },
  );
  const linkedProjects = [
    task.project,
    ...(task.linked_projects ?? []).map((link) => link.project),
  ].filter(Boolean);
  const searchableText = [
    task.title,
    task.description,
    task.priority,
    task.state?.name,
    task.due_date,
    ...(task.tags ?? []),
    ...linkedProjects.flatMap((project) => [project.name, project.code]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();

  if (
    textQuery
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .some((term) => !searchableText.includes(term))
  ) {
    return false;
  }

  return filters.every(([field, value]) => {
    if (field === 'priority') return task.priority?.toLowerCase() === value;
    if (field === 'status')
      return task.state?.name?.toLocaleLowerCase().includes(value);
    if (field === 'tag')
      return (task.tags ?? []).some((tag) =>
        tag.toLocaleLowerCase().includes(value),
      );
    return linkedProjects.some((project) =>
      `${project.name} ${project.code ?? ''}`
        .toLocaleLowerCase()
        .includes(value),
    );
  });
};

export function useTaskWorkspace({
  enabled = true,
  defaultTaskFilter = 'current',
  includeWorkspaceActivity = false,
  loadAllTasks = true,
  loadSession = true,
  loadTasks = true,
  onMetricsChange,
  searchEnabled = true,
  searchQuery,
  userId,
  workspaceId,
}) {
  const t = useStrings().toasts.taskWorkspace;
  const queryClient = useQueryClient();
  const tasksKey = tasksQueryKey(workspaceId);
  const sessionKey = taskSessionQueryKey(userId, workspaceId);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(defaultTaskFilter);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [recentlyCreatedTaskId, setRecentlyCreatedTaskId] = useState(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(
    searchQuery ?? '',
  );
  const clearRecentlyCreatedTask = useCallback((taskId) => {
    setRecentlyCreatedTaskId((currentTaskId) =>
      currentTaskId === taskId ? null : currentTaskId,
    );
  }, []);
  useEffect(() => {
    const timeoutId = setTimeout(
      () => setDebouncedSearchQuery(searchQuery ?? ''),
      300,
    );
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const rawServerSearchText = getServerSearchText(searchQuery ?? '');
  const serverSearchText = getServerSearchText(debouncedSearchQuery);
  const searchSettling = rawServerSearchText !== serverSearchText;

  const {
    data: taskSearchPages,
    fetchNextPage: fetchNextSearchPage,
    hasNextPage: hasMoreSearchResults,
    isFetchingNextPage: searchLoadingMore,
    isLoading: searchLoading,
    error: searchQueryError,
  } = useInfiniteQuery({
    queryKey: ['task-search', workspaceId, serverSearchText],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const query = supabase
        .from('tasks')
        .select(taskSelect)
        .textSearch('search_document', serverSearchText, {
          type: 'websearch',
          config: 'simple',
        })
        .eq('workspace_id', workspaceId)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('id')
        .range(pageParam, pageParam + taskSearchPageSize - 1);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < taskSearchPageSize
        ? undefined
        : pages.length * taskSearchPageSize,
    enabled: Boolean(workspaceId && searchEnabled && serverSearchText),
  });

  const {
    data: taskPages,
    fetchNextPage: fetchNextTasksPage,
    hasNextPage: hasMoreTasks,
    isFetchingNextPage: tasksLoadingMore,
    isLoading: tasksLoading,
    error: tasksQueryError,
  } = useInfiniteQuery({
    queryKey: tasksKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error: taskError } = await supabase
        .from('tasks')
        .select(taskSelect)
        .eq('workspace_id', workspaceId)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('id')
        .range(pageParam, pageParam + taskPageSize - 1);
      if (taskError) throw new Error(taskError.message);
      return data ?? [];
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < taskPageSize ? undefined : pages.length * taskPageSize,
    enabled: enabled && loadTasks && Boolean(workspaceId),
  });
  const tasks = useMemo(() => taskPages?.pages.flat() ?? [], [taskPages]);

  const {
    data: workspaceActivityPages,
    fetchNextPage: fetchNextWorkspaceActivityPage,
    hasNextPage: hasMoreWorkspaceActivity,
    isFetchingNextPage: workspaceActivityLoadingMore,
    isLoading: workspaceActivityLoading,
    error: workspaceActivityQueryError,
  } = useInfiniteQuery({
    queryKey: [...workspaceActivityQueryKey, userId, workspaceId],
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
    enabled:
      enabled && includeWorkspaceActivity && Boolean(userId && workspaceId),
  });
  const workspaceActivity = useMemo(
    () => workspaceActivityPages?.pages.flat() ?? [],
    [workspaceActivityPages],
  );

  useEffect(() => {
    if (loadAllTasks && hasMoreTasks && !tasksLoadingMore) {
      fetchNextTasksPage();
    }
  }, [fetchNextTasksPage, hasMoreTasks, loadAllTasks, tasksLoadingMore]);

  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionQueryError,
  } = useQuery({
    queryKey: sessionKey,
    queryFn: async () => {
      const { data: activeTask, error: activeTaskError } = await supabase
        .from('task_history')
        .select('id,task_id,task:tasks!task_id(id,title)')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .eq('action', 'started')
        .is('stopped_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (activeTaskError) throw new Error(activeTaskError.message);

      return {
        activity: [],
        runningHistoryId: activeTask?.id ?? null,
        runningTaskId: activeTask?.task_id ?? null,
        runningTask: activeTask?.task ?? null,
      };
    },
    enabled: enabled && loadSession && Boolean(userId && workspaceId),
  });

  const activity = session?.activity ?? [];
  const runningHistoryId = session?.runningHistoryId ?? null;
  const runningTaskId = session?.runningTaskId ?? null;
  const runningTask = session?.runningTask ?? null;
  const loading =
    (loadTasks && (tasksLoading || (loadAllTasks && tasksLoadingMore))) ||
    (loadSession && sessionLoading);
  const error =
    (loadTasks && tasksQueryError?.message) ||
    (loadSession && sessionQueryError?.message) ||
    '';

  useEffect(() => {
    setFilter(defaultTaskFilter);
  }, [defaultTaskFilter]);

  const todayKey = new Date().setHours(0, 0, 0, 0);
  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    if (filter === 'completed')
      return tasks.filter((task) => task.state?.is_completed);
    if (filter === 'active')
      return tasks.filter((task) => task.id === runningTaskId);
    if (filter === 'due-weekend') {
      const today = new Date(todayKey);
      return tasks.filter((task) => isDueThisWeekend(task, today));
    }
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

  const localSearchResults = useMemo(() => {
    if (!(searchQuery ?? '').trim()) return [];
    return tasks.filter((task) => matchesSearchQuery(task, searchQuery));
  }, [searchQuery, tasks]);
  const searchResults = useMemo(() => {
    if (searchSettling) return [];
    if (!serverSearchText) return localSearchResults;
    return (taskSearchPages?.pages.flat() ?? []).filter((task) =>
      matchesSearchQuery(task, searchQuery),
    );
  }, [
    localSearchResults,
    searchQuery,
    searchSettling,
    serverSearchText,
    taskSearchPages,
  ]);

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
    queryClient.setQueryData(tasksKey, (current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page) =>
              page.map((task) =>
                task.id === updatedTask.id ? updatedTask : task,
              ),
            ),
          }
        : current,
    );
    if (updatedTask.state?.is_completed && runningTaskId === updatedTask.id) {
      queryClient.setQueryData(sessionKey, (current) => ({
        ...current,
        runningTaskId: null,
        runningHistoryId: null,
        runningTask: null,
      }));
      setHistoryVersion((version) => version + 1);
    }
  };

  const handleTaskCreated = (createdTask) => {
    setRecentlyCreatedTaskId(createdTask.id);
    queryClient.setQueryData(tasksKey, (current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page, index) =>
              index === 0 ? [...page, createdTask] : page,
            ),
          }
        : { pages: [[createdTask]], pageParams: [0] },
    );
    setSelectedId(createdTask.id);
    setFilter('current');
  };

  const handleProjectUpdated = (updatedProject) => {
    queryClient.setQueryData(tasksKey, (current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page) =>
              page.map((task) =>
                task.project?.id === updatedProject.id
                  ? { ...task, project: { ...task.project, ...updatedProject } }
                  : task,
              ),
            ),
          }
        : current,
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
      queryClient.setQueryData(sessionKey, (current) => ({
        ...current,
        runningTaskId: task.id,
        runningHistoryId: inserted.id,
        runningTask: { id: task.id, title: task.title },
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
      queryClient.setQueryData(sessionKey, (current) => ({
        ...current,
        runningTaskId: null,
        runningHistoryId: null,
        runningTask: null,
      }));
    }
    queryClient.invalidateQueries({ queryKey: sessionKey });
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
    loadMoreTasks: fetchNextTasksPage,
    hasMoreTasks: Boolean(hasMoreTasks),
    loadingMoreTasks: tasksLoadingMore,
    query,
    recentlyCreatedTaskId,
    runningTaskId,
    runningTask,
    searchResults,
    searchError: searchQueryError?.message ?? '',
    searchHasMore: Boolean(hasMoreSearchResults),
    searchLoading:
      (searchEnabled && searchSettling) || searchLoading || searchLoadingMore,
    loadMoreSearchResults: fetchNextSearchPage,
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
