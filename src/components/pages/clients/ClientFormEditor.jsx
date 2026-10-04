import { Save } from 'lucide-react';
import { useId } from 'react';
import { Button } from '@/components/ui/button';
import FieldLabel from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useClientForm } from '@/hooks/clients/use-client-form';
import { useStrings } from '@/lib/i18n';

function ClientFormEditor({
  autoFocus = false,
  inline = false,
  onCancel,
  onCreateProject,
  onSaved,
  open,
  client,
}) {
  const t = useStrings().clientForm;
  const id = useId();
  const fieldIds = {
    name: `${id}-name`,
    company: `${id}-company`,
    email: `${id}-email`,
    phone: `${id}-phone`,
    notes: `${id}-notes`,
  };
  const { form, handleSubmit, isDirty, saving, updateField } = useClientForm({
    client,
    onCreateProject,
    onSaved,
    open,
  });

  const contactFields = (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel htmlFor={fieldIds.company}>{t.companyLabel}</FieldLabel>
          <Input
            id={fieldIds.company}
            value={form.company}
            onChange={(event) => updateField('company', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor={fieldIds.email}>{t.emailLabel}</FieldLabel>
          <Input
            id={fieldIds.email}
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor={fieldIds.phone}>{t.phoneLabel}</FieldLabel>
          <Input
            id={fieldIds.phone}
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <FieldLabel htmlFor={fieldIds.notes}>{t.notesLabel}</FieldLabel>
        <Textarea
          id={fieldIds.notes}
          value={form.notes}
          placeholder={t.notesPlaceholder}
          onChange={(event) => updateField('notes', event.target.value)}
          rows={3}
        />
      </div>
    </>
  );

  return (
    <form
      className={inline ? 'space-y-5' : 'mt-4 space-y-5'}
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <FieldLabel
          htmlFor={fieldIds.name}
          isRequired
          isComplete={Boolean(form.name.trim())}
        >
          {t.nameLabel}
        </FieldLabel>
        <Input
          id={fieldIds.name}
          autoFocus={autoFocus}
          value={form.name}
          onChange={(event) => updateField('name', event.target.value)}
          required
        />
      </div>
      {inline ? (
        <div className="space-y-4">{contactFields}</div>
      ) : (
        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            {t.moreOptions}
          </summary>
          <div className="mt-4 space-y-4">{contactFields}</div>
        </details>
      )}
      <div className="flex justify-end gap-2 border-t pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.cancel}
          </Button>
        )}
        <Button type="submit" disabled={saving || (inline && !isDirty)}>
          <Save />
          {saving ? t.saving : client ? t.save : t.create}
        </Button>
      </div>
    </form>
  );
}

export default ClientFormEditor;
