import { useQuery } from '@tanstack/react-query';
import { Building2, FolderKanban, ListTodo } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { dateLabel } from '@/components/Common/taskUtils';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const dayInMs = 24 * 60 * 60 * 1000;

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
  navigate,
  onNewClient,
  onNewProject,
  onNewTask,
  userId,
  workspaceId,
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
  const { error, loading, runningTask, runningTaskId, setFilter, toggleTimer } =
    workspace;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const {
    data: summary,
    error: summaryError,
    isLoading: summaryLoading,
  } = useQuery({
    queryKey: ['dashboard-summary', workspaceId, todayKey],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      const { data, error: queryError } = await supabase.rpc(
        'get_workspace_dashboard_summary',
        {
          p_workspace_id: workspaceId,
          p_today: todayKey,
        },
      );
      if (queryError) throw queryError;
      if (!data) throw new Error('Dashboard summary returned no data.');
      return data;
    },
  });
  const activity = summary?.activity ?? [];
  const dashboardLoading = loading || summaryLoading;
  const setupLoading = dashboardLoading;
  const setupUnavailable = Boolean(error || summaryError);
  const setupSteps = [
    !setupLoading && !setupUnavailable && (summary?.clientCount ?? 0) > 0,
    !setupLoading && !setupUnavailable && (summary?.projectCount ?? 0) > 0,
    !dashboardLoading &&
      !setupUnavailable &&
      (summary?.totalTaskCount ?? 0) > 0,
  ];
  const completedSetupSteps = setupSteps.filter(Boolean).length;
  const setupComplete =
    !setupLoading &&
    !setupUnavailable &&
    completedSetupSteps === setupSteps.length;
  const attentionTasks = summary?.attentionTasks ?? [];
  const completedTasks = summary?.completedTaskCount ?? 0;
  const currentTasks = summary?.currentTaskCount ?? 0;
  const dueSoonTasks = summary?.dueSoonCount ?? 0;
  const overdueCount = summary?.overdueCount ?? 0;
  const projects = summary?.projectProgress ?? [];
  const taskById = useMemo(
    () =>
      new Map(
        activity
          .filter((item) => item.task)
          .map((item) => [item.task_id, item.task]),
      ),
    [activity],
  );
  const projectOptions = summary?.projectOptions ?? [];
  const activityActions = summary?.activityActions ?? [];
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
  const thisWeekActivity = summary?.thisWeekActivity ?? 0;
  const previousWeekActivity = summary?.previousWeekActivity ?? 0;
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
      canStart: !setupLoading,
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
    completedSetupSteps,
    completedTasks,
    currentTasks,
    dateLabel,
    dismissOnboarding,
    dueSoonTasks,
    error: error || summaryError,
    guidedSteps,
    isOverdue,
    loading: dashboardLoading,
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
