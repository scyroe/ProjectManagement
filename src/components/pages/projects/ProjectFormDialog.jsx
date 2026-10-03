import { FolderPen, FolderPlus, Save } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/reui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import FieldLabel from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import MultiSelect from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useProjectForm } from '@/hooks/projects/use-project-form';
import { useStrings } from '@/lib/i18n';

const statuses = ['planning', 'active', 'paused', 'completed', 'archived'];

const ProjectFormDialog = ({
  onCreateTask,
  onOpenChange,
  onSaved,
  open,
  project,
}) => {
  const t = useStrings().projectForm;
  const { clients, form, handleSubmit, loadingOptions, saving, updateField } =
    useProjectForm({
      onCreateTask,
      onSaved: (savedProject) => {
        onSaved(savedProject);
        onOpenChange(false);
      },
      open,
      project,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2 text-primary">
            {project ? (
              <FolderPen className="size-4" />
            ) : (
              <FolderPlus className="size-4" />
            )}
            <Badge variant="secondary" size="sm">
              {project ? t.editBadge : t.badge}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-semibold">
            {project ? t.editTitle : t.title}
          </DialogTitle>
          <DialogDescription>
            {project ? t.editDescription : t.description}
          </DialogDescription>
        </div>
        <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel
                htmlFor="new-project-name"
                isRequired
                isComplete={Boolean(form.name.trim())}
              >
                {t.nameLabel}
              </FieldLabel>
              <Input
                id="new-project-name"
                autoFocus
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <FieldLabel
                htmlFor="new-project-code"
                isRequired
                isComplete={Boolean(form.code.trim())}
              >
                {t.codeLabel}
              </FieldLabel>
              <Input
                id="new-project-code"
                value={form.code}
                placeholder={t.codePlaceholder}
                onChange={(event) => updateField('code', event.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel
              htmlFor="new-project-clients"
              isRequired
              isComplete={form.clientIds.length > 0}
            >
              {t.clientLabel}
            </FieldLabel>
            <MultiSelect
              id="new-project-clients"
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
            <FieldLabel htmlFor="new-project-description">
              {t.descriptionLabel}
            </FieldLabel>
            <Textarea
              id="new-project-description"
              value={form.description}
              placeholder={t.descriptionPlaceholder}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
              rows={3}
            />
          </div>
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              {t.moreOptions}
            </summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="new-project-status">
                  {t.statusLabel}
                </FieldLabel>
                <Select
                  value={form.status}
                  onValueChange={(value) => updateField('status', value)}
                >
                  <SelectTrigger id="new-project-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="new-project-budget">
                  {t.budgetLabel}
                </FieldLabel>
                <Input
                  id="new-project-budget"
                  type="number"
                  min="0"
                  value={form.budget}
                  onChange={(event) =>
                    updateField('budget', event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="new-project-start-date">
                  {t.startDateLabel}
                </FieldLabel>
                <Input
                  id="new-project-start-date"
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    updateField('startDate', event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="new-project-due-date">
                  {t.dueDateLabel}
                </FieldLabel>
                <Input
                  id="new-project-due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    updateField('dueDate', event.target.value)
                  }
                />
              </div>
            </div>
          </details>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t.cancel}
            </Button>
            <Button type="submit" disabled={saving}>
              <Save />
              {saving ? t.saving : project ? t.save : t.create}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFormDialog;
