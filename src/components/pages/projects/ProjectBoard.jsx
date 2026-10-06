import { useQuery } from '@tanstack/react-query';
import { FolderKanban, GripVertical, TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { dateLabel, priorityVariant } from '@/components/Common/taskUtils';
import { Badge } from '@/components/reui/badge';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const fallbackStates = [
  { id: 'backlog', name: 'Backlog', color: 'slate', is_completed: false },
  { id: 'todo', name: 'Todo', color: 'blue', is_completed: false },
  { id: 'progress', name: 'In progress', color: 'amber', is_completed: false },
  { id: 'review', name: 'Review', color: 'violet', is_completed: false },
  { id: 'done', name: 'Done', color: 'emerald', is_completed: true },
];

const ProjectBoard = ({ workspace }) => {
  const strings = useStrings();
  const { loading, tasks, updateTaskState } = workspace;
  const dependenciesQuery = useQuery({
    queryKey: [
      'project-board-dependencies',
      tasks
        .map((task) => task.id)
        .sort()
        .join(','),
    ],
    enabled: tasks.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('task_id,depends_on_task_id');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const { columns, tasksByState } = useMemo(() => {
    const statesById = new Map();
    const tasksByState = new Map();
    for (const task of tasks) {
      if (task.state && !statesById.has(task.state.id)) {
        statesById.set(task.state.id, task.state);
      }
      const stateTasks = tasksByState.get(task.state_id) ?? [];
      stateTasks.push(task);
      tasksByState.set(task.state_id, stateTasks);
    }
    const states = Array.from(statesById.values()).sort(
      (first, second) => (first.sort_order ?? 0) - (second.sort_order ?? 0),
    );
    return {
      columns: states.length ? states : fallbackStates,
      tasksByState,
    };
  }, [tasks]);
  const blockedTaskCounts = new Map();
  for (const dependency of dependenciesQuery.data ?? []) {
    const prerequisite = tasks.find(
      (task) => task.id === dependency.depends_on_task_id,
    );
    if (!prerequisite?.state?.is_completed) {
      blockedTaskCounts.set(
        dependency.task_id,
        (blockedTaskCounts.get(dependency.task_id) ?? 0) + 1,
      );
    }
  }

  return (
    <Frame className="h-full min-h-0" stacked>
      <FrameHeader className="flex-row items-start justify-between gap-3">
        <div>
          <FrameTitle>{strings.projectBoard.title}</FrameTitle>
          <FrameDescription>
            {strings.projectBoard.description}
          </FrameDescription>
        </div>
        <FolderKanban className="size-5 text-primary" />
      </FrameHeader>
      <FramePanel className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 pb-0 shadow-none">
        {dependenciesQuery.error && (
          <p
            role="alert"
            className="mb-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive"
          >
            {dependenciesQuery.error.message}
          </p>
        )}
        <div
          className="grid h-full min-h-0 min-w-0 gap-3"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
          }}
        >
          {columns.map((state) => {
            const columnTasks = tasksByState.get(state.id) ?? [];
            return (
              <div
                key={state.id}
                role="listbox"
                aria-label={`${state.name} tasks`}
                tabIndex={0}
                className="flex h-full min-h-0 min-w-0 flex-col rounded-lg bg-muted/60 p-2"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const task = tasks.find(
                    (item) => item.id === event.dataTransfer.getData('task-id'),
                  );
                  if (task) updateTaskState(task, state);
                }}
              >
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                  <h2 className="text-sm font-semibold">{state.name}</h2>
                  <Badge size="sm" variant="secondary">
                    {columnTasks.length}
                  </Badge>
                </div>
                <VirtualList
                  className="min-h-0 flex-1"
                  estimateSize={110}
                  items={columnTasks}
                  itemClassName="pb-2"
                  renderItem={(task) => (
                    <article
                      draggable
                      onDragStart={(event) =>
                        event.dataTransfer.setData('task-id', task.id)
                      }
                      className="cursor-grab rounded-lg border bg-card p-3 shadow-xs active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <p className="min-w-0 flex-1 text-sm font-medium">
                          {task.title}
                        </p>
                      </div>
                      {blockedTaskCounts.has(task.id) && (
                        <p className="mt-2 flex items-center gap-1.5 pl-6 text-xs text-warning-foreground">
                          <TriangleAlert
                            className="size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          {strings.taskDependencies.blocked.replace(
                            '{count}',
                            String(blockedTaskCounts.get(task.id)),
                          )}
                        </p>
                      )}
                      <p className="mt-2 truncate pl-6 text-xs text-muted-foreground">
                        {task.project?.name ?? 'No project'}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2 pl-6">
                        <Badge
                          size="sm"
                          variant={
                            priorityVariant[task.priority] ?? 'secondary'
                          }
                        >
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {dateLabel(task.due_date)}
                        </span>
                      </div>
                    </article>
                  )}
                  semantic={false}
                />
                {!loading && !columnTasks.length && (
                  <p className="px-2 py-8 text-center text-xs text-muted-foreground">
                    Drop tasks here
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </FramePanel>
    </Frame>
  );
};

export default ProjectBoard;
