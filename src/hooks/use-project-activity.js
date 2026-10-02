import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const historySelect =
  'id,task_id,user_id,user_email,action,note,started_at,stopped_at,duration_minutes,created_at,task:tasks!task_id(id,title)';

const emptyResult = { entries: [], tasks: [] };

export function useProjectActivity({ enabled = true, projectId }) {
  const {
    data = emptyResult,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['project-activity', projectId],
    queryFn: async () => {
      const { data: taskLinks, error: taskError } = await supabase
        .from('task_projects')
        .select('task:tasks!task_id(id,title)')
        .eq('project_id', projectId);
      if (taskError) throw new Error(taskError.message);

      const taskList = (taskLinks ?? [])
        .map((link) => link.task)
        .filter(Boolean);

      const taskIds = taskList.map((task) => task.id);
      if (!taskIds.length) {
        return { entries: [], tasks: taskList };
      }

      const { data: historyData, error: historyError } = await supabase
        .from('task_history')
        .select(historySelect)
        .in('task_id', taskIds)
        .order('created_at', { ascending: false });
      if (historyError) throw new Error(historyError.message);

      return { entries: historyData ?? [], tasks: taskList };
    },
    enabled: enabled && Boolean(projectId),
  });

  const error = queryError?.message ?? '';

  return { ...data, error, loading };
}
