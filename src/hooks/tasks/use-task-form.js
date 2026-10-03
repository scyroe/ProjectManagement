import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const taskSelect =
  'id,title,description,priority,due_date,estimate_minutes,recurrence_interval,recurrence_unit,recurrence_until,tags,assigned_to,parent_task_id,state_id,project:projects!project_id(id,name,code,client_id,client:clients!client_id(id,name)),state:task_states(id,name,color,is_completed)';

const emptyForm = (parentTask, initialProjectId) => ({
  title: '',
  description: '',
  priority: 'medium',
  projectIds: parentTask?.project?.id
    ? [parentTask.project.id]
    : initialProjectId
      ? [initialProjectId]
      : [],
  dueDate: '',
  estimateMinutes: '',
  repeatInterval: '1',
  repeatUnit: 'none',
  repeatUntil: '',
  assignedTo: parentTask?.assigned_to ?? 'me',
  tags: '',
});

export function useTaskForm({
  initialProjectId,
  onCreated,
  onStartTask,
  open,
  parentTask,
}) {
  const t = useStrings().toasts.taskForm;
  const [form, setForm] = useState(() =>
    emptyForm(parentTask, initialProjectId),
  );
  const [projects, setProjects] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    if (open) setForm(emptyForm(parentTask, initialProjectId));
  }, [initialProjectId, open, parentTask]);

  useEffect(() => {
    if (!open) return;

    const loadOptions = async () => {
      setLoadingOptions(true);
      const [projectResponse, templateResponse, profilesResponse] =
        await Promise.all([
          supabase
            .from('projects')
            .select('id,name,code,client_id,client:clients!client_id(id,name)')
            .order('name'),
          supabase
            .from('task_templates')
            .select('id,name,template')
            .order('name'),
          supabase
            .from('profiles')
            .select('id,username,display_name')
            .order('display_name'),
        ]);

      if (projectResponse.error) {
        toast.error(t.loadOptionsError, {
          description: projectResponse.error.message,
        });
      } else {
        setProjects(projectResponse.data ?? []);
      }
      if (templateResponse.error) {
        toast.error(t.loadTemplatesError, {
          description: templateResponse.error.message,
        });
      } else {
        setTemplates(templateResponse.data ?? []);
      }
      if (profilesResponse.error) {
        toast.error(t.loadProfilesError, {
          description: profilesResponse.error.message,
        });
      } else {
        setProfiles(profilesResponse.data ?? []);
      }
      setLoadingOptions(false);
    };

    loadOptions();
  }, [open, t]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const applyTemplate = (templateId) => {
    const template = templates.find((item) => item.id === templateId)?.template;
    if (!template || typeof template !== 'object') return;
    setForm((current) => ({
      ...current,
      title: template.title ?? current.title,
      description: template.description ?? '',
      priority: template.priority ?? 'medium',
      estimateMinutes: template.estimateMinutes ?? '',
      repeatInterval: template.repeatInterval ?? '1',
      repeatUnit: template.repeatUnit ?? 'none',
      repeatUntil: '',
      tags: template.tags ?? '',
    }));
  };

  const handleSaveTemplate = async () => {
    const name = templateName.trim();
    if (!name) {
      toast.error(t.templateNameRequired);
      return;
    }
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      toast.error(t.signInToCreate);
      return;
    }

    setSavingTemplate(true);
    const { data, error } = await supabase
      .from('task_templates')
      .insert({
        name,
        created_by: userData.user.id,
        template: {
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          estimateMinutes: form.estimateMinutes,
          repeatInterval: form.repeatInterval,
          repeatUnit: form.repeatUnit,
          tags: form.tags,
        },
      })
      .select('id,name,template')
      .single();
    if (error) {
      toast.error(t.createTemplateError, { description: error.message });
    } else {
      setTemplates((current) =>
        [...current, data].toSorted((first, second) =>
          first.name.localeCompare(second.name),
        ),
      );
      setTemplateName('');
      toast.success(t.templateSaved);
    }
    setSavingTemplate(false);
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
        recurrence_interval:
          form.repeatUnit === 'none' ? null : Number(form.repeatInterval),
        recurrence_unit: form.repeatUnit === 'none' ? null : form.repeatUnit,
        recurrence_until:
          form.repeatUnit === 'none' ? null : form.repeatUntil || null,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        state_id: stateData.id,
        parent_task_id: parentTask?.id ?? null,
        assigned_to:
          form.assignedTo === 'unassigned'
            ? null
            : form.assignedTo === 'me'
              ? userData.user.id
              : form.assignedTo,
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

    const createdTask = {
      ...data,
      linked_projects: form.projectIds.map((projectId) => ({
        project: projects.find((project) => project.id === projectId),
      })),
    };
    onCreated(createdTask);
    if (onStartTask) {
      toast.success(parentTask ? t.subtaskCreated : t.taskCreated, {
        action: {
          label: t.startTaskNext,
          onClick: () => onStartTask(createdTask),
        },
      });
    } else {
      toast.success(parentTask ? t.subtaskCreated : t.taskCreated);
    }
    setSaving(false);
  };

  return {
    form,
    applyTemplate,
    handleSubmit,
    handleSaveTemplate,
    loadingOptions,
    profiles,
    projects,
    saving,
    savingTemplate,
    setTemplateName,
    templateName,
    templates,
    updateField,
  };
}
