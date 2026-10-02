import { ListPlus, Save } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/reui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MultiSelect from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTaskForm } from '@/hooks/use-task-form';
import { useStrings } from '@/lib/i18n';

const priorities = ['low', 'medium', 'high', 'urgent'];

const TaskFormDialog = ({ onCreated, onOpenChange, open, parentTask }) => {
  const t = useStrings().taskForm;
  const { form, handleSubmit, loadingOptions, projects, saving, updateField } =
    useTaskForm({
      onCreated: (task) => {
        onCreated(task);
        onOpenChange(false);
      },
      open,
      parentTask,
    });
  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: project.id,
        label: `${project.name} (${project.client?.name ?? project.code})`,
      })),
    [projects],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2 text-primary">
            <ListPlus className="size-4" />
            <Badge variant="secondary" size="sm">
              {parentTask ? t.subtaskBadge : t.taskBadge}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-semibold">
            {parentTask ? t.subtaskTitle : t.taskTitle}
          </DialogTitle>
          <DialogDescription>
            {parentTask
              ? `${t.subtaskDescription} "${parentTask.title}"`
              : t.taskDescription}
          </DialogDescription>
        </div>
        <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="new-task-title">{t.titleLabel}</Label>
            <Input
              id="new-task-title"
              autoFocus
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-task-description">{t.descriptionLabel}</Label>
            <Textarea
              id="new-task-description"
              value={form.description}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
              placeholder={t.descriptionPlaceholder}
              rows={3}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-task-projects">{t.projectsLabel}</Label>
              <MultiSelect
                id="new-task-projects"
                disabled={loadingOptions || Boolean(parentTask)}
                placeholder={
                  loadingOptions ? t.loadingProjects : t.selectProjects
                }
                emptyLabel={t.noProjects}
                values={form.projectIds}
                onChange={(value) => updateField('projectIds', value)}
                options={projectOptions}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-task-priority">{t.priorityLabel}</Label>
              <Select
                value={form.priority}
                onValueChange={(value) => updateField('priority', value)}
              >
                <SelectTrigger id="new-task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-task-due-date">{t.dueDateLabel}</Label>
              <Input
                id="new-task-due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => updateField('dueDate', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-task-estimate">{t.estimateLabel}</Label>
              <Input
                id="new-task-estimate"
                type="number"
                min="1"
                value={form.estimateMinutes}
                onChange={(event) =>
                  updateField('estimateMinutes', event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-task-tags">{t.tagsLabel}</Label>
              <Input
                id="new-task-tags"
                value={form.tags}
                placeholder={t.tagsPlaceholder}
                onChange={(event) => updateField('tags', event.target.value)}
              />
            </div>
          </div>
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
              {saving ? t.saving : t.create}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormDialog;
