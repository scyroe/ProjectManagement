import { CalendarDays, Clock3 } from 'lucide-react';
import { useMemo } from 'react';
import { durationLabel } from '@/components/Common/taskUtils';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';

const TaskHistoryCalendar = ({ history }) => {
  const t = useStrings().taskHistoryCalendar;
  const dayGroups = useMemo(() => {
    const days = history.reduce((groups, entry) => {
      const key = new Date(entry.created_at).toISOString().slice(0, 10);
      const current = groups.get(key) ?? [];
      current.push(entry);
      groups.set(key, current);
      return groups;
    }, new Map());
    return [...days.entries()];
  }, [history]);

  if (!history.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <CalendarDays className="mx-auto mb-3 size-7 text-muted-foreground" />
        <p className="text-sm font-medium">{t.empty}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <VirtualList
      estimateSize={280}
      getItemKey={([key]) => key}
      itemClassName="pb-6"
      items={dayGroups}
      renderItem={([key, events]) => {
        const date = new Date(`${key}T00:00:00`);
        return (
          <section>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="text-xs font-semibold uppercase">
                  {date.toLocaleDateString('en', { weekday: 'short' })}
                </span>
                <span className="text-lg font-semibold leading-none">
                  {date.getDate()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {date.toLocaleDateString('en', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {events.length} {events.length === 1 ? t.event : t.events}
                </p>
              </div>
            </div>
            <VirtualList
              className="ml-5 border-l border-border pl-6"
              estimateSize={88}
              getItemKey={(entry) => entry.id}
              itemClassName="pb-2"
              items={events}
              renderItem={(entry) => (
                <div className="relative rounded-lg border bg-card p-3">
                  <span className="absolute -left-[1.65rem] top-4 size-2 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {entry.action.replace('_', ' ')}
                      </p>
                      {entry.note && (
                        <p className="mt-1 text-sm text-foreground/75">
                          {entry.note}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {entry.duration_minutes && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="size-3.5" />
                      {durationLabel(entry.duration_minutes)}
                    </div>
                  )}
                </div>
              )}
            />
          </section>
        );
      }}
    />
  );
};

export default TaskHistoryCalendar;
