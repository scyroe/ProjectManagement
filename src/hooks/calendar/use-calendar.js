import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const projectsQueryKey = (workspaceId) => ['calendar-projects', workspaceId];
const milestonesQueryKey = (workspaceId) => [
  'calendar-milestones',
  workspaceId,
];
const tasksQueryKey = (workspaceId) => ['tasks', workspaceId];

export function useCalendar({ enabled = true, workspaceId } = {}) {
  const t = useStrings().calendarPage;
  const queryClient = useQueryClient();
  const projectKey = projectsQueryKey(workspaceId);
  const milestoneKey = milestonesQueryKey(workspaceId);
  const taskKey = tasksQueryKey(workspaceId);
  const {
    data: projects = [],
    isLoading: projectsLoading,
    error: projectsQueryError,
  } = useQuery({
    queryKey: projectKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(
          'id,name,code,status,start_date,due_date,client_id,client:clients!client_id(id,name),linked_clients:project_clients(client_id,client:clients(id,name))',
        )
        .eq('workspace_id', workspaceId)
        .order('name');

      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled,
  });
  const {
    data: milestones = [],
    isLoading: milestonesLoading,
    error: milestonesQueryError,
  } = useQuery({
    queryKey: milestoneKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('id,project_id,name,description,due_date,completed_at')
        .eq('workspace_id', workspaceId)
        .not('due_date', 'is', null)
        .order('due_date');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled,
  });

  const scheduleMutation = useMutation({
    mutationFn: async ({ taskId, dueDate }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ due_date: dueDate })
        .eq('id', taskId)
        .select('id,due_date')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onMutate: async ({ taskId, dueDate }) => {
      await queryClient.cancelQueries({ queryKey: taskKey });
      const previousTasks = queryClient.getQueryData(taskKey);
      queryClient.setQueryData(taskKey, (current) =>
        current
          ? {
              ...current,
              pages: current.pages.map((page) =>
                page.map((task) =>
                  task.id === taskId ? { ...task, due_date: dueDate } : task,
                ),
              ),
            }
          : current,
      );
      return { previousTasks };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKey, context.previousTasks);
      }
      toast.error(t.scheduleError, { description: error.message });
    },
    onSuccess: () => toast.success(t.taskScheduled),
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKey }),
  });

  return {
    error: projectsQueryError?.message ?? milestonesQueryError?.message ?? '',
    milestones,
    milestonesLoading,
    projects,
    projectsLoading,
    scheduleTask: (taskId, dueDate) =>
      scheduleMutation.mutate({ taskId, dueDate }),
    schedulingTaskId: scheduleMutation.isPending
      ? scheduleMutation.variables?.taskId
      : null,
  };
}
