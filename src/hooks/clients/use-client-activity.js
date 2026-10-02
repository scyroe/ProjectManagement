import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const historySelect =
  'id,task_id,user_id,user_email,action,note,started_at,stopped_at,duration_minutes,created_at,task:tasks!task_id(id,title)';

const emptyResult = { entries: [], projects: [], tasksByProject: {} };

export function useClientActivity({ clientId, enabled = true }) {
  const {
    data = emptyResult,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['client-activity', clientId],
    queryFn: async () => {
      const { data: projectLinks, error: projectError } = await supabase
        .from('project_clients')
        .select('project:projects!project_id(id,name,code)')
        .eq('client_id', clientId);
      if (projectError) throw new Error(projectError.message);

      const projectList = (projectLinks ?? [])
        .map((link) => link.project)
        .filter(Boolean);

      const projectIds = projectList.map((project) => project.id);
      if (!projectIds.length) {
        return { entries: [], projects: projectList, tasksByProject: {} };
      }

      const { data: taskLinks, error: taskError } = await supabase
        .from('task_projects')
        .select('project_id,task:tasks!task_id(id,title)')
        .in('project_id', projectIds);
      if (taskError) throw new Error(taskError.message);

      const grouped = {};
      const allTaskIds = new Set();
      for (const link of taskLinks ?? []) {
        if (!link.task) continue;
        grouped[link.project_id] = grouped[link.project_id] ?? [];
        grouped[link.project_id].push(link.task);
        allTaskIds.add(link.task.id);
      }

      const taskIds = Array.from(allTaskIds);
      if (!taskIds.length) {
        return { entries: [], projects: projectList, tasksByProject: grouped };
      }

      const { data: historyData, error: historyError } = await supabase
        .from('task_history')
        .select(historySelect)
        .in('task_id', taskIds)
        .order('created_at', { ascending: false });
      if (historyError) throw new Error(historyError.message);

      return {
        entries: historyData ?? [],
        projects: projectList,
        tasksByProject: grouped,
      };
    },
    enabled: enabled && Boolean(clientId),
  });

  const error = queryError?.message ?? '';

  return { ...data, error, loading };
}
