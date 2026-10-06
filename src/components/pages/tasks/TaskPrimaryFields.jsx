import { profileLabel } from '@/components/Common/taskUtils';
import FieldLabel from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import VirtualSelect from '@/components/ui/virtual-select';

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
        <VirtualSelect
          id="new-task-projects"
          ariaLabel={t.projectLabel}
          searchLabel={t.projectLabel}
          multiple
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
          <VirtualSelect
            id="new-task-priority"
            ariaLabel={t.priorityLabel}
            searchLabel={t.priorityLabel}
            value={form.priority}
            onChange={(value) => onFieldChange('priority', value)}
            placeholder={form.priority}
            options={['low', 'medium', 'high', 'urgent'].map((priority) => ({
              value: priority,
              label: priority,
            }))}
            triggerClassName="w-full"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <FieldLabel htmlFor="new-task-assignee">{t.assigneeLabel}</FieldLabel>
          <VirtualSelect
            id="new-task-assignee"
            ariaLabel={t.assigneeLabel}
            searchLabel={t.assigneeLabel}
            value={form.assignedTo}
            onChange={(value) => onFieldChange('assignedTo', value)}
            placeholder={assigneeLabel}
            options={[
              { value: 'me', label: t.assignToMe },
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
