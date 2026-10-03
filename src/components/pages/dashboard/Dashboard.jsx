import {
  Activity,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  ListTodo,
  Play,
  Sparkles,
  Square,
  TrendingUp,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CompactSectionHeader,
  MetricCard,
} from '@/components/Common/analytics-ui';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VirtualList } from '@/components/ui/virtual-list';
import VirtualSelect from '@/components/ui/virtual-select';
import { useStrings } from '@/lib/i18n';

const dayInMs = 24 * 60 * 60 * 1000;

const isDueSoon = (task, today, dueSoonEnd) => {
  if (!task.due_date || task.state?.is_completed) return false;
  const due = new Date(`${task.due_date}T00:00:00`);
  return due >= today && due <= dueSoonEnd;
};

const isOverdue = (task, today) => {
  if (!task.due_date || task.state?.is_completed) return false;
  return new Date(`${task.due_date}T00:00:00`) < today;
};

const relativeLabel = (value, common) => {
  if (!value) return '';
  const days = Math.round((Date.now() - new Date(value).getTime()) / dayInMs);
  if (days <= 0) return common.today;
  if (days === 1) return common.yesterday;
  return `${days} ${common.daysAgoSuffix}`;
};

const Dashboard = ({
  clients = [],
  clientsError = '',
  clientsLoading = false,
  workspace,
  navigate,
  onNewClient,
  onNewProject,
  onNewTask,
  userId,
}) => {
  const strings = useStrings();
  const t = strings.dashboard;
  const onboardingKey = `projectly-onboarding-dismissed:${userId}`;
  const [showOnboarding, setShowOnboarding] = useState(
    () => window.localStorage.getItem(onboardingKey) !== 'true',
  );
  const actionLabel = strings.common.activityLabels;
  const [activityActionFilter, setActivityActionFilter] = useState('all');
  const [activityProjectFilter, setActivityProjectFilter] = useState('all');
  const {
    activity,
    error,
    loading,
    runningTaskId,
    setFilter,
    tasks,
    toggleTimer,
  } = workspace;
  const projectCount = useMemo(
    () =>
      new Set(
        clients.flatMap((client) =>
          client.projects.map((project) => project.id),
        ),
      ).size,
    [clients],
  );
  const setupLoading = clientsLoading || loading;
  const setupUnavailable = Boolean(clientsError || error);
  const setupSteps = [
    !setupLoading && !setupUnavailable && clients.length > 0,
    !setupLoading && !setupUnavailable && projectCount > 0,
    !loading && !setupUnavailable && tasks.length > 0,
  ];
  const completedSetupSteps = setupSteps.filter(Boolean).length;
  const setupComplete =
    !setupLoading &&
    !setupUnavailable &&
    completedSetupSteps === setupSteps.length;
  const todayKey = new Date().setHours(0, 0, 0, 0);
  const {
    attentionTasks,
    completedTasks,
    currentTasks,
    overdueCount,
    projects,
    dueSoonTasks,
  } = useMemo(() => {
    const today = new Date(todayKey);
    const dueSoonEnd = new Date(today.getTime() + 7 * dayInMs);
    const currentTasks = tasks.filter((task) => !task.state?.is_completed);
    const completedTasks = tasks.filter((task) => task.state?.is_completed);
    const dueSoonTasks = currentTasks.filter((task) =>
      isDueSoon(task, today, dueSoonEnd),
    );
    const overdueTasks = currentTasks.filter((task) => isOverdue(task, today));
    const projects = Object.values(
      tasks.reduce((groups, task) => {
        const project = task.project;
        if (!project) return groups;
        const current = groups[project.id] ?? {
          project,
          total: 0,
          completed: 0,
        };
        current.total += 1;
        if (task.state?.is_completed) current.completed += 1;
        groups[project.id] = current;
        return groups;
      }, {}),
    );

    return {
      attentionTasks: [
        ...overdueTasks.toSorted((first, second) =>
          first.due_date.localeCompare(second.due_date),
        ),
        ...dueSoonTasks.toSorted((first, second) =>
          first.due_date.localeCompare(second.due_date),
        ),
      ].slice(0, 6),
      completedTasks,
      currentTasks,
      dueSoonTasks,
      overdueCount: overdueTasks.length,
      overdueTasks,
      projects,
    };
  }, [tasks, todayKey]);
  const runningTask = useMemo(
    () => tasks.find((task) => task.id === runningTaskId),
    [runningTaskId, tasks],
  );
  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const projectOptions = useMemo(
    () =>
      Array.from(
        new Map(
          tasks.flatMap((task) =>
            [
              task.project,
              ...(task.linked_projects ?? []).map((link) => link.project),
            ]
              .filter(Boolean)
              .map((project) => [project.id, project]),
          ),
        ).values(),
      ).sort((first, second) => first.name.localeCompare(second.name)),
    [tasks],
  );
  const activityActions = useMemo(
    () =>
      Array.from(new Set(activity.map((item) => item.action).filter(Boolean))),
    [activity],
  );
  const visibleActivity = useMemo(
    () =>
      activity.filter((item) => {
        if (
          activityActionFilter !== 'all' &&
          item.action !== activityActionFilter
        ) {
          return false;
        }
        if (activityProjectFilter === 'all') return true;
        const task = taskById.get(item.task_id);
        return [
          task?.project,
          ...(task?.linked_projects ?? []).map((link) => link.project),
        ]
          .filter(Boolean)
          .some((project) => project.id === activityProjectFilter);
      }),
    [activity, activityActionFilter, activityProjectFilter, taskById],
  );
  const activityTimestamps = useMemo(
    () => activity.map((item) => new Date(item.created_at).getTime()),
    [activity],
  );
  const now = Date.now();
  let thisWeekActivity = 0;
  let previousWeekActivity = 0;
  for (const createdAt of activityTimestamps) {
    if (createdAt >= now - 7 * dayInMs && createdAt <= now) {
      thisWeekActivity += 1;
    } else if (
      createdAt >= now - 14 * dayInMs &&
      createdAt < now - 7 * dayInMs
    ) {
      previousWeekActivity += 1;
    }
  }
  const activityDelta = thisWeekActivity - previousWeekActivity;
  const openTasksWithFilter = (filter) => {
    setFilter(filter);
    navigate('tasks');
  };
  const dismissOnboarding = () => {
    try {
      window.localStorage.setItem(onboardingKey, 'true');
      setShowOnboarding(false);
    } catch (error) {
      toast.error(t.onboardingStorageError, {
        description: error.message,
      });
    }
  };
  const reopenOnboarding = () => {
    setShowOnboarding(true);
    try {
      window.localStorage.removeItem(onboardingKey);
    } catch (error) {
      toast.error(t.onboardingStorageError, {
        description: error.message,
      });
    }
  };
  const guidedSteps = [
    {
      title: t.onboardingClientTitle,
      description: t.onboardingClientDescription,
      action: t.onboardingCreateClient,
      complete: setupSteps[0],
      canStart: !clientsLoading,
      onClick: onNewClient,
      Icon: Building2,
    },
    {
      title: t.onboardingProjectTitle,
      description: t.onboardingProjectDescription,
      action: t.onboardingCreateProject,
      complete: setupSteps[1],
      canStart: !setupLoading && setupSteps[0],
      onClick: onNewProject,
      Icon: FolderKanban,
    },
    {
      title: t.onboardingTaskTitle,
      description: t.onboardingTaskDescription,
      action: t.onboardingCreateTask,
      complete: setupSteps[2],
      canStart: !setupLoading && setupSteps[1],
      onClick: onNewTask,
      Icon: ListTodo,
    },
  ];

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-auto pb-1">
      <section className="space-y-3 rounded-xl border bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {t.heading}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.description}
            </p>
          </div>
          {!showOnboarding && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reopenOnboarding}
            >
              <Sparkles aria-hidden="true" />
              {t.showOnboarding}
            </Button>
          )}
        </div>
      </section>

      {showOnboarding && (
        <section
          className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-4"
          aria-labelledby="onboarding-title"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
                <h2 id="onboarding-title" className="text-sm font-semibold">
                  {t.onboardingTitle}
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.onboardingDescription}
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {setupLoading
                  ? t.onboardingLoading
                  : setupUnavailable
                    ? t.onboardingLoadError
                    : setupComplete
                      ? t.onboardingComplete
                      : `${t.onboardingProgress}: ${completedSetupSteps}/${guidedSteps.length}`}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t.dismissOnboarding}
              onClick={dismissOnboarding}
            >
              <X />
            </Button>
          </div>
          <ol className="mt-4 grid gap-2 lg:grid-cols-3">
            {guidedSteps.map((step, index) => {
              const StepIcon = step.Icon;
              return (
                <li
                  key={step.title}
                  className={`rounded-lg border bg-background/80 p-3 ${
                    step.complete ? 'border-primary/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {step.complete ? (
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border text-[0.625rem] font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <StepIcon
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        {step.title}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {step.description}
                      </p>
                      {step.complete ? (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <CheckCircle2
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          {t.onboardingStepComplete}
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant={step.canStart ? 'outline' : 'ghost'}
                          className="mt-3"
                          disabled={
                            !step.canStart || setupLoading || setupUnavailable
                          }
                          onClick={step.onClick}
                        >
                          {setupUnavailable
                            ? t.onboardingLoadError
                            : setupLoading
                              ? t.onboardingLoading
                              : step.canStart
                                ? step.action
                                : t.onboardingStepLocked}
                          {step.canStart && <ArrowRight aria-hidden="true" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {clientsError && (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {clientsError}
        </div>
      )}

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {[
          [t.metrics.current, currentTasks.length, ListTodo, 'text-primary'],
          [
            t.metrics.completed,
            completedTasks.length,
            CheckCircle2,
            'text-success',
          ],
          [t.metrics.active, runningTaskId ? 1 : 0, Play, 'text-success'],
          [t.metrics.dueSoon, dueSoonTasks.length, CalendarDays, 'text-info'],
          [t.metrics.overdue, overdueCount, TriangleAlert, 'text-warning'],
        ].map(([label, value, Icon, color]) => (
          <MetricCard
            key={label}
            label={label}
            value={loading ? '-' : value}
            Icon={Icon}
            color={color}
            loading={loading}
            onClick={() =>
              openTasksWithFilter(
                {
                  [t.metrics.current]: 'current',
                  [t.metrics.completed]: 'completed',
                  [t.metrics.active]: 'active',
                  [t.metrics.dueSoon]: 'due-soon',
                  [t.metrics.overdue]: 'overdue',
                }[label],
              )
            }
          />
        ))}
      </section>

      <section
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
        aria-label={t.activityTrendTitle}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs font-medium">{t.activityTrendTitle}</p>
            <p className="text-[0.78125rem] text-muted-foreground">
              {t.activityTrendDescription}
            </p>
          </div>
        </div>
        <p className="text-sm font-semibold tabular-nums">
          {thisWeekActivity} ·{' '}
          {activityDelta > 0
            ? `+${activityDelta} ${t.activityUp}`
            : activityDelta < 0
              ? `${activityDelta} ${t.activityDown}`
              : t.activityEven}
        </p>
      </section>

      <div className="grid gap-3 xl:grid-cols-2">
        <section className="grid gap-3 xl:grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))]">
          <Frame stacked>
            <CompactSectionHeader
              title={t.attentionTitle}
              description={t.attentionDescription}
              action={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('tasks')}
                >
                  {t.allTasks} <ArrowRight />
                </Button>
              }
            />
            <FramePanel className="max-h-136 p-2 shadow-none">
              {runningTask && (
                <div className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/5 p-2.5">
                  <Play className="size-3.5 shrink-0 text-success" />
                  <p className="min-w-0 flex-1 truncate text-xs font-medium">
                    {runningTask.title}
                  </p>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="destructive"
                    aria-label={`${t.stopTimer}: ${runningTask.title}`}
                    title={t.stopTimer}
                    onClick={() => toggleTimer(runningTask)}
                  >
                    <Square />
                  </Button>
                </div>
              )}
              {!loading && !attentionTasks.length && !runningTask && (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  {t.noAttentionNeeded}
                </p>
              )}
              {attentionTasks.length > 0 && (
                <VirtualList
                  className="max-h-96"
                  estimateSize={68}
                  itemClassName="pb-2"
                  items={attentionTasks}
                  renderItem={(task) => (
                    <div className="flex items-center gap-2 rounded-lg border p-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {task.title}
                        </p>
                        <p className="mt-1 truncate text-[0.78125rem] text-muted-foreground">
                          {task.project?.name ?? strings.common.noProject} ·{' '}
                          {dateLabel(task.due_date)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge
                          size="sm"
                          variant={
                            isOverdue(task) ? 'warning-light' : 'secondary'
                          }
                        >
                          {isOverdue(task) ? t.overdueBadge : t.dueSoonBadge}
                        </Badge>
                        <Badge
                          size="sm"
                          variant={
                            priorityVariant[task.priority] ?? 'secondary'
                          }
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant={
                          runningTaskId === task.id ? 'destructive' : 'ghost'
                        }
                        aria-label={
                          runningTaskId === task.id
                            ? `${strings.taskList.stopTask} ${task.title}`
                            : `${strings.taskList.startTask} ${task.title}`
                        }
                        title={
                          runningTaskId === task.id
                            ? strings.taskList.stopTask
                            : strings.taskList.startTask
                        }
                        onClick={() => toggleTimer(task)}
                      >
                        {runningTaskId === task.id ? <Square /> : <Play />}
                      </Button>
                    </div>
                  )}
                />
              )}
            </FramePanel>
          </Frame>
        </section>

        <section className="grid gap-3 xl:grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))]">
          <Frame stacked>
            <FrameHeader className="flex-row items-start justify-between gap-2">
              <div>
                <FrameTitle className="text-sm">
                  {t.projectProgressTitle}
                </FrameTitle>
                <FrameDescription className="text-[0.78125rem]">
                  {t.projectProgressDescription}
                </FrameDescription>
              </div>
              <FolderKanban className="size-4 text-muted-foreground" />
            </FrameHeader>
            <FramePanel className="max-h-136 p-3 shadow-none">
              {projects.length ? (
                <VirtualList
                  className="max-h-96"
                  estimateSize={56}
                  itemClassName="pb-3"
                  items={projects}
                  getItemKey={(summary) => summary.project.id}
                  renderItem={({ project, total, completed }) => {
                    const percentage = Math.round((completed / total) * 100);
                    return (
                      <div>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="truncate font-medium">
                            {project.name}
                          </span>
                          <span className="shrink-0 text-[0.78125rem] text-muted-foreground">
                            {percentage}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[0.78125rem] text-muted-foreground">
                          {completed} of {total} tasks complete
                        </p>
                      </div>
                    );
                  }}
                />
              ) : (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  {strings.common.noProjectData}
                </p>
              )}
            </FramePanel>
          </Frame>
        </section>
      </div>

      <section className="grid gap-3 xl:grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))]">
        <Frame stacked>
          <FrameHeader className="gap-3">
            <div>
              <FrameTitle className="text-sm">
                {t.recentActivityTitle}
              </FrameTitle>
              <FrameDescription className="text-[0.78125rem]">
                {t.recentActivityDescription}
              </FrameDescription>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Select
                value={activityActionFilter}
                onValueChange={setActivityActionFilter}
              >
                <SelectTrigger aria-label={t.allActions}>
                  <SelectValue>
                    {activityActionFilter === 'all'
                      ? t.allActions
                      : (actionLabel[activityActionFilter] ??
                        activityActionFilter)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allActions}</SelectItem>
                  {activityActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {actionLabel[action] ?? action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <VirtualSelect
                ariaLabel={t.allProjects}
                searchLabel={t.allProjects}
                value={activityProjectFilter}
                onChange={setActivityProjectFilter}
                placeholder={t.allProjects}
                options={[
                  { value: 'all', label: t.allProjects },
                  ...projectOptions.map((project) => ({
                    value: project.id,
                    label: project.name,
                  })),
                ]}
              />
            </div>
          </FrameHeader>
          <FramePanel className="space-y-1 p-2 shadow-none">
            {visibleActivity.slice(0, 6).map((item) => {
              const task = taskById.get(item.task_id);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg px-1.5 py-2"
                >
                  <Activity className="size-3.5 shrink-0 text-muted-foreground" />
                  <p className="min-w-0 flex-1 truncate text-xs">
                    <span className="font-medium">
                      {actionLabel[item.action] ?? item.action}
                    </span>{' '}
                    {task?.title ?? strings.common.aTask}
                  </p>
                  <span className="shrink-0 text-[0.78125rem] text-muted-foreground">
                    {relativeLabel(item.created_at, strings.common)}
                  </span>
                </div>
              );
            })}
            {!visibleActivity.length && (
              <p className="p-4 text-center text-xs text-muted-foreground">
                {activity.length ? t.noFilteredActivity : t.recentActivityEmpty}
              </p>
            )}
          </FramePanel>
        </Frame>
      </section>
    </div>
  );
};

export default Dashboard;
