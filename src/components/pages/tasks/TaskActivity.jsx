import { Activity, Clock3 } from 'lucide-react';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';
import { durationLabel } from './taskUtils';

const TaskActivity = ({ history }) => {
  const strings = useStrings();
  const actionLabels = strings.taskActivity.actions;

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
    <VirtualList
      ariaLabel={strings.taskActivity.emptyDescription}
      className="max-h-136"
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
              <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>
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
  );
};

export default TaskActivity;
