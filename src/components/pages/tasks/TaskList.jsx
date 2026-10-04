import { ListTodo, Play, Plus, Square } from 'lucide-react';
import { m as motion } from 'motion/react';
import { useEffect } from 'react';
import { AnimatedTabPanel } from '@/components/Common/animated-tabs';
import { useAnimationsEnabled } from '@/components/Common/animation-preferences';
import ListFilterToolbar from '@/components/Common/ListFilterToolbar';
import { dateLabel, priorityVariant } from '@/components/Common/taskUtils';
import { Badge } from '@/components/reui/badge';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { Button } from '@/components/ui/button';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';

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
  recentlyCreatedTaskId,
  onTaskAnimationComplete,
  title,
  description,
  showSummaryHeader = true,
  projectOptions = [],
  projectFilter = 'all',
  onProjectFilterChange,
  showProjectFilter = true,
}) => {
  const animationsEnabled = useAnimationsEnabled();
  const strings = useStrings();
  const t = strings.taskList;

  useEffect(() => {
    if (!animationsEnabled && recentlyCreatedTaskId) {
      onTaskAnimationComplete?.(recentlyCreatedTaskId);
    }
  }, [animationsEnabled, onTaskAnimationComplete, recentlyCreatedTaskId]);

  return (
    <Frame className="h-full min-h-0" stacked dense>
      <FrameHeader className="gap-2 border-b p-3 sm:gap-3 sm:p-4">
        {showSummaryHeader && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/5 p-3 sm:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <ListTodo className="size-4" />
              </div>
              <div className="min-w-0">
                <FrameTitle>{title ?? t.title}</FrameTitle>
                <FrameDescription className="truncate">
                  {description ?? t.description}
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
        )}
        {runningTaskId && (
          <div className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/5 px-3 py-2 text-xs text-success-foreground">
            <span className="size-2 animate-pulse rounded-full bg-success" />
            <span className="font-medium">{t.workingNow}</span>
            <span className="truncate text-muted-foreground">
              {tasks.find((task) => task.id === runningTaskId)?.title}
            </span>
          </div>
        )}
        <ListFilterToolbar
          addLabel={t.newTask}
          closeSearchLabel={t.closeSearch}
          onAdd={onNewTask}
          query={query}
          queryPlaceholder={t.searchPlaceholder}
          searchLabel={t.searchTasks}
          onQueryChange={onQueryChange}
          primaryLabel={t.statusFilter}
          primaryValue={
            filter === 'current'
              ? 'active'
              : filter === 'due-soon'
                ? 'due-weekend'
                : filter
          }
          primaryOptions={[
            { value: 'all', label: t.filters.all },
            { value: 'active', label: t.filters.active },
            { value: 'completed', label: t.filters.completed },
            { value: 'overdue', label: t.filters.overdue },
            { value: 'due-weekend', label: t.filters.dueWeekend },
          ]}
          onPrimaryChange={(value) =>
            onFilterChange(value === 'active' ? 'current' : value)
          }
          secondaryOptions={
            showProjectFilter
              ? [
                  { value: 'all', label: t.filters.allProjects },
                  ...projectOptions.map((project) => ({
                    value: project.id,
                    label: project.name,
                  })),
                ]
              : undefined
          }
          secondaryLabel={t.projectFilter}
          secondaryValue={projectFilter}
          onSecondaryChange={onProjectFilterChange}
        />
      </FrameHeader>
      <FramePanel className="min-h-0 flex-1 overflow-hidden p-0 shadow-none">
        <AnimatedTabPanel activeId={filter} className="h-full">
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
              ariaLabel={title ?? t.title}
              className="h-full p-2 sm:p-3"
              estimateSize={56}
              itemClassName="pb-1"
              items={tasks}
              renderItem={(task) => {
                const taskCard = (
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
                          variant={
                            priorityVariant[task.priority] ?? 'secondary'
                          }
                        >
                          {task.priority}
                        </Badge>
                        {!task.state?.is_completed && (
                          <Button
                            type="button"
                            size="icon-xs"
                            variant={
                              runningTaskId === task.id
                                ? 'destructive'
                                : 'ghost'
                            }
                            aria-label={
                              runningTaskId === task.id
                                ? `Stop ${task.title}`
                                : `Start ${task.title}`
                            }
                            title={
                              runningTaskId === task.id
                                ? t.stopTask
                                : t.startTask
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
                      <span className="shrink-0">
                        {dateLabel(task.due_date)}
                      </span>
                    </div>
                  </div>
                );

                if (!animationsEnabled || task.id !== recentlyCreatedTaskId) {
                  return taskCard;
                }

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    onAnimationComplete={() =>
                      onTaskAnimationComplete?.(task.id)
                    }
                  >
                    {taskCard}
                  </motion.div>
                );
              }}
            />
          )}
          {!loading && !error && !tasks.length && (
            <div className="grid justify-items-center gap-2 px-4 py-10 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                <ListTodo aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold">{t.empty}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {t.emptyDescription}
              </p>
              <Button type="button" className="mt-2" onClick={onNewTask}>
                <Plus aria-hidden="true" />
                {t.newTask}
              </Button>
            </div>
          )}
        </AnimatedTabPanel>
      </FramePanel>
    </Frame>
  );
};

export default TaskList;
