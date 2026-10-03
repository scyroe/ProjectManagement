import { CheckCircle2, Circle, ListChecks, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { dateLabel, priorityVariant } from '@/components/Common/taskUtils';
import { Badge } from '@/components/reui/badge';
import { Button } from '@/components/ui/button';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';

const TaskSubtasks = ({ task, tasks, onUpdateState, onAddSubtask }) => {
  const t = useStrings().taskSubtasks;
  const { availableStates, completedCount, subtasks } = useMemo(() => {
    const subtasks = [];
    const availableStatesById = new Map();
    let completedCount = 0;

    for (const item of tasks) {
      if (item.parent_task_id === task.id) {
        subtasks.push(item);
        if (item.state?.is_completed) completedCount += 1;
      }
      if (item.state && !availableStatesById.has(item.state.id)) {
        availableStatesById.set(item.state.id, item.state);
      }
    }

    return {
      availableStates: Array.from(availableStatesById.values()),
      completedCount,
      subtasks,
    };
  }, [task.id, tasks]);

  if (!subtasks.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <ListChecks className="mx-auto mb-3 size-7 text-muted-foreground" />
        <p className="text-sm font-medium">{t.empty}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.emptyDescription}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() => onAddSubtask(task)}
        >
          <Plus />
          {t.addSubtask}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 p-3">
        <div>
          <p className="text-sm font-medium">{t.progressTitle}</p>
          <p className="text-xs text-muted-foreground">
            {completedCount} of {subtasks.length} {t.completedSuffix}
          </p>
        </div>
        <div className="h-2 w-24 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-success transition-[width] duration-500 ease-out"
            style={{ width: `${(completedCount / subtasks.length) * 100}%` }}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={() => onAddSubtask(task)}
        >
          <Plus />
          {t.addSubtask}
        </Button>
      </div>
      <VirtualList
        ariaLabel={t.progressTitle}
        className="max-h-96"
        estimateSize={58}
        getItemKey={(subtask) => subtask.id}
        itemClassName="pb-2"
        items={subtasks}
        renderItem={(subtask) => {
          const completed = subtask.state?.is_completed;
          const nextState = completed
            ? availableStates.find((state) => !state.is_completed)
            : availableStates.find((state) => state.is_completed);
          return (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label={
                  completed
                    ? `Reopen ${subtask.title}`
                    : `Complete ${subtask.title}`
                }
                title={completed ? t.reopenSubtask : t.completeSubtask}
                onClick={() => onUpdateState(subtask, nextState)}
              >
                {completed ? (
                  <CheckCircle2 className="text-success" />
                ) : (
                  <Circle />
                )}
              </Button>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${completed ? 'text-muted-foreground line-through' : ''}`}
                >
                  {subtask.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dateLabel(subtask.due_date)}
                </p>
              </div>
              <Badge
                size="sm"
                variant={priorityVariant[subtask.priority] ?? 'secondary'}
              >
                {subtask.priority}
              </Badge>
            </div>
          );
        }}
      />
    </div>
  );
};

export default TaskSubtasks;
