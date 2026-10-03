import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const clientSelect = 'id,name,email,company,phone,notes,created_at';

const emptyForm = () => ({
  name: '',
  email: '',
  company: '',
  phone: '',
  notes: '',
});

export function useClientForm({ client, onCreateProject, onSaved, open }) {
  const t = useStrings().toasts.clientForm;
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        client
          ? {
              name: client.name ?? '',
              email: client.email ?? '',
              company: client.company ?? '',
              phone: client.phone ?? '',
              notes: client.notes ?? '',
            }
          : emptyForm(),
      );
    }
  }, [client, open]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      toast.error(t.nameRequired);
      return;
    }

    setSaving(true);

    const values = {
      name,
      email: form.email.trim() || null,
      company: form.company.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    };
    const query = client
      ? supabase.from('clients').update(values).eq('id', client.id)
      : supabase.from('clients').insert(values);
    const { data, error } = await query.select(clientSelect).single();

    if (error) {
      toast.error(client ? t.updateClientError : t.createClientError, {
        description: error.message,
      });
    } else {
      onSaved(data);
      if (!client && onCreateProject) {
        toast.success(t.clientCreated, {
          action: {
            label: t.createProjectNext,
            onClick: onCreateProject,
          },
        });
      } else {
        toast.success(client ? t.clientUpdated : t.clientCreated);
      }
    }
    setSaving(false);
  };

  return { form, handleSubmit, saving, updateField };
}
