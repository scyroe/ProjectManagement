import { Clock3, User } from 'lucide-react';
import { Badge } from '@/components/reui/badge';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';
import { durationLabel } from './taskUtils';

const ContributorSummary = ({
  groups,
  showTask = false,
  scrollable = true,
}) => {
  const strings = useStrings();
  const t = strings.activity;
  const actionLabels = strings.taskActivity.actions;

  if (!groups.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <User className="mx-auto mb-3 size-7 text-muted-foreground" />
        <p className="text-sm font-medium">{t.empty}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.emptyDescription}
        </p>
      </div>
    );
  }

  const renderEntry = (entry) => (
    <div className="flex items-start justify-between gap-3 text-xs">
      <div className="min-w-0">
        <p className="font-medium">
          {actionLabels[entry.action] ?? entry.action}
          {showTask && entry.task?.title && (
            <span className="font-normal text-muted-foreground">
              {' '}
              · {entry.task.title}
            </span>
          )}
        </p>
        {entry.note && (
          <p className="mt-0.5 text-muted-foreground">{entry.note}</p>
        )}
      </div>
      <time className="shrink-0 text-muted-foreground">
        {new Date(entry.created_at).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
      </time>
    </div>
  );
  const renderGroup = (group) => (
    <div key={group.user} className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-3.5" />
          </div>
          <span className="truncate text-sm font-medium">{group.user}</span>
        </div>
        <Badge variant="secondary" size="sm">
          <Clock3 className="size-3" />
          {durationLabel(group.totalMinutes)}
        </Badge>
      </div>
      {scrollable ? (
        <VirtualList
          className="mt-2 max-h-72 border-t pt-2"
          estimateSize={48}
          getItemKey={(entry) => entry.id}
          itemClassName="pb-1.5"
          items={group.entries}
          renderItem={renderEntry}
        />
      ) : (
        <ul className="mt-2 space-y-1.5 border-t pt-2">
          {group.entries.map((entry) => (
            <li key={entry.id}>{renderEntry(entry)}</li>
          ))}
        </ul>
      )}
    </div>
  );

  return scrollable ? (
    <VirtualList
      className="max-h-136"
      estimateSize={180}
      getItemKey={(group) => group.user}
      itemClassName="pb-3"
      items={groups}
      renderItem={renderGroup}
    />
  ) : (
    <div className="space-y-3">{groups.map((group) => renderGroup(group))}</div>
  );
};

export default ContributorSummary;
