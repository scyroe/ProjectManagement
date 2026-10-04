import {
  CalendarDays,
  CheckCircle2,
  ListTodo,
  Play,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import { MetricCard } from '@/components/Common/analytics-ui';
import DashboardAttentionPanel from '@/components/pages/dashboard/DashboardAttentionPanel';
import DashboardOnboarding from '@/components/pages/dashboard/DashboardOnboarding';
import DashboardProjectProgress from '@/components/pages/dashboard/DashboardProjectProgress';
import DashboardRecentActivity from '@/components/pages/dashboard/DashboardRecentActivity';
import { useDashboard } from '@/hooks/common/use-dashboard';

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
  const {
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
    taskById,
    t,
    thisWeekActivity,
    toggleTimer,
    visibleActivity,
  } = useDashboard({
    clients,
    clientsError,
    clientsLoading,
    navigate,
    onNewClient,
    onNewProject,
    onNewTask,
    userId,
    workspace,
  });

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-auto pb-1">
      <DashboardOnboarding
        completedSetupSteps={completedSetupSteps}
        guidedSteps={guidedSteps}
        onDismiss={dismissOnboarding}
        onReopen={reopenOnboarding}
        setupComplete={setupComplete}
        setupLoading={setupLoading}
        setupUnavailable={setupUnavailable}
        showOnboarding={showOnboarding}
        t={t}
      />

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
        <DashboardAttentionPanel
          attentionTasks={attentionTasks}
          dateLabel={dateLabel}
          isOverdue={isOverdue}
          loading={loading}
          navigate={navigate}
          runningTask={runningTask}
          runningTaskId={runningTaskId}
          strings={strings}
          t={t}
          toggleTimer={toggleTimer}
        />
        <DashboardProjectProgress projects={projects} strings={strings} t={t} />
      </div>

      <DashboardRecentActivity
        actionLabel={actionLabel}
        activity={activity}
        activityActionFilter={activityActionFilter}
        activityActions={activityActions}
        activityProjectFilter={activityProjectFilter}
        projectOptions={projectOptions}
        relativeLabel={relativeLabel}
        setActivityActionFilter={setActivityActionFilter}
        setActivityProjectFilter={setActivityProjectFilter}
        strings={strings}
        t={t}
        taskById={taskById}
        visibleActivity={visibleActivity}
      />
    </div>
  );
};

export default Dashboard;
