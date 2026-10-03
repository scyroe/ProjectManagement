import { ListPlus, Save } from 'lucide-react';
import { useMemo } from 'react';
import { profileLabel } from '@/components/Common/taskUtils';
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
import { useTaskForm } from '@/hooks/tasks/use-task-form';
import { useStrings } from '@/lib/i18n';

const priorities = ['low', 'medium', 'high', 'urgent'];

const TaskFormDialog = ({
  initialProjectId,
  onCreated,
  onOpenChange,
  onStartTask,
  open,
  parentTask,
}) => {
  const strings = useStrings();
  const t = strings.taskForm;
  const {
    applyTemplate,
    form,
    handleSaveTemplate,
    handleSubmit,
    loadingOptions,
    profiles,
    projects,
    saving,
    savingTemplate,
    setTemplateName,
    templateName,
    templates,
    updateField,
  } = useTaskForm({
    initialProjectId,
    onStartTask,
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
  const assigneeLabel =
    form.assignedTo === 'me'
      ? t.assignToMe
      : form.assignedTo === 'unassigned'
        ? t.unassigned
        : profileLabel(
            profiles.find((profile) => profile.id === form.assignedTo),
            strings.teamWorkload.unknownMember,
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
          <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <div className="flex min-w-0 flex-col gap-2">
              <FieldLabel htmlFor="task-template">{t.templateLabel}</FieldLabel>
              <Select
                value=""
                onValueChange={applyTemplate}
                disabled={!templates.length}
              >
                <SelectTrigger id="task-template" className="w-full">
                  <SelectValue placeholder={t.selectTemplate} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="task-template-name">
                {t.templateName}
              </FieldLabel>
              <Input
                id="task-template-name"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={savingTemplate ? t.savingTemplate : t.saveTemplate}
              title={savingTemplate ? t.savingTemplate : t.saveTemplate}
              disabled={savingTemplate}
              onClick={handleSaveTemplate}
            >
              <Save aria-hidden="true" />
            </Button>
          </div>
          <div className="space-y-2">
            <FieldLabel
              htmlFor="new-task-title"
              isRequired
              isComplete={Boolean(form.title.trim())}
            >
              {t.titleLabel}
            </FieldLabel>
            <Input
              id="new-task-title"
              autoFocus
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <FieldLabel
              htmlFor="new-task-projects"
              isRequired
              isComplete={form.projectIds.length > 0}
            >
              {t.projectLabel}
            </FieldLabel>
            <MultiSelect
              id="new-task-projects"
              disabled={loadingOptions || Boolean(parentTask)}
              required
              placeholder={loadingOptions ? t.loadingProjects : t.selectProject}
              emptyLabel={t.noProjects}
              values={form.projectIds}
              onChange={(value) => updateField('projectIds', value)}
              options={projectOptions}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="new-task-description">
              {t.descriptionLabel}
            </FieldLabel>
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
          <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
            <div className="flex min-w-0 flex-col gap-2">
              <FieldLabel htmlFor="new-task-priority">
                {t.priorityLabel}
              </FieldLabel>
              <Select
                value={form.priority}
                onValueChange={(value) => updateField('priority', value)}
              >
                <SelectTrigger id="new-task-priority" className="w-full">
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
            <div className="flex min-w-0 flex-col gap-2">
              <FieldLabel htmlFor="new-task-assignee">
                {t.assigneeLabel}
              </FieldLabel>
              <Select
                value={form.assignedTo}
                onValueChange={(value) => updateField('assignedTo', value)}
              >
                <SelectTrigger id="new-task-assignee" className="w-full">
                  <SelectValue>{assigneeLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="me">{t.assignToMe}</SelectItem>
                  <SelectItem value="unassigned">{t.unassigned}</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profileLabel(
                        profile,
                        strings.teamWorkload.unknownMember,
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel
                htmlFor="new-task-due-date"
                isRequired={form.repeatUnit !== 'none'}
                isComplete={Boolean(form.dueDate)}
              >
                {t.dueDateLabel}
              </FieldLabel>
              <Input
                id="new-task-due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => updateField('dueDate', event.target.value)}
                required={form.repeatUnit !== 'none'}
              />
            </div>
          </div>
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              {t.moreOptions}
            </summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:items-end">
              <div className="space-y-2">
                <FieldLabel htmlFor="new-task-estimate">
                  {t.estimateLabel}
                </FieldLabel>
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
              <div className="flex min-w-0 flex-col gap-2">
                <FieldLabel htmlFor="new-task-repeat">
                  {t.repeatLabel}
                </FieldLabel>
                <Select
                  value={form.repeatUnit}
                  onValueChange={(value) => updateField('repeatUnit', value)}
                >
                  <SelectTrigger id="new-task-repeat" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.repeatNever}</SelectItem>
                    <SelectItem value="day">{t.repeatDay}</SelectItem>
                    <SelectItem value="week">{t.repeatWeek}</SelectItem>
                    <SelectItem value="month">{t.repeatMonth}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.repeatUnit !== 'none' && (
                <>
                  <div className="space-y-2">
                    <FieldLabel
                      htmlFor="new-task-repeat-interval"
                      isRequired
                      isComplete={
                        Number.isInteger(Number(form.repeatInterval)) &&
                        Number(form.repeatInterval) > 0
                      }
                    >
                      {t.repeatEvery}
                    </FieldLabel>
                    <Input
                      id="new-task-repeat-interval"
                      type="number"
                      min="1"
                      value={form.repeatInterval}
                      onChange={(event) =>
                        updateField('repeatInterval', event.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel htmlFor="new-task-repeat-until">
                      {t.repeatUntil}
                    </FieldLabel>
                    <Input
                      id="new-task-repeat-until"
                      type="date"
                      min={form.dueDate || undefined}
                      value={form.repeatUntil}
                      onChange={(event) =>
                        updateField('repeatUntil', event.target.value)
                      }
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <FieldLabel htmlFor="new-task-tags">{t.tagsLabel}</FieldLabel>
                <Input
                  id="new-task-tags"
                  value={form.tags}
                  placeholder={t.tagsPlaceholder}
                  onChange={(event) => updateField('tags', event.target.value)}
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
              {saving ? t.saving : t.create}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormDialog;
