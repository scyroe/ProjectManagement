import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  ListTodo,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CompactSectionHeader,
  MetricCard,
  ProgressRow,
} from '@/components/Common/analytics-ui';
import {
  AnimatedTabIndicator,
  AnimatedTabPanel,
} from '@/components/Common/animated-tabs';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VirtualList } from '@/components/ui/virtual-list';
import { filterEntriesByRange, getRangeBounds } from '@/lib/activity';
import { useLanguage, useStrings } from '@/lib/i18n';
import TeamWorkloadPanel from './TeamWorkloadPanel';

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

const durationLabel = (minutes) =>
  `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const buildTabs = (t) => [
  { id: 'executive', label: t.tabs.executive },
  { id: 'operational', label: t.tabs.operational },
  { id: 'productivity', label: t.tabs.productivity },
];

const reportRangePresets = ['last7', 'last30', 'last90', 'custom'];

const metricCards = (summary, t) => [
  [t.metrics.totalTasks, summary.tasks.length, ListTodo, 'text-primary'],
  [t.metrics.completed, summary.completed.length, CheckCircle2, 'text-success'],
  [t.metrics.dueThisWeek, summary.dueSoon.length, TrendingUp, 'text-info'],
  [t.metrics.atRisk, summary.overdue.length, AlertTriangle, 'text-warning'],
];

const getActivitySubject = (item, taskById, t) => {
  if (!item.entity_type || item.entity_type === 'task') {
    return taskById.get(item.task_id)?.title ?? t.aTask;
  }
  const entityLabel = t.entityTypes[item.entity_type];
  return `${entityLabel}: ${item.entity_title}`;
};

const Reports = ({ workspace, navigate, userId }) => {
  const strings = useStrings();
  const t = strings.reports;
  const locale = useLanguage().language === 'ro' ? 'ro-RO' : 'en-US';
  const actionLabel = strings.common.activityLabels;
  const tabs = buildTabs(t);
  const {
    activity: personalActivity = [],
    loadMoreWorkspaceActivity,
    loading,
    tasks = [],
    workspaceActivity,
    workspaceActivityHasMore = false,
    workspaceActivityLoading = false,
    workspaceActivityLoadingMore = false,
  } = workspace;
  const todayKey = new Date().setHours(0, 0, 0, 0);
  const activity = workspaceActivity ?? personalActivity;
  const reportLoading = loading || workspaceActivityLoading;
  const [activeTab, setActiveTab] = useState('executive');
  const [preset, setPreset] = useState('last30');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [activityAction, setActivityAction] = useState('all');
  const [activityEntity, setActivityEntity] = useState('all');
  const [activityProject, setActivityProject] = useState('all');
  const [activitySearch, setActivitySearch] = useState('');
  const [activitySearchOpen, setActivitySearchOpen] = useState(false);
  const bounds = useMemo(
    () => getRangeBounds(preset, customRange),
    [customRange, preset],
  );
  const rangeActivity = useMemo(
    () => filterEntriesByRange(activity, bounds),
    [activity, bounds],
  );
  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const projectOptions = useMemo(
    () =>
      Array.from(
        new Map(
          tasks
            .flatMap((task) => [
              task.project,
              ...(task.linked_projects ?? []).map((link) => link.project),
            ])
            .filter(Boolean)
            .map((project) => [project.id, project]),
        ).values(),
      ).sort((first, second) => first.name.localeCompare(second.name)),
    [tasks],
  );
  const searchValue = activitySearch.trim().toLocaleLowerCase();
  const filteredActivity = useMemo(
    () =>
      rangeActivity.filter((item) => {
        const task = taskById.get(item.task_id);
        if (activityAction !== 'all' && item.action !== activityAction) {
          return false;
        }
        if (
          activityEntity !== 'all' &&
          (item.entity_type ?? 'task') !== activityEntity
        ) {
          return false;
        }
        if (activityProject !== 'all') {
          const projectIds = [
            task?.project?.id,
            ...(task?.linked_projects ?? []).map((link) => link.project?.id),
            item.project_id,
          ];
          if (!projectIds.includes(activityProject)) return false;
        }
        if (!searchValue) return true;
        return `${getActivitySubject(item, taskById, t)} ${task?.project?.name ?? ''} ${item.entity_detail ?? ''} ${item.user_email ?? ''} ${item.note ?? ''}`
          .toLocaleLowerCase()
          .includes(searchValue);
      }),
    [
      activityAction,
      activityEntity,
      activityProject,
      rangeActivity,
      searchValue,
      t,
      taskById,
    ],
  );
  const { activeDays, maxTimeMinutes, timeAllocation, trackedMinutes } =
    useMemo(() => {
      const days = new Set();
      const timeByProject = new Map();
      const estimatedTaskIds = new Set();
      let trackedMinutes = 0;

      for (const item of filteredActivity) {
        const date = item.started_at ?? item.created_at;
        if (date) days.add(date.slice(0, 10));
        trackedMinutes += item.duration_minutes ?? 0;
        if (!item.duration_minutes) continue;

        const task = taskById.get(item.task_id);
        const projectId = task?.project?.id ?? 'unassigned';
        const current = timeByProject.get(projectId) ?? {
          id: projectId,
          name: task?.project?.name ?? t.noProject,
          minutes: 0,
          estimateMinutes: 0,
        };
        current.minutes += item.duration_minutes;
        if (task && !estimatedTaskIds.has(task.id)) {
          current.estimateMinutes += task.estimate_minutes ?? 0;
          estimatedTaskIds.add(task.id);
        }
        timeByProject.set(projectId, current);
      }

      const timeAllocation = Array.from(timeByProject.values())
        .sort((first, second) => second.minutes - first.minutes)
        .slice(0, 4);

      return {
        activeDays: days.size,
        maxTimeMinutes: Math.max(
          ...timeAllocation.map((item) => item.minutes),
          1,
        ),
        timeAllocation,
        trackedMinutes,
      };
    }, [filteredActivity, t.noProject, taskById]);
  const {
    completedTasks,
    completionRate,
    currentTasks,
    dueSoonTasks,
    overdueTasks,
    projectSummary,
    riskItems,
    statusCounts,
    summary,
    topProjects,
    maxStatusCount,
  } = useMemo(() => {
    const today = new Date(todayKey);
    const dueSoonEnd = new Date(today.getTime() + 7 * dayInMs);
    const currentTasks = tasks.filter((task) => !task.state?.is_completed);
    const completedTasks = tasks.filter((task) => task.state?.is_completed);
    const dueSoonTasks = currentTasks
      .filter((task) => isDueSoon(task, today, dueSoonEnd))
      .slice(0, 5);
    const overdueTasks = currentTasks
      .filter((task) => isOverdue(task, today))
      .slice(0, 5);
    const projectSummary = Object.values(
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
    const statusCounts = tasks.reduce((counts, task) => {
      const status = task.state?.name ?? 'Unassigned';
      counts[status] = (counts[status] ?? 0) + 1;
      return counts;
    }, {});
    const completionRate = tasks.length
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0;

    return {
      completedTasks,
      completionRate,
      currentTasks,
      dueSoonTasks,
      maxStatusCount: Math.max(...Object.values(statusCounts), 1),
      overdueTasks,
      projectSummary,
      riskItems: [...overdueTasks, ...dueSoonTasks].slice(0, 5),
      statusCounts,
      summary: {
        tasks,
        completed: completedTasks,
        dueSoon: dueSoonTasks,
        overdue: overdueTasks,
      },
      topProjects: [...projectSummary]
        .sort((first, second) => second.total - first.total)
        .slice(0, 4),
    };
  }, [tasks, todayKey]);

  const taskFilterByLabel = {
    [t.metrics.totalTasks]: 'current',
    [t.metrics.completed]: 'completed',
    [t.metrics.dueThisWeek]: 'due-soon',
    [t.metrics.atRisk]: 'overdue',
    [t.metrics.currentFocus]: 'current',
  };
  const openTasksWithFilter = (label) => {
    const filter = taskFilterByLabel[label];
    if (!filter) return;
    workspace.setFilter(filter);
    navigate('tasks');
  };

  const handleExportCsv = () => {
    const csvCell = (value) => {
      const text = String(value ?? '').replaceAll('"', '""');
      return `"${/^[=+\-@\t\r]/.test(text) ? `'${text}` : text}"`;
    };
    const formatActivityDate = (value) =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value));
    const rows = [
      [
        t.csv.date,
        t.csv.action,
        t.csv.entityType,
        t.csv.entity,
        t.csv.project,
        t.csv.person,
        t.csv.duration,
      ],
      ...filteredActivity.map((item) => {
        const task = taskById.get(item.task_id);
        return [
          formatActivityDate(item.created_at),
          actionLabel[item.action] ?? item.action,
          t.entityTypes[item.entity_type ?? 'task'],
          item.entity_title ?? getActivitySubject(item, taskById, t),
          item.entity_type === 'project'
            ? item.entity_title
            : (task?.project?.name ?? t.noProject),
          item.user_email,
          item.duration_minutes,
        ];
      }),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blobUrl = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `project-report-${preset === 'custom' ? `${customRange.from || 'start'}-${customRange.to || 'end'}` : preset}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
  };

  const handleActivitySearchToggle = () => {
    if (activitySearchOpen) {
      setActivitySearchOpen(false);
      setActivitySearch('');
      return;
    }
    setActivitySearchOpen(true);
  };

  const ExecutiveView = () => (
    <div className="space-y-3">
      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards(summary, t).map(([label, value, Icon, color]) => (
          <MetricCard
            key={label}
            label={label}
            value={value}
            Icon={Icon}
            color={color}
            loading={reportLoading}
            compact
            onClick={() => openTasksWithFilter(label)}
          />
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))]">
        <Frame stacked>
          <CompactSectionHeader
            title={t.operationalHealthTitle}
            description={t.operationalHealthDescription}
            action={
              <div className="rounded-full border bg-muted/60 px-2 py-1 text-xs font-medium text-muted-foreground">
                {completionRate}% {t.completeSuffix}
              </div>
            }
          />
          <FramePanel className="space-y-4 p-3 shadow-none">
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {t.completionRate}
                  </p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">
                    {completionRate}%
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>
                    {completedTasks.length} {t.doneSuffix}
                  </p>
                  <p>
                    {currentTasks.length} {t.activeSuffix}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {topProjects.map(({ project, total, completed }) => {
                const percentage = total
                  ? Math.round((completed / total) * 100)
                  : 0;
                return (
                  <ProgressRow
                    key={project.id}
                    label={project.name}
                    value={`${completed}/${total}`}
                    progress={percentage}
                    barClassName="bg-success"
                    valueClassName="text-xs text-muted-foreground"
                  />
                );
              })}
            </div>
          </FramePanel>
        </Frame>

        <Frame stacked>
          <CompactSectionHeader
            title={t.portfolioMixTitle}
            description={t.portfolioMixDescription}
          />
          <FramePanel className="space-y-2 p-3 shadow-none">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium">{status}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {!Object.keys(statusCounts).length && (
              <p className="p-4 text-center text-xs text-muted-foreground">
                {t.noStatusData}
              </p>
            )}
          </FramePanel>
        </Frame>
      </section>

      <section className="grid gap-3 xl:grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))]">
        <Frame stacked>
          <CompactSectionHeader
            title={t.executiveWatchlistTitle}
            description={t.executiveWatchlistDescription}
          />
          <FramePanel className="max-h-136 p-2 shadow-none">
            {riskItems.length > 0 && (
              <VirtualList
                className="max-h-96"
                estimateSize={64}
                getItemKey={(task) => task.id}
                itemClassName="pb-2"
                items={riskItems}
                renderItem={(task) => {
                  const isLate = isOverdue(task);
                  return (
                    <div className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {task.project?.name ?? t.noProject} ·{' '}
                          {task.due_date
                            ? new Date(
                                `${task.due_date}T00:00:00`,
                              ).toLocaleDateString()
                            : t.noDueDate}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
                          isLate
                            ? 'bg-warning/15 text-warning-foreground'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {isLate ? t.overdueBadge : t.dueSoonBadge}
                      </span>
                    </div>
                  );
                }}
              />
            )}
            {!riskItems.length && (
              <p className="p-4 text-center text-xs text-muted-foreground">
                {t.noDeliveryRisks}
              </p>
            )}
          </FramePanel>
        </Frame>

        <Frame stacked>
          <CompactSectionHeader
            title={t.recentActivityTitle}
            description={t.recentActivityDescriptionExecutive}
          />
          <FramePanel className="space-y-1 p-2 shadow-none">
            {filteredActivity.slice(0, 5).map((item) => {
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-2 rounded-lg px-1.5 py-2"
                >
                  <Clock3 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-medium">
                        {actionLabel[item.action] ?? item.action}
                      </span>{' '}
                      {getActivitySubject(item, taskById, t)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {relativeLabel(item.created_at, strings.common)}
                    </p>
                  </div>
                </div>
              );
            })}
            {!filteredActivity.length && (
              <p className="p-4 text-center text-xs text-muted-foreground">
                {t.noRecentActivity}
              </p>
            )}
          </FramePanel>
        </Frame>
      </section>
    </div>
  );

  const OperationalView = () => (
    <div className="space-y-3">
      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards(summary, t).map(([label, value, Icon, color]) => (
          <MetricCard
            key={label}
            label={label}
            value={value}
            Icon={Icon}
            color={color}
            loading={loading}
            compact
            onClick={() => openTasksWithFilter(label)}
          />
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))]">
        <Frame stacked>
          <FrameHeader>
            <FrameTitle className="text-sm">{t.workCompletedTitle}</FrameTitle>
            <FrameDescription className="text-xs">
              {t.workCompletedDescription}
            </FrameDescription>
          </FrameHeader>
          <FramePanel className="space-y-3 p-3 shadow-none">
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {t.completionLabel}
                </span>
                <span className="text-sm font-semibold">{completionRate}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {completedTasks.length} {t.doneSuffix}
                </span>
                <span>
                  {currentTasks.length} {t.activeSuffix}
                </span>
              </div>
            </div>

            {projectSummary.length ? (
              <VirtualList
                className="max-h-96"
                estimateSize={56}
                getItemKey={(summary) => summary.project.id}
                itemClassName="pb-2"
                items={projectSummary}
                renderItem={({ project, total, completed }) => {
                  const percentage = total
                    ? Math.round((completed / total) * 100)
                    : 0;
                  return (
                    <div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="truncate font-medium">
                          {project.name}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {percentage}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-success transition-[width] duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
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

        <Frame stacked>
          <FrameHeader>
            <FrameTitle className="text-sm">{t.workByStatusTitle}</FrameTitle>
            <FrameDescription className="text-xs">
              {t.workByStatusDescription}
            </FrameDescription>
          </FrameHeader>
          <FramePanel className="space-y-2 p-3 shadow-none">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium">{status}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {!Object.keys(statusCounts).length && (
              <p className="p-4 text-center text-xs text-muted-foreground">
                {t.noStatusData}
              </p>
            )}
          </FramePanel>
        </Frame>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <Frame stacked>
          <FrameHeader>
            <FrameTitle className="text-sm">
              {t.priorityWatchlistTitle}
            </FrameTitle>
            <FrameDescription className="text-xs">
              {t.priorityWatchlistDescription}
            </FrameDescription>
          </FrameHeader>
          <FramePanel className="space-y-2 p-2 shadow-none">
            {[...dueSoonTasks, ...overdueTasks].slice(0, 6).map((task) => {
              const isLate = isOverdue(task);
              return (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{task.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {task.project?.name ?? t.noProject} ·{' '}
                      {task.due_date
                        ? new Date(
                            `${task.due_date}T00:00:00`,
                          ).toLocaleDateString()
                        : t.noDueDate}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
                        isLate
                          ? 'bg-warning/15 text-warning-foreground'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {isLate ? t.overdueBadge : t.dueSoonBadge}
                    </span>
                  </div>
                </div>
              );
            })}
            {!dueSoonTasks.length && !overdueTasks.length && (
              <p className="p-4 text-center text-xs text-muted-foreground">
                {t.noAttentionNeeded}
              </p>
            )}
          </FramePanel>
        </Frame>

        <Frame stacked>
          <FrameHeader>
            <FrameTitle className="text-sm">{t.recentActivityTitle}</FrameTitle>
            <FrameDescription className="text-xs">
              {t.recentActivityDescriptionOperational}
            </FrameDescription>
          </FrameHeader>
          <FramePanel className="space-y-1 p-2 shadow-none">
            {filteredActivity.slice(0, 6).map((item) => {
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-2 rounded-lg px-1.5 py-2"
                >
                  <Clock3 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-medium">
                        {actionLabel[item.action] ?? item.action}
                      </span>{' '}
                      {getActivitySubject(item, taskById, t)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {relativeLabel(item.created_at, strings.common)}
                    </p>
                  </div>
                </div>
              );
            })}
            {!filteredActivity.length && (
              <p className="p-4 text-center text-xs text-muted-foreground">
                {t.recentActivityFallbackOperational}
              </p>
            )}
          </FramePanel>
        </Frame>
      </section>
    </div>
  );

  const ProductivityView = () => (
    <div className="space-y-3">
      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [t.metrics.trackedTime, trackedMinutes, Clock3, 'text-primary'],
          [t.metrics.daysActive, activeDays, TrendingUp, 'text-success'],
          [t.metrics.currentFocus, currentTasks.length, ListTodo, 'text-info'],
          [
            t.metrics.completed,
            completedTasks.length,
            CheckCircle2,
            'text-warning',
          ],
        ].map(([label, value, Icon, color]) => (
          <MetricCard
            key={label}
            label={label}
            value={
              label === t.metrics.trackedTime
                ? `${Math.floor(value / 60)}h ${value % 60}m`
                : value
            }
            Icon={Icon}
            color={color}
            compact
            onClick={() => openTasksWithFilter(label)}
          />
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))]">
        <Frame stacked>
          <FrameHeader>
            <FrameTitle className="text-sm">{t.timeAllocationTitle}</FrameTitle>
            <FrameDescription className="text-xs">
              {t.timeAllocationDescription}
            </FrameDescription>
          </FrameHeader>
          <FramePanel className="space-y-3 p-3 shadow-none">
            {timeAllocation.length ? (
              <VirtualList
                className="max-h-136"
                estimateSize={72}
                getItemKey={(item) => item.id}
                itemClassName="pb-3"
                items={timeAllocation}
                renderItem={({ name, minutes, estimateMinutes }) => {
                  const variance = minutes - estimateMinutes;
                  return (
                    <div>
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate font-medium">{name}</span>
                        <span className="text-xs text-muted-foreground">
                          {durationLabel(minutes)}
                        </span>
                      </div>
                      <p className="mb-1 text-2xs text-muted-foreground">
                        {estimateMinutes
                          ? `${durationLabel(estimateMinutes)} ${t.estimatedSuffix} · ${
                              variance > 0 ? t.overEstimate : t.underEstimate
                            } ${durationLabel(Math.abs(variance))}`
                          : t.noEstimate}
                      </p>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(100, (minutes / maxTimeMinutes) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }}
              />
            ) : (
              <p className="p-4 text-center text-xs text-muted-foreground">
                {t.noTimeAllocation}
              </p>
            )}
          </FramePanel>
        </Frame>

        <Frame stacked>
          <FrameHeader>
            <FrameTitle className="text-sm">
              {t.priorityMomentumTitle}
            </FrameTitle>
            <FrameDescription className="text-xs">
              {t.priorityMomentumDescription}
            </FrameDescription>
          </FrameHeader>
          <FramePanel className="space-y-3 p-3 shadow-none">
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {t.completionVelocity}
              </p>
              <p className="mt-1 text-3xl font-semibold">{completionRate}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {completedTasks.length} {t.tasksClosedSuffix}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>{t.dueThisWeekLabel}</span>
                <span className="font-medium">{dueSoonTasks.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>{t.overdueLabel}</span>
                <span className="font-medium">{overdueTasks.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>{t.trackedActivityLabel}</span>
                <span className="font-medium">
                  {filteredActivity.length} {t.itemsSuffix}
                </span>
              </div>
            </div>
          </FramePanel>
        </Frame>
      </section>

      <Frame stacked>
        <FrameHeader>
          <FrameTitle className="text-sm">{t.recentWorkTitle}</FrameTitle>
          <FrameDescription className="text-xs">
            {t.recentWorkDescription}
          </FrameDescription>
        </FrameHeader>
        <FramePanel className="space-y-1 p-2 shadow-none">
          {filteredActivity.slice(0, 6).map((item) => {
            return (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded-lg px-1.5 py-2"
              >
                <Clock3 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs">
                    <span className="font-medium">
                      {actionLabel[item.action] ?? item.action}
                    </span>{' '}
                    {getActivitySubject(item, taskById, t)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {relativeLabel(item.created_at, strings.common)}
                  </p>
                </div>
              </div>
            );
          })}
          {!filteredActivity.length && (
            <p className="p-4 text-center text-xs text-muted-foreground">
              {t.recentActivityFallbackProductivity}
            </p>
          )}
        </FramePanel>
      </Frame>
    </div>
  );

  const renderCurrentView = () => {
    if (activeTab === 'operational') return <OperationalView />;
    if (activeTab === 'productivity') return <ProductivityView />;
    return <ExecutiveView />;
  };

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-auto pb-1">
      <TeamWorkloadPanel tasks={tasks} userId={userId} />
      <section className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2">
        <fieldset className="flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
          <legend className="sr-only">{t.rangeLabel}</legend>
          {reportRangePresets.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={preset === value}
              onClick={() => setPreset(value)}
              className={`relative rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                preset === value
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {preset === value && (
                <AnimatedTabIndicator layoutId="reports-range-tabs" />
              )}
              <span className="relative z-10">
                {strings.activity.presets[value]}
              </span>
            </button>
          ))}
        </fieldset>
        <div className="relative flex min-w-0 flex-wrap items-center justify-end gap-2">
          <div
            aria-hidden={activitySearchOpen}
            className={`flex min-w-0 flex-wrap items-center justify-end gap-2 ${
              activitySearchOpen ? 'invisible' : ''
            }`}
            inert={activitySearchOpen}
          >
            <Select value={activityAction} onValueChange={setActivityAction}>
              <SelectTrigger
                aria-label={t.actionFilter}
                className="w-40 text-xs"
              >
                <SelectValue>
                  {activityAction === 'all'
                    ? t.allActions
                    : (actionLabel[activityAction] ?? activityAction)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allActions}</SelectItem>
                {Object.entries(actionLabel).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activityEntity} onValueChange={setActivityEntity}>
              <SelectTrigger
                aria-label={t.entityFilter}
                className="w-36 text-xs"
              >
                <SelectValue>
                  {activityEntity === 'all'
                    ? t.allEntities
                    : t.entityTypes[activityEntity]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allEntities}</SelectItem>
                {Object.entries(t.entityTypes).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activityProject} onValueChange={setActivityProject}>
              <SelectTrigger
                aria-label={t.projectFilter}
                className="w-44 min-w-0 text-xs"
              >
                <SelectValue>
                  {activityProject === 'all'
                    ? t.allProjects
                    : (projectOptions.find(
                        (project) => project.id === activityProject,
                      )?.name ?? t.allProjects)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allProjects}</SelectItem>
                {projectOptions.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {preset === 'custom' && (
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  className="w-auto"
                  aria-label={t.rangeFrom}
                  max={customRange.to || undefined}
                  value={customRange.from}
                  onChange={(event) =>
                    setCustomRange({ ...customRange, from: event.target.value })
                  }
                />
                <span className="text-xs text-muted-foreground">
                  {strings.activity.rangeTo}
                </span>
                <Input
                  type="date"
                  className="w-auto"
                  aria-label={t.rangeTo}
                  min={customRange.from || undefined}
                  value={customRange.to}
                  onChange={(event) =>
                    setCustomRange({ ...customRange, to: event.target.value })
                  }
                />
              </div>
            )}
          </div>
          {activitySearchOpen && (
            <InputGroup className="absolute inset-y-0 left-0 right-[5rem] z-10 w-auto bg-background">
              <InputGroupAddon align="inline-start">
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                autoFocus
                type="search"
                aria-label={t.activitySearch}
                placeholder={t.activitySearch}
                value={activitySearch}
                onChange={(event) => setActivitySearch(event.target.value)}
              />
            </InputGroup>
          )}
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={activitySearchOpen ? t.closeSearch : t.activitySearch}
            aria-expanded={activitySearchOpen}
            title={activitySearchOpen ? t.closeSearch : t.activitySearch}
            onClick={handleActivitySearchToggle}
          >
            {activitySearchOpen ? <X /> : <Search />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t.exportCsv}
            title={t.exportCsv}
            disabled={!filteredActivity.length}
            onClick={handleExportCsv}
          >
            <Download />
          </Button>
        </div>
      </section>
      {workspace.workspaceActivityError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {t.activityLoadError}
        </p>
      )}
      {workspaceActivity != null && (
        <div className="flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
          <span aria-live="polite">
            {workspaceActivity.length} {t.activityLoadedSuffix}
          </span>
          {workspaceActivityHasMore && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={workspaceActivityLoadingMore}
              onClick={() => loadMoreWorkspaceActivity()}
            >
              {workspaceActivityLoadingMore
                ? t.loadingMoreActivity
                : t.loadMoreActivity}
            </Button>
          )}
        </div>
      )}
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/30 p-1.5"
        role="tablist"
        aria-label={t.tabListLabel}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {activeTab === tab.id && (
              <AnimatedTabIndicator layoutId="reports-content-tabs" />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatedTabPanel activeId={activeTab} className="min-h-0 flex-1">
        {renderCurrentView()}
      </AnimatedTabPanel>
    </div>
  );
};

export default Reports;
