import { profileLabel } from '@/components/Common/taskUtils';
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

function TaskPrimaryFields({
  assigneeLabel,
  form,
  loadingOptions,
  onFieldChange,
  parentTask,
  profiles,
  projectOptions,
  strings,
  t,
}) {
  return (
    <>
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
          onChange={(event) => onFieldChange('title', event.target.value)}
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
          onChange={(value) => onFieldChange('projectIds', value)}
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
          onChange={(event) => onFieldChange('description', event.target.value)}
          placeholder={t.descriptionPlaceholder}
          rows={3}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
        <div className="flex min-w-0 flex-col gap-2">
          <FieldLabel htmlFor="new-task-priority">{t.priorityLabel}</FieldLabel>
          <Select
            value={form.priority}
            onValueChange={(value) => onFieldChange('priority', value)}
          >
            <SelectTrigger id="new-task-priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['low', 'medium', 'high', 'urgent'].map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <FieldLabel htmlFor="new-task-assignee">{t.assigneeLabel}</FieldLabel>
          <Select
            value={form.assignedTo}
            onValueChange={(value) => onFieldChange('assignedTo', value)}
          >
            <SelectTrigger id="new-task-assignee" className="w-full">
              <SelectValue>{assigneeLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="me">{t.assignToMe}</SelectItem>
              <SelectItem value="unassigned">{t.unassigned}</SelectItem>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profileLabel(profile, strings.teamWorkload.unknownMember)}
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
            onChange={(event) => onFieldChange('dueDate', event.target.value)}
            required={form.repeatUnit !== 'none'}
          />
        </div>
      </div>
    </>
  );
}

export default TaskPrimaryFields;
