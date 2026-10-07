import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const taskSelect =
  'id,workspace_id,title,description,priority,due_date,estimate_minutes,recurrence_interval,recurrence_unit,recurrence_until,tags,assigned_to,state_id,project:projects!project_id(id,name,code,client_id,client:clients!client_id(id,name)),state:task_states(id,name,color,is_completed),linked_projects:task_projects(project:projects!project_id(id,name,code,client_id,client:clients!client_id(id,name)))';

export function useTaskDetails({ task, onUpdated }) {
  const t = useStrings().toasts.taskDetails;
  const queryClient = useQueryClient();
  const workspaceId = task.workspace_id;
  const [form, setForm] = useState(() => getFormValues(task));
  const [saving, setSaving] = useState(false);
  const [updatingCompletion, setUpdatingCompletion] = useState(false);
  const isDirty = !areFormValuesEqual(form, getFormValues(task));

  const {
    data: options,
    isLoading: loadingOptions,
    error: optionsError,
  } = useQuery({
    queryKey: ['task-form-options', workspaceId],
    queryFn: async () => {
      const [
        { data: projectData, error: projectError },
        { data: stateData, error: stateError },
        { data: profileData, error: profileError },
      ] = await Promise.all([
        supabase
          .from('projects')
          .select('id,name,code,client_id,client:clients!client_id(id,name)')
          .eq('workspace_id', workspaceId)
          .order('name'),
        supabase
          .from('task_states')
          .select('id,name,color,is_completed,sort_order')
          .eq('workspace_id', workspaceId)
          .order('sort_order'),
        supabase
          .from('workspace_members')
          .select(
            'profile:profiles!workspace_members_user_id_profiles_fkey(id,username,display_name)',
          )
          .eq('workspace_id', workspaceId),
      ]);

      if (projectError || stateError || profileError) {
        throw new Error(
          projectError?.message ?? stateError?.message ?? profileError?.message,
        );
      }
      return {
        profiles: (profileData ?? [])
          .map((member) => member.profile)
          .filter(Boolean),
        projects: projectData ?? [],
        taskStates: stateData ?? [],
      };
    },
    enabled: Boolean(workspaceId),
  });

  useEffect(() => {
    if (optionsError) {
      toast.error(t.loadOptionsError, { description: optionsError.message });
    }
  }, [optionsError, t]);

  const projects = options?.projects ?? [];
  const profiles = options?.profiles ?? [];
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
      const { data: dependencies, error: dependencyError } = await supabase
        .from('task_dependencies')
        .select('depends_on_task_id')
        .eq('task_id', task.id);
      if (dependencyError) {
        toast.error(t.dependencyCheckError, {
          description: dependencyError.message,
        });
        setUpdatingCompletion(false);
        return;
      }
      if (dependencies.length) {
        const { data: prerequisites, error: prerequisiteError } = await supabase
          .from('tasks')
          .select('title,state:task_states(is_completed)')
          .in(
            'id',
            dependencies.map((dependency) => dependency.depends_on_task_id),
          );
        if (prerequisiteError) {
          toast.error(t.dependencyCheckError, {
            description: prerequisiteError.message,
          });
          setUpdatingCompletion(false);
          return;
        }
        const incomplete = prerequisites.filter(
          (prerequisite) => !prerequisite.state?.is_completed,
        );
        if (incomplete.length) {
          toast.error(
            t.blockedByDependencies.replace(
              '{tasks}',
              incomplete.map((prerequisite) => prerequisite.title).join(', '),
            ),
          );
          setUpdatingCompletion(false);
          return;
        }
      }

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
    if (form.repeatUnit !== 'none' && !form.dueDate) {
      toast.error(t.recurrenceNeedsDate);
      return;
    }
    if (
      form.repeatUnit !== 'none' &&
      (!Number.isInteger(Number(form.repeatInterval)) ||
        Number(form.repeatInterval) < 1)
    ) {
      toast.error(t.recurrenceIntervalInvalid);
      return;
    }
    if (form.repeatUntil && form.repeatUntil < form.dueDate) {
      toast.error(t.recurrenceEndInvalid);
      return;
    }

    setSaving(true);

    const updates = {
      title,
      project_id: form.projectIds[0],
      description: form.description.trim() || null,
      priority: form.priority,
      due_date: form.dueDate || null,
      assigned_to: form.assignedTo === 'unassigned' ? null : form.assignedTo,
      estimate_minutes: form.estimateMinutes
        ? Number(form.estimateMinutes)
        : null,
      recurrence_interval:
        form.repeatUnit === 'none' ? null : Number(form.repeatInterval),
      recurrence_unit: form.repeatUnit === 'none' ? null : form.repeatUnit,
      recurrence_until:
        form.repeatUnit === 'none' ? null : form.repeatUntil || null,
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
    profiles,
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
  repeatInterval: task?.recurrence_interval?.toString() ?? '1',
  repeatUnit: task?.recurrence_unit ?? 'none',
  repeatUntil: task?.recurrence_until ?? '',
  assignedTo: task?.assigned_to ?? 'unassigned',
  tags: (task?.tags ?? []).join(', '),
});

const areFormValuesEqual = (current, initial) =>
  Object.keys(initial).every((field) =>
    field === 'projectIds'
      ? current.projectIds.length === initial.projectIds.length &&
        current.projectIds.every((id) => initial.projectIds.includes(id))
      : current[field] === initial[field],
  );
