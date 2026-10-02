import {
  Activity,
  CheckCircle2,
  ListTodo,
  Play,
  Plus,
  Search,
  Square,
} from 'lucide-react';
import { Badge } from '@/components/reui/badge';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';
import { dateLabel, priorityVariant } from './taskUtils';

const TaskList = ({
  tasks,
  loading,
  error,
  selectedId,
  onSelect,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  runningTaskId,
  onToggleTimer,
  onNewTask,
}) => {
  const strings = useStrings();
  const t = strings.taskList;
  return (
    <Frame className="h-full min-h-0" stacked dense>
      <FrameHeader className="gap-2 border-b p-3 sm:gap-3 sm:p-4">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/5 p-3 sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <ListTodo className="size-4" />
            </div>
            <div className="min-w-0">
              <FrameTitle>{t.title}</FrameTitle>
              <FrameDescription className="truncate">
                {t.description}
              </FrameDescription>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-semibold leading-none">
              {tasks.length}
            </div>
            <div className="mt-1 text-[0.78125rem] font-medium uppercase tracking-wide text-muted-foreground">
              {t.visible}
            </div>
          </div>
        </div>
        {runningTaskId && (
          <div className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/5 px-3 py-2 text-xs text-success-foreground">
            <span className="size-2 animate-pulse rounded-full bg-success" />
            <span className="font-medium">{t.workingNow}</span>
            <span className="truncate text-muted-foreground">
              {tasks.find((task) => task.id === runningTaskId)?.title}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <InputGroup className="bg-background">
            <InputGroupAddon align="inline-start">
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={t.searchPlaceholder}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </InputGroup>
          <Button
            type="button"
            size="icon"
            className="shrink-0"
            aria-label={t.newTask}
            title={t.newTask}
            onClick={onNewTask}
          >
            <Plus />
          </Button>
        </div>
        <div
          className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
          role="tablist"
          aria-label={t.tabListLabel}
        >
          {[
            ['current', t.filters.current, ListTodo],
            ['active', t.filters.active, Activity],
            ['completed', t.filters.completed, CheckCircle2],
            ['due-soon', t.filters['due-soon'], ListTodo],
            ['overdue', t.filters.overdue, Activity],
          ].map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => onFilterChange(value)}
              className={`flex min-h-10 items-center justify-start gap-1.5 rounded-md px-1 py-1.5 text-xs font-medium leading-tight transition-colors sm:min-h-0 sm:px-2 ${
                filter === value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="size-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </FrameHeader>
      <FramePanel className="min-h-0 flex-1 overflow-hidden p-0 shadow-none">
        {loading && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t.loading}
          </p>
        )}
        {!loading && error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </p>
        )}
        {!loading && !error && tasks.length > 0 && (
          <VirtualList
            ariaLabel={t.title}
            className="h-full p-2 sm:p-3"
            estimateSize={56}
            itemClassName="pb-1"
            items={tasks}
            renderItem={(task) => (
              <div
                className={`relative w-full rounded-lg border p-2 text-left transition-colors ${
                  runningTaskId === task.id
                    ? 'border-success/50 bg-success/5 shadow-sm ring-1 ring-success/20'
                    : selectedId === task.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border/70 hover:border-border hover:bg-muted/50'
                }`}
              >
                <button
                  type="button"
                  aria-label={task.title}
                  className="absolute inset-0 z-0 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  onClick={() => onSelect(task.id)}
                />
                <div className="pointer-events-none relative z-10 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {runningTaskId === task.id && (
                      <span className="hidden items-center gap-1 text-[0.78125rem] font-semibold uppercase tracking-wide text-success-foreground sm:flex">
                        <span className="size-1.5 animate-pulse rounded-full bg-success" />
                        {t.workingBadge}
                      </span>
                    )}
                    <Badge
                      size="sm"
                      variant={priorityVariant[task.priority] ?? 'secondary'}
                    >
                      {task.priority}
                    </Badge>
                    {!task.state?.is_completed && (
                      <Button
                        type="button"
                        size="icon-xs"
                        variant={
                          runningTaskId === task.id ? 'destructive' : 'ghost'
                        }
                        aria-label={
                          runningTaskId === task.id
                            ? `Stop ${task.title}`
                            : `Start ${task.title}`
                        }
                        title={
                          runningTaskId === task.id ? t.stopTask : t.startTask
                        }
                        className="pointer-events-auto relative z-10"
                        onClick={() => onToggleTimer(task)}
                      >
                        {runningTaskId === task.id ? <Square /> : <Play />}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="pointer-events-none relative z-10 mt-1 flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span
                    className={`min-w-0 flex-1 truncate ${
                      runningTaskId === task.id
                        ? 'font-medium text-success-foreground'
                        : undefined
                    }`}
                  >
                    {task.project?.name ?? strings.common.noProject}
                    <span aria-hidden="true"> · </span>
                    {runningTaskId === task.id
                      ? t.workingStatus
                      : (task.state?.name ?? strings.common.noState)}
                  </span>
                  <span className="shrink-0">{dateLabel(task.due_date)}</span>
                </div>
              </div>
            )}
          />
        )}
        {!loading && !error && !tasks.length && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t.empty}
          </p>
        )}
      </FramePanel>
    </Frame>
  );
};

export default TaskList;
