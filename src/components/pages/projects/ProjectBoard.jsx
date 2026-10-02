import { FolderKanban, GripVertical } from 'lucide-react';
import { useMemo } from 'react';
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
import { dateLabel, priorityVariant } from './taskUtils';

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

  return (
    <Frame className="min-h-0 flex-1" stacked>
      <FrameHeader className="flex-row items-start justify-between gap-3">
        <div>
          <FrameTitle>{strings.projectBoard.title}</FrameTitle>
          <FrameDescription>
            {strings.projectBoard.description}
          </FrameDescription>
        </div>
        <FolderKanban className="size-5 text-primary" />
      </FrameHeader>
      <FramePanel className="min-h-0 flex-1 overflow-auto p-3 shadow-none">
        <div className="grid min-w-[60rem] grid-cols-5 gap-3">
          {columns.map((state) => {
            const columnTasks = tasksByState.get(state.id) ?? [];
            return (
              <div
                key={state.id}
                role="listbox"
                aria-label={`${state.name} tasks`}
                tabIndex={0}
                className="min-h-[28rem] rounded-lg bg-muted/60 p-2"
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
                  className="max-h-96"
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
