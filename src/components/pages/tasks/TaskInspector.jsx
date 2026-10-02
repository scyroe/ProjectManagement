import {
  Activity,
  CalendarDays,
  Crosshair,
  ListChecks,
  ListTodo,
  MessageSquare,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/reui/badge';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { useTaskInspector } from '@/hooks/use-task-inspector';
import { useStrings } from '@/lib/i18n';
import ActivityPanel from './ActivityPanel';
import TaskActivity from './TaskActivity';
import TaskComments from './TaskComments';
import TaskDetails from './TaskDetails';
import TaskHistoryCalendar from './TaskHistoryCalendar';
import TaskSubtasks from './TaskSubtasks';
import { priorityVariant } from './taskUtils';

const TaskInspector = ({
  task,
  onTaskUpdated,
  tasks,
  onUpdateState,
  onRequestCompletion,
  onAddSubtask,
}) => {
  const strings = useStrings();
  const t = strings.taskInspector;
  const { addComment, history, setTab, tab } = useTaskInspector(task);

  if (!task) {
    return (
      <FramePanel className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{t.emptyState}</p>
      </FramePanel>
    );
  }

  return (
    <Frame className="h-full" stacked dense>
      <FrameHeader className="gap-2 border-b p-3 pb-2.5 sm:gap-3 sm:p-4 sm:pb-2.5">
        <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-3 sm:p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Crosshair className="size-4" />
          </div>
          <div className="min-w-0">
            <FrameTitle className="truncate">{task.title}</FrameTitle>
            <FrameDescription className="truncate">
              {t.focusedTaskPrefix} · {task.project?.code ?? 'Project'}
            </FrameDescription>
          </div>
        </div>
        <div className="flex h-8 flex-wrap items-center gap-2 px-1">
          <Badge variant={priorityVariant[task.priority] ?? 'secondary'}>
            {task.priority}
          </Badge>
          <Badge variant="outline">
            {task.state?.name ?? strings.common.noState}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {task.project?.client?.name}
          </span>
        </div>
        <div
          className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
          role="tablist"
          aria-label={t.tabListLabel}
        >
          {[
            'details',
            'calendar',
            'activity',
            'team',
            'subtasks',
            'comments',
          ].map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={`flex min-h-10 items-center justify-start gap-1.5 rounded-md px-1 py-1.5 text-xs font-medium leading-tight transition-colors sm:min-h-0 sm:px-2 ${tab === name ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {name === 'details' ? (
                <ListTodo className="size-3.5 shrink-0" />
              ) : name === 'calendar' ? (
                <CalendarDays className="size-3.5 shrink-0" />
              ) : name === 'activity' ? (
                <Activity className="size-3.5 shrink-0" />
              ) : name === 'team' ? (
                <Users className="size-3.5 shrink-0" />
              ) : name === 'subtasks' ? (
                <ListChecks className="size-3.5 shrink-0" />
              ) : (
                <MessageSquare className="size-3.5 shrink-0" />
              )}
              {t.tabs[name]}
            </button>
          ))}
        </div>
      </FrameHeader>
      <FramePanel className="min-h-0 flex-1 overflow-auto p-2.5 shadow-none">
        {tab === 'details' ? (
          <TaskDetails
            task={task}
            onUpdated={onTaskUpdated}
            onRequestCompletion={onRequestCompletion}
          />
        ) : tab === 'calendar' ? (
          <TaskHistoryCalendar history={history} />
        ) : tab === 'activity' ? (
          <TaskActivity history={history} />
        ) : tab === 'team' ? (
          <ActivityPanel entries={history} />
        ) : tab === 'subtasks' ? (
          <TaskSubtasks
            task={task}
            tasks={tasks}
            onUpdateState={onUpdateState}
            onAddSubtask={onAddSubtask}
          />
        ) : (
          <TaskComments history={history} onAddComment={addComment} />
        )}
      </FramePanel>
    </Frame>
  );
};

export default TaskInspector;
