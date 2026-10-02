import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const taskSelect =
  'id,title,description,priority,due_date,estimate_minutes,tags,assigned_to,state_id,project:projects!project_id(id,name,code,client_id,client:clients!client_id(id,name)),state:task_states(id,name,color,is_completed),linked_projects:task_projects(project:projects!project_id(id,name,code,client_id,client:clients!client_id(id,name)))';

const taskFormOptionsQueryKey = ['task-form-options'];

export function useTaskDetails({ task, onUpdated }) {
  const t = useStrings().toasts.taskDetails;
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => getFormValues(task));
  const [saving, setSaving] = useState(false);
  const [updatingCompletion, setUpdatingCompletion] = useState(false);
  const isDirty = !areFormValuesEqual(form, getFormValues(task));

  const {
    data: options,
    isLoading: loadingOptions,
    error: optionsError,
  } = useQuery({
    queryKey: taskFormOptionsQueryKey,
    queryFn: async () => {
      const [
        { data: projectData, error: projectError },
        { data: stateData, error: stateError },
      ] = await Promise.all([
        supabase
          .from('projects')
          .select('id,name,code,client_id,client:clients!client_id(id,name)')
          .order('name'),
        supabase
          .from('task_states')
          .select('id,name,color,is_completed,sort_order')
          .order('sort_order'),
      ]);

      if (projectError || stateError) {
        throw new Error(projectError?.message ?? stateError?.message);
      }
      return { projects: projectData ?? [], taskStates: stateData ?? [] };
    },
  });

  useEffect(() => {
    if (optionsError) {
      toast.error(t.loadOptionsError, { description: optionsError.message });
    }
  }, [optionsError, t]);

  const projects = options?.projects ?? [];
  const taskStates = options?.taskStates ?? [];

  useEffect(() => {
    setForm(getFormValues(task));
  }, [task]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCompletionToggle = async (note) => {
    const completionNote = note?.trim();
    if (!task.state?.is_completed && !completionNote) {
      toast.error(t.completionSummaryRequired);
      return;
    }
    const targetState = task.state?.is_completed
      ? (taskStates.find(
          (state) => !state.is_completed && state.name === 'Todo',
        ) ?? taskStates.find((state) => !state.is_completed))
      : taskStates.find((state) => state.is_completed);

    if (!targetState) {
      toast.error(t.noSuitableState);
      return;
    }

    setUpdatingCompletion(true);
    if (!task.state?.is_completed) {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast.error(t.signInToComplete);
        setUpdatingCompletion(false);
        return;
      }

      const { error: commentError } = await supabase
        .from('task_history')
        .insert({
          task_id: task.id,
          user_id: userData.user.id,
          user_email: userData.user.email,
          action: 'commented',
          note: completionNote,
        });
      if (commentError) {
        toast.error(t.addCompletionSummaryError, {
          description: commentError.message,
        });
        setUpdatingCompletion(false);
        return;
      }

      const { error: stopError } = await supabase
        .from('task_history')
        .update({ action: 'stopped', stopped_at: new Date().toISOString() })
        .eq('task_id', task.id)
        .eq('user_id', userData.user.id)
        .eq('action', 'started')
        .is('stopped_at', null);

      if (stopError) {
        toast.error(t.stopTimerError, {
          description: stopError.message,
        });
        setUpdatingCompletion(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ state_id: targetState.id })
      .eq('id', task.id)
      .select(taskSelect)
      .single();

    if (error) {
      toast.error(t.updateStatusError, {
        description: error.message,
      });
    } else {
      onUpdated(data);
      toast.success(data.state.is_completed ? t.taskCompleted : t.taskReopened);
      queryClient.invalidateQueries({ queryKey: ['task-history', task.id] });
    }
    setUpdatingCompletion(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      toast.error(t.titleRequired);
      return;
    }
    if (!form.projectIds.length) {
      toast.error(t.projectRequired);
      return;
    }

    setSaving(true);

    const updates = {
      title,
      project_id: form.projectIds[0],
      description: form.description.trim() || null,
      priority: form.priority,
      due_date: form.dueDate || null,
      estimate_minutes: form.estimateMinutes
        ? Number(form.estimateMinutes)
        : null,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id)
      .select(taskSelect)
      .single();

    if (error) {
      toast.error(t.updateTaskError, { description: error.message });
      setSaving(false);
      return;
    }

    const { error: unlinkError } = await supabase
      .from('task_projects')
      .delete()
      .eq('task_id', task.id);
    const { error: linkError } = unlinkError
      ? { error: unlinkError }
      : await supabase.from('task_projects').insert(
          form.projectIds.map((projectId) => ({
            task_id: task.id,
            project_id: projectId,
          })),
        );
    if (linkError) {
      toast.error(t.linkProjectsError, { description: linkError.message });
    }

    onUpdated({
      ...data,
      linked_projects: form.projectIds.map((projectId) => ({
        project: projects.find((project) => project.id === projectId),
      })),
    });
    toast.success(t.taskUpdated);
    setSaving(false);
  };

  return {
    form,
    handleCompletionToggle,
    handleSubmit,
    isDirty,
    loadingOptions,
    projects,
    saving,
    taskStates,
    updateField,
    updatingCompletion,
  };
}

const getFormValues = (task) => ({
  title: task?.title ?? '',
  description: task?.description ?? '',
  priority: task?.priority ?? 'medium',
  projectIds: task?.linked_projects?.length
    ? task.linked_projects.map((link) => link.project?.id).filter(Boolean)
    : task?.project?.id
      ? [task.project.id]
      : [],
  dueDate: task?.due_date ?? '',
  estimateMinutes: task?.estimate_minutes?.toString() ?? '',
  tags: (task?.tags ?? []).join(', '),
});

const areFormValuesEqual = (current, initial) =>
  Object.keys(initial).every((field) =>
    field === 'projectIds'
      ? current.projectIds.length === initial.projectIds.length &&
        current.projectIds.every((id) => initial.projectIds.includes(id))
      : current[field] === initial[field],
  );
