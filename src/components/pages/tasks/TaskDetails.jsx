import { CheckCircle2, Circle, Save } from 'lucide-react';
import { useMemo } from 'react';
import { profileLabel } from '@/components/Common/taskUtils';
import { Badge } from '@/components/reui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import VirtualSelect from '@/components/ui/virtual-select';
import { useTaskDetails } from '@/hooks/tasks/use-task-details';
import { useStrings } from '@/lib/i18n';

const priorities = ['low', 'medium', 'high', 'urgent'];

const TaskDetails = ({ task, onUpdated, onRequestCompletion }) => {
  const strings = useStrings();
  const t = strings.taskDetails;
  const {
    form,
    handleCompletionToggle,
    handleSubmit,
    isDirty,
    loadingOptions,
    profiles,
    projects,
    saving,
    taskStates,
    updateField,
    updatingCompletion,
  } = useTaskDetails({ task, onUpdated });
  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: project.id,
        label: `${project.name} (${project.client?.name ?? project.code})`,
      })),
    [projects],
  );
  const assigneeLabel =
    form.assignedTo === 'unassigned'
      ? t.unassigned
      : profileLabel(
          profiles.find((profile) => profile.id === form.assignedTo),
          strings.teamWorkload.unknownMember,
        );

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="task-title">{t.titleLabel}</Label>
        <Input
          id="task-title"
          value={form.title}
          onChange={(event) => updateField('title', event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-description">{t.descriptionLabel}</Label>
        <Textarea
          id="task-description"
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
          placeholder={t.descriptionPlaceholder}
          rows={4}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="task-projects">{t.projectsLabel}</Label>
          <VirtualSelect
            id="task-projects"
            ariaLabel={t.projectsLabel}
            searchLabel={t.projectsLabel}
            multiple
            disabled={loadingOptions}
            placeholder={loadingOptions ? t.loadingProjects : t.selectProjects}
            emptyLabel={t.noProjects}
            values={form.projectIds}
            onChange={(value) => updateField('projectIds', value)}
            options={projectOptions}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="task-priority">{t.priorityLabel}</Label>
          <VirtualSelect
            id="task-priority"
            ariaLabel={t.priorityLabel}
            searchLabel={t.priorityLabel}
            value={form.priority}
            onChange={(value) => updateField('priority', value)}
            placeholder={form.priority}
            options={priorities.map((priority) => ({
              value: priority,
              label: priority,
            }))}
            triggerClassName="w-full"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="task-assignee">{t.assigneeLabel}</Label>
          <VirtualSelect
            id="task-assignee"
            ariaLabel={t.assigneeLabel}
            searchLabel={t.assigneeLabel}
            value={form.assignedTo}
            onChange={(value) => updateField('assignedTo', value)}
            placeholder={assigneeLabel}
            options={[
              { value: 'unassigned', label: t.unassigned },
              ...profiles.map((profile) => ({
                value: profile.id,
                label: profileLabel(
                  profile,
                  strings.teamWorkload.unknownMember,
                ),
              })),
            ]}
            triggerClassName="w-full"
          />
        </div>
        <Field
          id="task-due-date"
          label={t.dueDateLabel}
          type="date"
          value={form.dueDate}
          onChange={(event) => updateField('dueDate', event.target.value)}
        />
        <Field
          id="task-estimate"
          label={t.estimateLabel}
          type="number"
          min="1"
          value={form.estimateMinutes}
          onChange={(event) =>
            updateField('estimateMinutes', event.target.value)
          }
        />
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="task-repeat">{t.repeatLabel}</Label>
          <VirtualSelect
            id="task-repeat"
            ariaLabel={t.repeatLabel}
            searchLabel={t.repeatLabel}
            value={form.repeatUnit}
            onChange={(value) => updateField('repeatUnit', value)}
            options={[
              { value: 'none', label: t.repeatNever },
              { value: 'day', label: t.repeatDay },
              { value: 'week', label: t.repeatWeek },
              { value: 'month', label: t.repeatMonth },
            ]}
            triggerClassName="w-full"
          />
        </div>
        {form.repeatUnit !== 'none' && (
          <>
            <Field
              id="task-repeat-interval"
              label={t.repeatEvery}
              type="number"
              min="1"
              required
              value={form.repeatInterval}
              onChange={(event) =>
                updateField('repeatInterval', event.target.value)
              }
            />
            <Field
              id="task-repeat-until"
              label={t.repeatUntil}
              type="date"
              min={form.dueDate || undefined}
              value={form.repeatUntil}
              onChange={(event) =>
                updateField('repeatUntil', event.target.value)
              }
            />
          </>
        )}
        <Field
          id="task-tags"
          label={t.tagsLabel}
          value={form.tags}
          placeholder={t.tagsPlaceholder}
          onChange={(event) => updateField('tags', event.target.value)}
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <div className="flex flex-wrap gap-2">
          {(task.tags ?? []).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={task.state?.is_completed ? 'outline' : 'secondary'}
            onClick={() =>
              task.state?.is_completed
                ? handleCompletionToggle()
                : onRequestCompletion(task, handleCompletionToggle)
            }
            disabled={updatingCompletion || !taskStates.length}
          >
            {task.state?.is_completed ? <Circle /> : <CheckCircle2 />}
            {task.state?.is_completed ? t.markNotCompleted : t.markCompleted}
          </Button>
          <Button type="submit" disabled={saving || !isDirty}>
            <Save />
            {saving ? t.saving : t.save}
          </Button>
        </div>
      </div>
    </form>
  );
};

const Field = ({ id, label, ...props }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} {...props} />
  </div>
);

export default TaskDetails;
