import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const taskSelect =
  'id,title,description,priority,due_date,estimate_minutes,tags,assigned_to,parent_task_id,state_id,project:projects!project_id(id,name,code,client_id,client:clients!client_id(id,name)),state:task_states(id,name,color,is_completed)';

const emptyForm = (parentTask) => ({
  title: '',
  description: '',
  priority: 'medium',
  projectIds: parentTask?.project?.id ? [parentTask.project.id] : [],
  dueDate: '',
  estimateMinutes: '',
  tags: '',
});

export function useTaskForm({ onCreated, open, parentTask }) {
  const t = useStrings().toasts.taskForm;
  const [form, setForm] = useState(() => emptyForm(parentTask));
  const [projects, setProjects] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(emptyForm(parentTask));
  }, [open, parentTask]);

  useEffect(() => {
    if (!open) return;

    const loadOptions = async () => {
      setLoadingOptions(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id,name,code,client_id,client:clients!client_id(id,name)')
        .order('name');

      if (error) {
        toast.error(t.loadOptionsError, { description: error.message });
      } else {
        setProjects(data ?? []);
      }
      setLoadingOptions(false);
    };

    loadOptions();
  }, [open, t]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
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

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      toast.error(t.signInToCreate);
      setSaving(false);
      return;
    }

    const { data: stateData, error: stateError } = await supabase
      .from('task_states')
      .select('id')
      .eq('is_completed', false)
      .order('sort_order')
      .limit(1)
      .maybeSingle();

    if (stateError || !stateData) {
      toast.error(t.noSuitableState);
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
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
        state_id: stateData.id,
        parent_task_id: parentTask?.id ?? null,
        assigned_to: userData.user.id,
      })
      .select(taskSelect)
      .single();

    if (error) {
      toast.error(t.createTaskError, { description: error.message });
      setSaving(false);
      return;
    }

    const { error: linkError } = await supabase.from('task_projects').insert(
      form.projectIds.map((projectId) => ({
        task_id: data.id,
        project_id: projectId,
      })),
    );
    if (linkError) {
      toast.error(t.linkProjectsError, { description: linkError.message });
    }

    onCreated({
      ...data,
      linked_projects: form.projectIds.map((projectId) => ({
        project: projects.find((project) => project.id === projectId),
      })),
    });
    toast.success(parentTask ? t.subtaskCreated : t.taskCreated);
    setSaving(false);
  };

  return {
    form,
    handleSubmit,
    loadingOptions,
    projects,
    saving,
    updateField,
  };
}
