import { Building2, FolderKanban, ListTodo } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { dateLabel } from '@/components/Common/taskUtils';
import { useStrings } from '@/lib/i18n';

const dayInMs = 24 * 60 * 60 * 1000;

function isDueSoon(task, today, dueSoonEnd) {
  if (!task.due_date || task.state?.is_completed) return false;
  const due = new Date(`${task.due_date}T00:00:00`);
  return due >= today && due <= dueSoonEnd;
}

function isOverdue(task, today = new Date()) {
  if (!task.due_date || task.state?.is_completed) return false;
  today.setHours(0, 0, 0, 0);
  return new Date(`${task.due_date}T00:00:00`) < today;
}

function relativeLabel(value, common) {
  if (!value) return '';
  const days = Math.round((Date.now() - new Date(value).getTime()) / dayInMs);
  if (days <= 0) return common.today;
  if (days === 1) return common.yesterday;
  return `${days} ${common.daysAgoSuffix}`;
}

export function useDashboard({
  clients,
  clientsError,
  clientsLoading,
  navigate,
  onNewClient,
  onNewProject,
  onNewTask,
  userId,
  workspace,
}) {
  const strings = useStrings();
  const t = strings.dashboard;
  const onboardingKey = `projectly-onboarding-dismissed:${userId}`;
  const [showOnboarding, setShowOnboarding] = useState(
    () => window.localStorage.getItem(onboardingKey) !== 'true',
  );
  const [activityActionFilter, setActivityActionFilter] = useState('all');
  const [activityProjectFilter, setActivityProjectFilter] = useState('all');
  const actionLabel = strings.common.activityLabels;
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
  const now = Date.now();
  const thisWeekActivity = activity.filter((item) => {
    const createdAt = new Date(item.created_at).getTime();
    return createdAt >= now - 7 * dayInMs && createdAt <= now;
  }).length;
  const previousWeekActivity = activity.filter((item) => {
    const createdAt = new Date(item.created_at).getTime();
    return createdAt >= now - 14 * dayInMs && createdAt < now - 7 * dayInMs;
  }).length;
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
      toast.error(t.onboardingStorageError, { description: error.message });
    }
  };
  const reopenOnboarding = () => {
    setShowOnboarding(true);
    try {
      window.localStorage.removeItem(onboardingKey);
    } catch (error) {
      toast.error(t.onboardingStorageError, { description: error.message });
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

  return {
    actionLabel,
    activity,
    activityActionFilter,
    activityActions,
    activityDelta,
    activityProjectFilter,
    attentionTasks,
    clientsError,
    completedSetupSteps,
    completedTasks,
    currentTasks,
    dateLabel,
    dismissOnboarding,
    dueSoonTasks,
    error,
    guidedSteps,
    isOverdue,
    loading,
    openTasksWithFilter,
    overdueCount,
    projects,
    projectOptions,
    relativeLabel,
    reopenOnboarding,
    runningTask,
    runningTaskId,
    setActivityActionFilter,
    setActivityProjectFilter,
    setupComplete,
    setupLoading,
    setupUnavailable,
    showOnboarding,
    strings,
    t,
    taskById,
    thisWeekActivity,
    toggleTimer,
    visibleActivity,
  };
}
