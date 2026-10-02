import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const projectsQueryKey = ['calendar-projects'];
const tasksQueryKey = ['tasks'];

export function useCalendar({ enabled = true } = {}) {
  const t = useStrings().calendarPage;
  const queryClient = useQueryClient();
  const {
    data: projects = [],
    isLoading: projectsLoading,
    error: projectsQueryError,
  } = useQuery({
    queryKey: projectsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(
          'id,name,code,status,start_date,due_date,client_id,client:clients!client_id(id,name),linked_clients:project_clients(client_id,client:clients(id,name))',
        )
        .order('name');

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
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });
      const previousTasks = queryClient.getQueryData(tasksQueryKey);
      queryClient.setQueryData(tasksQueryKey, (current = []) =>
        current.map((task) =>
          task.id === taskId ? { ...task, due_date: dueDate } : task,
        ),
      );
      return { previousTasks };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksQueryKey, context.previousTasks);
      }
      toast.error(t.scheduleError, { description: error.message });
    },
    onSuccess: () => toast.success(t.taskScheduled),
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  });

  return {
    error: projectsQueryError?.message ?? '',
    projects,
    projectsLoading,
    scheduleTask: (taskId, dueDate) =>
      scheduleMutation.mutate({ taskId, dueDate }),
    schedulingTaskId: scheduleMutation.isPending
      ? scheduleMutation.variables?.taskId
      : null,
  };
}
