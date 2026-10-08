import {
  Activity,
  CalendarDays,
  Crosshair,
  ListChecks,
  ListTodo,
  MessageSquare,
  Users,
} from 'lucide-react';
import { useCallback } from 'react';
import ActivityPanel from '@/components/Common/ActivityPanel';
import {
  AnimatedTabIndicator,
  AnimatedTabPanel,
} from '@/components/Common/animated-tabs';
import { priorityVariant } from '@/components/Common/taskUtils';
import { Badge } from '@/components/reui/badge';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { Button } from '@/components/ui/button';
import { useTaskInspector } from '@/hooks/tasks/use-task-inspector';
import { useStrings } from '@/lib/i18n';
import TaskActivity from './TaskActivity';
import TaskComments from './TaskComments';
import TaskDependenciesPanel from './TaskDependenciesPanel';
import TaskDetails from './TaskDetails';
import TaskHistoryCalendar from './TaskHistoryCalendar';
import TaskSubtasks from './TaskSubtasks';

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
  const {
    activityHistory,
    addComment,
    comments,
    commentsError,
    commentsHasMore,
    commentsLoading,
    commentsLoadingMore,
    hasMoreActivity,
    history,
    historyError,
    historyHasMore,
    historyLoading,
    historyLoadingMore,
    loadMoreActivity,
    loadMoreComments,
    profiles,
    requiresCompleteHistory,
    retryComments,
    retryHistory,
    setTab,
    tab,
  } = useTaskInspector(task);
  const handleContentScroll = useCallback(
    (event) => {
      if (
        tab !== 'activity' ||
        !hasMoreActivity ||
        historyError ||
        historyLoadingMore
      ) {
        return;
      }
      const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
      if (scrollHeight - scrollTop - clientHeight < 120) {
        loadMoreActivity();
      }
    },
    [hasMoreActivity, historyError, historyLoadingMore, loadMoreActivity, tab],
  );
  const completeHistoryLoading =
    requiresCompleteHistory &&
    (historyLoading || (historyHasMore && !historyError));

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
              className={`relative flex min-h-10 items-center justify-start gap-1.5 rounded-md px-1 py-1.5 text-xs font-medium leading-tight transition-colors sm:min-h-0 sm:px-2 ${tab === name ? 'text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              {tab === name && (
                <AnimatedTabIndicator layoutId="task-inspector-tabs" />
              )}
              {name === 'details' ? (
                <ListTodo className="relative z-10 size-3.5 shrink-0" />
              ) : name === 'calendar' ? (
                <CalendarDays className="relative z-10 size-3.5 shrink-0" />
              ) : name === 'activity' ? (
                <Activity className="relative z-10 size-3.5 shrink-0" />
              ) : name === 'team' ? (
                <Users className="relative z-10 size-3.5 shrink-0" />
              ) : name === 'subtasks' ? (
                <ListChecks className="relative z-10 size-3.5 shrink-0" />
              ) : (
                <MessageSquare className="relative z-10 size-3.5 shrink-0" />
              )}
              <span className="relative z-10">{t.tabs[name]}</span>
            </button>
          ))}
        </div>
      </FrameHeader>
      <FramePanel
        className={`min-h-0 flex-1 p-2.5 shadow-none ${
          tab === 'comments' || tab === 'team'
            ? 'flex flex-col overflow-hidden'
            : 'overflow-auto'
        }`}
        onScroll={handleContentScroll}
      >
        <AnimatedTabPanel
          activeId={tab}
          className={`min-h-0 flex-1 ${
            tab === 'comments' || tab === 'team'
              ? 'flex flex-col'
              : 'min-h-full'
          }`}
        >
          {tab === 'details' ? (
            <div className="space-y-5">
              <TaskDetails
                task={task}
                onUpdated={onTaskUpdated}
                onRequestCompletion={onRequestCompletion}
              />
              <TaskDependenciesPanel task={task} tasks={tasks} />
            </div>
          ) : tab === 'calendar' ? (
            <div className="space-y-3">
              {completeHistoryLoading && (
                <p
                  role="status"
                  className="p-4 text-center text-sm text-muted-foreground"
                >
                  {t.loadingCompleteHistory}
                </p>
              )}
              {historyError && (
                <div
                  role="alert"
                  className="space-y-2 rounded-lg border border-destructive/30 p-4 text-center"
                >
                  <p className="text-sm text-destructive">
                    {t.historyLoadError}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={retryHistory}
                  >
                    {t.retryHistory}
                  </Button>
                </div>
              )}
              {!completeHistoryLoading &&
                (!historyError || history.length > 0) && (
                  <TaskHistoryCalendar history={history} />
                )}
            </div>
          ) : tab === 'activity' ? (
            <TaskActivity
              error={historyError}
              hasMore={hasMoreActivity}
              history={activityHistory}
              loading={historyLoading}
              loadingMore={historyLoadingMore}
              onLoadMore={loadMoreActivity}
              onRetry={retryHistory}
            />
          ) : tab === 'team' ? (
            <ActivityPanel
              entries={history}
              scrollable={false}
              status={
                historyError ? (
                  <div
                    role="alert"
                    className="space-y-2 rounded-lg border border-destructive/30 p-4 text-center"
                  >
                    <p className="text-sm text-destructive">
                      {t.historyLoadError}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={retryHistory}
                    >
                      {t.retryHistory}
                    </Button>
                  </div>
                ) : completeHistoryLoading ? (
                  <p
                    role="status"
                    className="p-4 text-center text-sm text-muted-foreground"
                  >
                    {t.loadingCompleteHistory}
                  </p>
                ) : null
              }
            />
          ) : tab === 'subtasks' ? (
            <TaskSubtasks
              task={task}
              tasks={tasks}
              onUpdateState={onUpdateState}
              onAddSubtask={onAddSubtask}
            />
          ) : (
            <TaskComments
              comments={comments}
              error={commentsError}
              hasMore={commentsHasMore}
              loading={commentsLoading}
              loadingMore={commentsLoadingMore}
              onAddComment={addComment}
              onLoadMore={loadMoreComments}
              onRetry={retryComments}
              profiles={profiles}
            />
          )}
        </AnimatedTabPanel>
      </FramePanel>
    </Frame>
  );
};

export default TaskInspector;
