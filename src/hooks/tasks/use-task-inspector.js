import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const historySelect =
  'id,task_id,user_id,user_email,action,created_at,started_at,stopped_at,duration_minutes,note';

export function useTaskInspector(task) {
  const t = useStrings().toasts.taskInspector;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('details');
  const previousTaskId = useRef(task?.id);

  const historyQueryKey = ['task-history', task?.id];

  const { data: history = [], error: historyError } = useQuery({
    queryKey: historyQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_history')
        .select(historySelect)
        .eq('task_id', task.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: Boolean(task),
  });

  const { data: profiles = [], error: profilesError } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,username,display_name,weekly_capacity_minutes')
        .order('display_name');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (previousTaskId.current === task?.id) return;
    previousTaskId.current = task?.id;
    setTab('details');
  }, [task?.id]);

  useEffect(() => {
    if (historyError) {
      toast.error(t.loadHistoryError, { description: historyError.message });
    }
  }, [historyError, t]);

  useEffect(() => {
    if (profilesError) {
      toast.error(t.loadProfilesError, { description: profilesError.message });
    }
  }, [profilesError, t]);

  const addComment = async (note) => {
    const trimmedNote = note.trim();
    if (!trimmedNote) return false;
    const { data: authData } = await supabase.auth.getUser();
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
    queryClient.invalidateQueries({ queryKey: historyQueryKey });
    return true;
  };

  return { addComment, history, profiles, setTab, tab };
}
