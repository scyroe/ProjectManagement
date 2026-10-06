import { useQuery, useQueryClient } from '@tanstack/react-query';
import { enUS, ro } from 'date-fns/locale';
import { Download, Pencil } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AnimatedTabIndicator } from '@/components/Common/animated-tabs';
import { Gantt } from '@/components/reui/gantt/gantt';
import { GanttView } from '@/components/reui/gantt/gantt-view';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VirtualList } from '@/components/ui/virtual-list';
import { useLanguage, useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const dayInMs = 24 * 60 * 60 * 1000;
const historyPageSize = 500;
const readOnlyInteractions = {
  drag: false,
  resize: false,
  selectSlot: false,
};
const historySelect =
  'id,task_id,user_id,user_email,action,note,started_at,stopped_at,duration_minutes,task:tasks!task_id(id,title,project:projects!project_id(name))';

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getRange(preset, customRange, weekStartsOn, now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === 'today') {
    return { start: today, end: addDays(today, 1) };
  }

  if (preset === 'week') {
    const daysSinceWeekStart = (today.getDay() - weekStartsOn + 7) % 7;
    const start = addDays(today, -daysSinceWeekStart);
    return { start, end: addDays(start, 7) };
  }

  if (preset === 'month') {
    return {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: new Date(today.getFullYear(), today.getMonth() + 1, 1),
    };
  }

  const start = parseLocalDate(customRange.from);
  const lastDay = parseLocalDate(customRange.to);
  if (!start || !lastDay || start > lastDay) return null;

  return { start, end: addDays(lastDay, 1) };
}

function formatDuration(minutes) {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  if (!hours) return `${remainingMinutes}m`;
  if (!remainingMinutes) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function WorkLog({ weekStartsOn, workspaceId, userId }) {
  const strings = useStrings();
  const t = strings.workLogPage;
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const locale = language === 'ro' ? 'ro-RO' : 'en-US';
  const [preset, setPreset] = useState('today');
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    startedAt: '',
    stoppedAt: '',
    note: '',
  });
  const [savingEntry, setSavingEntry] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [customRange, setCustomRange] = useState(() => {
    const today = toDateInputValue(new Date());
    return { from: today, to: today };
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const range = useMemo(
    () => getRange(preset, customRange, weekStartsOn, now),
    [customRange, now, preset, weekStartsOn],
  );

  const {
    data: profiles = [],
    error: profilesError,
    isLoading: profilesLoading,
  } = useQuery({
    queryKey: ['work-log-profiles', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,username,display_name')
        .order('display_name');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const {
    data: entries = [],
    error: entriesError,
    isLoading: entriesLoading,
  } = useQuery({
    queryKey: [
      'work-log',
      workspaceId,
      range?.start.toISOString(),
      range?.end.toISOString(),
    ],
    queryFn: async () => {
      if (!range) return [];
      const fetchSessions = async (inProgress) => {
        const sessions = [];
        let cursor = null;
        while (true) {
          let query = supabase
            .from('task_history')
            .select(historySelect)
            .eq('action', inProgress ? 'started' : 'stopped')
            .not('started_at', 'is', null)
            .lt('started_at', range.end.toISOString());

          query = inProgress
            ? query.is('stopped_at', null)
            : query
                .gt('stopped_at', range.start.toISOString())
                .gt('duration_minutes', 0);

          if (cursor) {
            query = query.or(
              `started_at.gt.${cursor.startedAt},and(started_at.eq.${cursor.startedAt},id.gt.${cursor.id})`,
            );
          }

          const { data, error } = await query
            .order('started_at')
            .order('id')
            .limit(historyPageSize);
          if (error) throw new Error(error.message);

          const page = data ?? [];
          sessions.push(...page);
          if (page.length < historyPageSize) return sessions;

          const lastSession = page[page.length - 1];
          cursor = {
            startedAt: lastSession.started_at,
            id: lastSession.id,
          };
        }
      };

      const [completedSessions, inProgressSessions] = await Promise.all([
        fetchSessions(false),
        fetchSessions(true),
      ]);
      return [...completedSessions, ...inProgressSessions];
    },
    enabled: Boolean(range),
    refetchInterval: 60_000,
  });

  const timeline = useMemo(() => {
    if (!range) return [];

    const rangeStart = range.start.getTime();
    const rangeEnd = range.end.getTime();
    const members = new Map(
      profiles.map((profile) => [
        profile.id,
        { profile, totalMinutes: 0, sessions: [] },
      ]),
    );

    for (const entry of entries) {
      const member = members.get(entry.user_id);
      if (!member) continue;

      const start = new Date(entry.started_at);
      const end = entry.stopped_at ? new Date(entry.stopped_at) : now;
      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
      ) {
        continue;
      }

      const visibleStart = Math.max(start.getTime(), rangeStart);
      const visibleEnd = Math.min(end.getTime(), rangeEnd, now.getTime());
      if (visibleEnd <= visibleStart) continue;

      const visibleMinutes = Math.floor((visibleEnd - visibleStart) / 60_000);
      const elapsedMinutes =
        entry.duration_minutes ??
        Math.floor((end.getTime() - start.getTime()) / 60_000);
      member.totalMinutes += visibleMinutes;
      member.sessions.push({
        ...entry,
        start,
        end,
        elapsedMinutes,
        visibleMinutes,
        inProgress: !entry.stopped_at,
      });
    }

    return [...members.values()].map((member) => ({
      ...member,
      sessions: member.sessions.sort(
        (first, second) => first.start - second.start,
      ),
    }));
  }, [entries, now, profiles, range]);

  const totalMinutes = timeline.reduce(
    (total, member) => total + member.totalMinutes,
    0,
  );
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const totalMinutesByProfile = new Map(
    timeline.map(({ profile, totalMinutes: minutes }) => [profile.id, minutes]),
  );
  const ganttResources = timeline.map(({ profile }) => ({
    id: profile.id,
    title: profile.display_name || profile.username,
  }));
  const ganttEvents = timeline.flatMap(({ profile, sessions }) =>
    sessions.map((session) => ({
      id: session.id,
      title: session.task?.title ?? strings.common.aTask,
      start: session.start,
      end: session.end,
      resourceId: profile.id,
      data: { session },
    })),
  );
  const rangeDays = range
    ? Math.max(
        1,
        Math.round((range.end.getTime() - range.start.getTime()) / dayInMs),
      )
    : 1;
  const ganttScale =
    preset === 'today' || (preset === 'custom' && rangeDays === 1)
      ? 'day'
      : preset === 'week' || rangeDays <= 7
        ? 'week'
        : preset === 'month' || rangeDays <= 31
          ? 'month'
          : rangeDays <= 93
            ? 'quarter'
            : 'year';
  const ganttInterval = ganttScale === 'day' ? 60 : 1440;
  const ganttLocale = language === 'ro' ? ro : enUS;
  const ganttDefaultZoom = ganttScale === 'month' ? 0.35 : 0.5;
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const rangeLabel = range
    ? `${dateFormatter.format(range.start)} – ${dateFormatter.format(
        new Date(range.end.getTime() - 1),
      )}`
    : '';

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      startedAt: toDateTimeLocal(entry.started_at),
      stoppedAt: toDateTimeLocal(entry.stopped_at),
      note: entry.note ?? '',
    });
  };

  const handleSaveEntry = async (event) => {
    event.preventDefault();
    if (!editingEntry || !editForm.startedAt || !editForm.stoppedAt) return;
    const startedAt = new Date(editForm.startedAt);
    const stoppedAt = new Date(editForm.stoppedAt);
    if (
      Number.isNaN(startedAt.getTime()) ||
      Number.isNaN(stoppedAt.getTime()) ||
      stoppedAt <= startedAt
    ) {
      toast.error(t.invalidInterval);
      return;
    }
    setSavingEntry(true);
    const { error } = await supabase
      .from('task_history')
      .update({
        started_at: startedAt.toISOString(),
        stopped_at: stoppedAt.toISOString(),
        note: editForm.note.trim() || null,
      })
      .eq('id', editingEntry.id)
      .eq('user_id', userId)
      .eq('action', 'stopped');
    setSavingEntry(false);
    if (error) {
      toast.error(t.editError, { description: error.message });
      return;
    }
    toast.success(t.entryUpdated);
    setEditingEntry(null);
    await queryClient.invalidateQueries({
      queryKey: ['work-log', workspaceId],
    });
  };

  const handleExportCsv = () => {
    const cell = (value) => {
      let text = String(value ?? '');
      if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    };
    const rows = [
      [
        'task',
        'project',
        'member',
        'started_at',
        'stopped_at',
        'minutes',
        'note',
      ],
      ...entries.map((entry) => [
        entry.task?.title,
        entry.task?.project?.name,
        entry.user_email,
        entry.started_at,
        entry.stopped_at,
        entry.duration_minutes,
        entry.note,
      ]),
    ];
    const csv = rows.map((row) => row.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `work-log-${preset}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto pb-2">
      <div className="flex min-h-10 shrink-0 flex-wrap items-center justify-between gap-3">
        <fieldset className="flex shrink-0 flex-wrap rounded-lg border bg-muted/50 p-1">
          <legend className="sr-only">{t.periodLabel}</legend>
          {Object.entries(t.periods).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={preset === value}
              onClick={() => setPreset(value)}
              className={`relative rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                preset === value
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {preset === value && (
                <AnimatedTabIndicator layoutId="work-log-period-tabs" />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </fieldset>

        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="work-log-from"
                className="text-xs text-muted-foreground"
              >
                {t.fromDate}
              </Label>
              <Input
                id="work-log-from"
                type="date"
                value={customRange.from}
                max={customRange.to || undefined}
                onChange={(event) =>
                  setCustomRange((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="work-log-to"
                className="text-xs text-muted-foreground"
              >
                {t.toDate}
              </Label>
              <Input
                id="work-log-to"
                type="date"
                value={customRange.to}
                min={customRange.from || undefined}
                onChange={(event) =>
                  setCustomRange((current) => ({
                    ...current,
                    to: event.target.value,
                  }))
                }
                className="w-auto"
              />
            </div>
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!entries.length}
          onClick={handleExportCsv}
        >
          <Download aria-hidden="true" />
          {t.exportCsv}
        </Button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">{rangeLabel}</p>
        <div className="flex items-center gap-4">
          <p>
            <span className="text-muted-foreground">{t.totalTracked}: </span>
            <strong>{formatDuration(totalMinutes)}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">{t.teamMembers}: </span>
            <strong>{profiles.length}</strong>
          </p>
        </div>
      </div>

      {(profilesError || entriesError) && (
        <p
          className="shrink-0 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {t.loadError}
        </p>
      )}

      {(profilesLoading || entriesLoading) && (
        <p className="shrink-0 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t.loading}
        </p>
      )}

      {!profilesLoading && !profilesError && profiles.length === 0 && (
        <p className="shrink-0 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t.emptyProfiles}
        </p>
      )}

      {profiles.length > 0 && range && (
        <div className="min-h-[18rem] min-w-0 flex-1 overflow-hidden rounded-lg border bg-card">
          <Gantt
            key={`${preset}:${range.start.toISOString()}:${range.end.toISOString()}`}
            className="h-full w-full"
            resources={ganttResources}
            events={ganttEvents}
            date={range.start}
            scale={ganttScale}
            locale={ganttLocale}
            weekStartsOn={weekStartsOn}
            interval={ganttInterval}
            i18n={{
              labels: {
                resources: t.teamMembers,
                zoomIn: t.zoomIn,
                zoomOut: t.zoomOut,
              },
              formats: {
                timeGutter: language === 'ro' ? 'HH:mm' : 'h a',
                eventTime: language === 'ro' ? 'HH:mm' : 'h:mm a',
              },
            }}
            initialCenter={
              range.start.getTime() +
              (range.end.getTime() - range.start.getTime()) / 2
            }
            defaultZoom={ganttDefaultZoom}
            zoomRange={{ min: 0.25, max: 3 }}
            zoomControl
            infiniteScroll={false}
            rowCheckboxes={false}
            baselineBars={false}
            summaryBars={false}
            dependencyLines={false}
            interactions={readOnlyInteractions}
            renderResourceLabel={({ resource }) => {
              const profile = profileById.get(resource.id);
              return (
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <span className="truncate">
                    {profile?.display_name ||
                      profile?.username ||
                      resource.title}
                  </span>
                  <span className="shrink-0 text-2xs text-muted-foreground">
                    {formatDuration(
                      totalMinutesByProfile.get(resource.id) ?? 0,
                    )}
                  </span>
                </div>
              );
            }}
            renderEventTooltip={({ occurrence }) => {
              const session = occurrence.event.data?.session;
              if (!session) return null;

              const intervalLabel = `${dateFormatter.format(
                session.start,
              )}, ${timeFormatter.format(session.start)} – ${dateFormatter.format(
                session.end,
              )}, ${timeFormatter.format(session.end)}`;

              return (
                <div className="w-full space-y-2 text-xs">
                  <div>
                    <p className="truncate text-sm font-semibold">
                      {occurrence.event.title}
                    </p>
                    {session.task?.project?.name && (
                      <p className="mt-0.5 truncate text-muted-foreground">
                        {session.task.project.name}
                      </p>
                    )}
                  </div>
                  <dl className="space-y-1">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{t.worked}</dt>
                      <dd className="font-medium">
                        {formatDuration(session.elapsedMinutes)}
                        {session.inProgress && (
                          <span className="ml-1 text-primary">
                            ({t.inProgress})
                          </span>
                        )}
                      </dd>
                    </div>
                    {session.visibleMinutes !== session.elapsedMinutes && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">
                          {t.selectedDuration}
                        </dt>
                        <dd className="font-medium">
                          {formatDuration(session.visibleMinutes)}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{t.interval}</dt>
                      <dd className="min-w-0 break-words text-right">
                        {intervalLabel}
                      </dd>
                    </div>
                  </dl>
                  <div className="border-t pt-2">
                    <p className="font-medium">{t.comment}</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                      {session.note || t.noComment}
                    </p>
                  </div>
                </div>
              );
            }}
          >
            <GanttView />
          </Gantt>
        </div>
      )}

      <section className="shrink-0 space-y-2">
        <h2 className="text-sm font-semibold">{t.recentSessions}</h2>
        {entries.length ? (
          <VirtualList
            ariaLabel={t.recentSessions}
            className="max-h-64"
            estimateSize={68}
            getItemKey={(entry) => entry.id}
            itemClassName="pb-2"
            items={entries}
            renderItem={(entry) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {entry.task?.title ?? strings.common.aTask}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {entry.user_email} ·{' '}
                    {entry.started_at
                      ? dateFormatter.format(new Date(entry.started_at))
                      : ''}
                    {entry.duration_minutes !== null &&
                      ` · ${formatDuration(entry.duration_minutes)}`}
                  </p>
                </div>
                {entry.user_id === userId && entry.action === 'stopped' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditEntry(entry)}
                  >
                    <Pencil aria-hidden="true" />
                    {t.editEntry}
                  </Button>
                )}
              </div>
            )}
          />
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            {t.noSessions}
          </p>
        )}
      </section>

      <Dialog
        open={Boolean(editingEntry)}
        onOpenChange={(open) => !open && setEditingEntry(null)}
      >
        <DialogContent className="max-w-md">
          <div className="space-y-1 pr-8">
            <DialogTitle className="text-xl font-semibold">
              {t.editTitle}
            </DialogTitle>
            <DialogDescription>{editingEntry?.task?.title}</DialogDescription>
          </div>
          <form className="mt-4 space-y-4" onSubmit={handleSaveEntry}>
            <div className="space-y-1">
              <Label htmlFor="work-entry-start">{t.startTime}</Label>
              <Input
                id="work-entry-start"
                type="datetime-local"
                required
                value={editForm.startedAt}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    startedAt: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="work-entry-end">{t.endTime}</Label>
              <Input
                id="work-entry-end"
                type="datetime-local"
                required
                min={editForm.startedAt || undefined}
                value={editForm.stoppedAt}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    stoppedAt: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="work-entry-note">{t.notes}</Label>
              <Textarea
                id="work-entry-note"
                value={editForm.note}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingEntry(null)}
              >
                {t.cancel}
              </Button>
              <Button type="submit" disabled={savingEntry}>
                {savingEntry ? t.saving : t.saveEntry}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default WorkLog;
