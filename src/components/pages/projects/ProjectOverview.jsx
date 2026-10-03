import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  Users,
} from 'lucide-react';
import { useMemo } from 'react';
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
import { useLanguage, useStrings } from '@/lib/i18n';

const dayInMs = 24 * 60 * 60 * 1000;

const toDate = (value) => (value ? new Date(`${value}T00:00:00`) : null);

const ProjectOverview = ({ onEditProject, projects = [], tasks }) => {
  const strings = useStrings();
  const t = strings.projectOverview;
  const locale = useLanguage().language === 'ro' ? 'ro-RO' : 'en-US';
  const todayKey = new Date().setHours(0, 0, 0, 0);
  const {
    completedTaskCount,
    contributorCount,
    overdueTaskCount,
    projectSummaries,
    today,
  } = useMemo(() => {
    const today = new Date(todayKey);
    const projectGroups = new Map(
      projects.map((project) => [
        project.id,
        {
          project,
          tasks: [],
          total: 0,
          completed: 0,
          overdue: 0,
          estimate: 0,
        },
      ]),
    );
    const contributors = new Set();
    let completedTaskCount = 0;
    let overdueTaskCount = 0;

    for (const task of tasks) {
      if (task.assigned_to) contributors.add(task.assigned_to);
      if (task.state?.is_completed) completedTaskCount += 1;
      const overdue =
        !task.state?.is_completed &&
        task.due_date &&
        toDate(task.due_date) < today;
      if (overdue) overdueTaskCount += 1;

      const relatedProjects = new Map(
        [
          task.project,
          ...(task.linked_projects ?? []).map((link) => link.project),
        ]
          .filter(Boolean)
          .map((project) => [project.id, project]),
      );
      for (const project of relatedProjects.values()) {
        const entry = projectGroups.get(project.id) ?? {
          project,
          tasks: [],
          total: 0,
          completed: 0,
          overdue: 0,
          estimate: 0,
        };
        entry.project = { ...entry.project, ...project };
        entry.tasks.push(task);
        entry.total += 1;
        entry.completed += task.state?.is_completed ? 1 : 0;
        entry.overdue += overdue ? 1 : 0;
        entry.estimate += task.estimate_minutes ?? 0;
        projectGroups.set(project.id, entry);
      }
    }

    return {
      completedTaskCount,
      contributorCount: contributors.size,
      overdueTaskCount,
      projectSummaries: Array.from(projectGroups.values()).sort(
        (first, second) =>
          first.project.name.localeCompare(second.project.name),
      ),
      today,
    };
  }, [projects, tasks, todayKey]);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }),
    [locale],
  );
  const formatDate = (date) => dateFormatter.format(date);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          icon={CheckCircle2}
          label={t.completedWork}
          value={completedTaskCount}
        />
        <Metric
          icon={AlertTriangle}
          label={t.overdueWork}
          value={overdueTaskCount}
        />
        <Metric icon={Users} label={t.contributors} value={contributorCount} />
      </div>
      <Frame className="group/frame" stacked>
        <FrameHeader>
          <FrameTitle>{t.title}</FrameTitle>
          <FrameDescription>{t.description}</FrameDescription>
        </FrameHeader>
        <FramePanel className="max-h-136 overflow-hidden p-0 shadow-none group-data-[maximized=true]/frame:flex-1 group-data-[maximized=true]/frame:min-h-0 group-data-[maximized=true]/frame:max-h-none">
          {projectSummaries.length ? (
            <VirtualList
              ariaLabel={t.title}
              className="max-h-136 p-4 group-data-[maximized=true]/frame:h-full group-data-[maximized=true]/frame:min-h-0 group-data-[maximized=true]/frame:max-h-none"
              estimateSize={320}
              getItemKey={(summary) => summary.project.id}
              itemClassName="pb-4"
              items={projectSummaries}
              renderItem={({
                project,
                tasks: projectTasks,
                total,
                completed,
                overdue,
                estimate,
              }) => {
                const progress = total
                  ? Math.round((completed / total) * 100)
                  : 0;
                const hasOpenTasks = total > completed;
                const deadline = toDate(project.due_date);
                const deadlinePassed = deadline && deadline < today;
                const deadlineSoon =
                  deadline &&
                  deadline >= today &&
                  deadline <= new Date(today.getTime() + 14 * dayInMs);
                const atRisk =
                  overdue > 0 ||
                  (hasOpenTasks && (deadlinePassed || deadlineSoon));
                const health =
                  total > 0 && completed === total
                    ? 'completed'
                    : atRisk
                      ? 'atRisk'
                      : 'onTrack';
                const datedTasks = projectTasks.filter((task) => task.due_date);
                const startDate =
                  toDate(project.start_date) ??
                  datedTasks
                    .map((task) => toDate(task.due_date))
                    .toSorted((first, second) => first - second)[0] ??
                  today;
                let endDate =
                  deadline ??
                  datedTasks
                    .map((task) => toDate(task.due_date))
                    .toSorted((first, second) => second - first)[0] ??
                  new Date(startDate.getTime() + 14 * dayInMs);
                if (endDate <= startDate) {
                  endDate = new Date(startDate.getTime() + dayInMs);
                }
                const rangeLength = endDate.getTime() - startDate.getTime();
                const todayPosition = Math.max(
                  0,
                  Math.min(
                    100,
                    ((today.getTime() - startDate.getTime()) / rangeLength) *
                      100,
                  ),
                );
                const milestones = datedTasks.map((task) => ({
                  task,
                  position: Math.max(
                    0,
                    Math.min(
                      100,
                      ((toDate(task.due_date).getTime() - startDate.getTime()) /
                        rangeLength) *
                        100,
                    ),
                  ),
                }));
                return (
                  <div className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {project.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {project.code}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            size="sm"
                            variant={
                              health === 'atRisk'
                                ? 'warning-light'
                                : health === 'completed'
                                  ? 'success-light'
                                  : 'info-light'
                            }
                          >
                            {t.health[health]}
                          </Badge>
                          <span className="text-sm font-semibold">
                            {progress}%
                          </span>
                        </div>
                        {onEditProject && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onEditProject(project)}
                            aria-label={t.editProject}
                            title={t.editProject}
                          >
                            <Pencil />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span>
                        {completed} of {total} tasks complete
                      </span>
                      <span
                        className={
                          overdue ? 'text-warning-foreground' : undefined
                        }
                      >
                        {overdue} {t.overdueSuffix}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        {Math.round(estimate / 60)}h {t.estimatedSuffix}
                      </span>
                    </div>
                    <div className="mt-3 border-t pt-3">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                        <CalendarDays className="size-3.5 text-muted-foreground" />
                        {t.timeline}
                      </div>
                      <div
                        className="relative h-2 rounded-full bg-muted"
                        aria-hidden="true"
                      >
                        <span
                          className="absolute top-0 h-full w-0.5 bg-foreground"
                          style={{ left: `${todayPosition}%` }}
                        />
                        {milestones.map(({ task, position }) => (
                          <span
                            key={`${task.id}-${project.id}`}
                            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card"
                            style={{ left: `${position}%` }}
                          />
                        ))}
                      </div>
                      <div className="mt-1.5 flex justify-between gap-2 text-[0.6875rem] text-muted-foreground">
                        <span>
                          {project.start_date
                            ? formatDate(toDate(project.start_date))
                            : formatDate(startDate)}
                        </span>
                        <span>
                          {project.due_date
                            ? formatDate(toDate(project.due_date))
                            : formatDate(endDate)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.6875rem] text-muted-foreground">
                        {milestones.slice(0, 3).map(({ task }) => (
                          <span key={`${task.id}-${project.id}`}>
                            {task.title} · {formatDate(toDate(task.due_date))}
                          </span>
                        ))}
                        {milestones.length > 3 && (
                          <span>
                            +{milestones.length - 3} {t.moreMilestones}
                          </span>
                        )}
                        {!milestones.length && <span>{t.noMilestones}</span>}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          ) : (
            <p className="p-5 text-center text-sm text-muted-foreground">
              {t.empty}
            </p>
          )}
        </FramePanel>
      </Frame>
    </div>
  );
};

const Metric = ({ icon: Icon, label, value }) => (
  <Frame dense>
    <FramePanel className="flex items-center gap-3 p-4 shadow-none">
      <Icon className="size-5 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
      </div>
    </FramePanel>
  </Frame>
);

export default ProjectOverview;
