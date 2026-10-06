import { ArrowRight, Play, Square } from 'lucide-react';
import { CompactSectionHeader } from '@/components/Common/analytics-ui';
import { priorityVariant } from '@/components/Common/taskUtils';
import { Badge } from '@/components/reui/badge';
import { Frame, FramePanel } from '@/components/reui/frame';
import { Button } from '@/components/ui/button';
import { VirtualList } from '@/components/ui/virtual-list';

function DashboardAttentionPanel({
  attentionTasks,
  dateLabel,
  isOverdue,
  loading,
  navigate,
  runningTask,
  runningTaskId,
  strings,
  t,
  toggleTimer,
}) {
  return (
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
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {task.project?.name ?? strings.common.noProject} ·{' '}
                      {dateLabel(task.due_date)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge
                      size="sm"
                      variant={isOverdue(task) ? 'warning-light' : 'secondary'}
                    >
                      {isOverdue(task) ? t.overdueBadge : t.dueSoonBadge}
                    </Badge>
                    <Badge
                      size="sm"
                      variant={priorityVariant[task.priority] ?? 'secondary'}
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
  );
}

export default DashboardAttentionPanel;
