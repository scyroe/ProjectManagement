import { CheckCircle2, Circle, Save } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/reui/badge';
import { Button } from '@/components/ui/button';
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
import { useTaskDetails } from '@/hooks/use-task-details';
import { useStrings } from '@/lib/i18n';

const priorities = ['low', 'medium', 'high', 'urgent'];

const TaskDetails = ({ task, onUpdated, onRequestCompletion }) => {
  const t = useStrings().taskDetails;
  const {
    form,
    handleCompletionToggle,
    handleSubmit,
    isDirty,
    loadingOptions,
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="task-projects">{t.projectsLabel}</Label>
          <MultiSelect
            id="task-projects"
            disabled={loadingOptions}
            placeholder={loadingOptions ? t.loadingProjects : t.selectProjects}
            emptyLabel={t.noProjects}
            values={form.projectIds}
            onChange={(value) => updateField('projectIds', value)}
            options={projectOptions}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-priority">{t.priorityLabel}</Label>
          <Select
            value={form.priority}
            onValueChange={(value) => updateField('priority', value)}
          >
            <SelectTrigger id="task-priority">
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
