import { Activity, Clock3 } from 'lucide-react';
import { durationLabel } from '@/components/Common/taskUtils';
import { Button } from '@/components/ui/button';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';

const TaskActivity = ({
  error,
  hasMore,
  history,
  loading,
  loadingMore,
  onLoadMore,
  onRetry,
}) => {
  const strings = useStrings();
  const actionLabels = strings.taskActivity.actions;

  if (loading && !history.length) {
    return (
      <p
        role="status"
        className="p-4 text-center text-sm text-muted-foreground"
      >
        {strings.taskActivity.loading}
      </p>
    );
  }

  if (error && !history.length) {
    return (
      <div className="space-y-2 p-4 text-center">
        <p role="alert" className="text-sm text-destructive">
          {strings.taskActivity.loadError}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loadingMore}
          onClick={onRetry}
        >
          {strings.taskActivity.retry}
        </Button>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Activity className="mx-auto mb-3 size-7 text-muted-foreground" />
        <p className="text-sm font-medium">{strings.taskActivity.empty}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {strings.taskActivity.emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <VirtualList
        ariaLabel={strings.taskActivity.emptyDescription}
        estimateSize={88}
        getItemKey={(entry) => entry.id}
        itemClassName="pb-2"
        items={history}
        renderItem={(entry) => (
          <div className="flex gap-3 rounded-lg border p-3">
            <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Activity className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">
                  {actionLabels[entry.action] ?? entry.action}
                </p>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </time>
              </div>
              {entry.note && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {entry.note}
                </p>
              )}
              {entry.duration_minutes && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="size-3.5" />
                  {durationLabel(entry.duration_minutes)}{' '}
                  {strings.taskActivity.trackedSuffix}
                </div>
              )}
            </div>
          </div>
        )}
      />
      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {strings.taskActivity.loadError}
        </p>
      )}
      {error && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={loadingMore}
          onClick={onRetry}
        >
          {strings.taskActivity.retry}
        </Button>
      )}
      {hasMore && !error && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={loadingMore}
          onClick={onLoadMore}
        >
          {loadingMore
            ? strings.taskActivity.loadingMore
            : strings.taskActivity.loadMore}
        </Button>
      )}
    </div>
  );
};

export default TaskActivity;
