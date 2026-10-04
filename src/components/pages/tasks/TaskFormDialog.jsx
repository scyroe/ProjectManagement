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
import { useTaskForm } from '@/hooks/tasks/use-task-form';
import { useStrings } from '@/lib/i18n';
import TaskMoreOptions from './TaskMoreOptions';
import TaskPrimaryFields from './TaskPrimaryFields';
import TaskTemplateControls from './TaskTemplateControls';

function TaskFormDialog({
  initialProjectId,
  onCreated,
  onOpenChange,
  onStartTask,
  open,
  parentTask,
}) {
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
        <DialogHeading parentTask={parentTask} t={t} />
        <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
          <TaskTemplateControls
            applyTemplate={applyTemplate}
            onSaveTemplate={handleSaveTemplate}
            savingTemplate={savingTemplate}
            setTemplateName={setTemplateName}
            templateName={templateName}
            templates={templates}
            t={t}
          />
          <TaskPrimaryFields
            assigneeLabel={assigneeLabel}
            form={form}
            loadingOptions={loadingOptions}
            onFieldChange={updateField}
            parentTask={parentTask}
            profiles={profiles}
            projectOptions={projectOptions}
            strings={strings}
            t={t}
          />
          <TaskMoreOptions form={form} onFieldChange={updateField} t={t} />
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
}

function DialogHeading({ parentTask, t }) {
  return (
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
  );
}

export default TaskFormDialog;
