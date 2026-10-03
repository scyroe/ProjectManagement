import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const projectSelect =
  'id,name,code,description,status,start_date,due_date,budget,client_id,client:clients!client_id(id,name)';

const emptyForm = () => ({
  name: '',
  code: '',
  clientIds: [],
  description: '',
  status: 'planning',
  startDate: '',
  dueDate: '',
  budget: '',
});

export function useProjectForm({ onCreateTask, onSaved, open, project }) {
  const t = useStrings().toasts.projectForm;
  const [form, setForm] = useState(emptyForm);
  const [clients, setClients] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const loadOptions = async () => {
      setLoadingOptions(true);
      const [{ data, error }, projectResult] = await Promise.all([
        supabase.from('clients').select('id,name').order('name'),
        project
          ? supabase
              .from('projects')
              .select(`${projectSelect},project_clients(client_id)`)
              .eq('id', project.id)
              .single()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (error) {
        toast.error(t.loadOptionsError, { description: error.message });
      } else {
        setClients(data ?? []);
      }
      if (!projectResult.error && projectResult.data) {
        const savedProject = projectResult.data;
        setForm({
          name: savedProject.name ?? '',
          code: savedProject.code ?? '',
          clientIds: (savedProject.project_clients ?? []).map(
            (link) => link.client_id,
          ),
          description: savedProject.description ?? '',
          status: savedProject.status ?? 'planning',
          startDate: savedProject.start_date ?? '',
          dueDate: savedProject.due_date ?? '',
          budget: savedProject.budget?.toString() ?? '',
        });
      }
      setLoadingOptions(false);
    };

    loadOptions();
  }, [open, project, t]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const code = form.code.trim();
    if (!name) {
      toast.error(t.nameRequired);
      return;
    }
    if (!code) {
      toast.error(t.codeRequired);
      return;
    }
    if (!form.clientIds.length) {
      toast.error(t.clientRequired);
      return;
    }

    setSaving(true);

    const values = {
      name,
      code,
      client_id: form.clientIds[0],
      description: form.description.trim() || null,
      status: form.status,
      start_date: form.startDate || null,
      due_date: form.dueDate || null,
      budget: form.budget ? Number(form.budget) : null,
    };
    const query = project
      ? supabase.from('projects').update(values).eq('id', project.id)
      : supabase.from('projects').insert(values);
    const { data, error } = await query.select(projectSelect).single();

    if (error) {
      toast.error(project ? t.updateProjectError : t.createProjectError, {
        description: error.message,
      });
      setSaving(false);
      return;
    }

    const { error: unlinkError } = project
      ? await supabase
          .from('project_clients')
          .delete()
          .eq('project_id', data.id)
      : { error: null };
    const { error: linkError } = unlinkError
      ? { error: unlinkError }
      : await supabase.from('project_clients').insert(
          form.clientIds.map((clientId) => ({
            project_id: data.id,
            client_id: clientId,
          })),
        );
    if (linkError) {
      toast.error(t.linkClientsError, { description: linkError.message });
    }

    const savedProject = {
      ...data,
      linked_clients: clients.filter((client) =>
        form.clientIds.includes(client.id),
      ),
    };
    onSaved(savedProject);
    if (!project && onCreateTask) {
      toast.success(t.projectCreated, {
        action: {
          label: t.addFirstTaskNext,
          onClick: () => onCreateTask(savedProject),
        },
      });
    } else {
      toast.success(project ? t.projectUpdated : t.projectCreated);
    }
    setSaving(false);
  };

  return {
    clients,
    form,
    handleSubmit,
    loadingOptions,
    saving,
    updateField,
  };
}
