import { Save } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import FieldLabel from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import VirtualSelect from '@/components/ui/virtual-select';
import { useProjectForm } from '@/hooks/projects/use-project-form';
import { useStrings } from '@/lib/i18n';

const statuses = ['planning', 'active', 'paused', 'completed', 'archived'];

function ProjectFormEditor({
  autoFocus = false,
  inline = false,
  onCancel,
  onCreateTask,
  onSaved,
  open,
  project,
  workspaceId,
}) {
  const t = useStrings().projectForm;
  const idPrefix = inline ? 'project-details' : 'new-project';
  const fieldIds = {
    name: `${idPrefix}-name`,
    code: `${idPrefix}-code`,
    clients: `${idPrefix}-clients`,
    description: `${idPrefix}-description`,
    status: `${idPrefix}-status`,
    budget: `${idPrefix}-budget`,
    startDate: `${idPrefix}-start-date`,
    dueDate: `${idPrefix}-due-date`,
  };
  const {
    clients,
    form,
    handleSubmit,
    isDirty,
    loadingOptions,
    saving,
    updateField,
  } = useProjectForm({
    onCreateTask,
    onSaved,
    open,
    project,
    workspaceId,
  });
  const clientOptions = useMemo(
    () =>
      clients.map((client) => ({
        value: client.id,
        label: client.name,
      })),
    [clients],
  );

  return (
    <form
      className={inline ? 'space-y-5' : 'mt-4 space-y-5'}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
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
        <div className="space-y-2">
          <FieldLabel
            htmlFor={fieldIds.code}
            isRequired
            isComplete={Boolean(form.code.trim())}
          >
            {t.codeLabel}
          </FieldLabel>
          <Input
            id={fieldIds.code}
            value={form.code}
            placeholder={t.codePlaceholder}
            onChange={(event) => updateField('code', event.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <FieldLabel
          htmlFor={fieldIds.clients}
          isRequired
          isComplete={form.clientIds.length > 0}
        >
          {t.clientLabel}
        </FieldLabel>
        <VirtualSelect
          id={fieldIds.clients}
          ariaLabel={t.clientLabel}
          searchLabel={t.clientLabel}
          multiple
          disabled={loadingOptions}
          required
          placeholder={loadingOptions ? t.loadingClients : t.selectClient}
          emptyLabel={t.noClients}
          values={form.clientIds}
          onChange={(value) => updateField('clientIds', value)}
          options={clientOptions}
        />
      </div>
      <div className="space-y-2">
        <FieldLabel htmlFor={fieldIds.description}>
          {t.descriptionLabel}
        </FieldLabel>
        <Textarea
          id={fieldIds.description}
          value={form.description}
          placeholder={t.descriptionPlaceholder}
          onChange={(event) => updateField('description', event.target.value)}
          rows={3}
        />
      </div>
      <details open={inline} className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          {t.moreOptions}
        </summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel htmlFor={fieldIds.status}>{t.statusLabel}</FieldLabel>
            <VirtualSelect
              id={fieldIds.status}
              ariaLabel={t.statusLabel}
              searchLabel={t.statusLabel}
              value={form.status}
              onChange={(value) => updateField('status', value)}
              options={statuses.map((status) => ({
                value: status,
                label: status,
              }))}
              triggerClassName="w-full"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor={fieldIds.budget}>{t.budgetLabel}</FieldLabel>
            <Input
              id={fieldIds.budget}
              type="number"
              min="0"
              value={form.budget}
              onChange={(event) => updateField('budget', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor={fieldIds.startDate}>
              {t.startDateLabel}
            </FieldLabel>
            <Input
              id={fieldIds.startDate}
              type="date"
              value={form.startDate}
              onChange={(event) => updateField('startDate', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor={fieldIds.dueDate}>{t.dueDateLabel}</FieldLabel>
            <Input
              id={fieldIds.dueDate}
              type="date"
              value={form.dueDate}
              onChange={(event) => updateField('dueDate', event.target.value)}
            />
          </div>
        </div>
      </details>
      <div className="flex justify-end gap-2 border-t pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.cancel}
          </Button>
        )}
        <Button type="submit" disabled={saving || !isDirty}>
          <Save />
          {saving ? t.saving : project ? t.save : t.create}
        </Button>
      </div>
    </form>
  );
}

export default ProjectFormEditor;
