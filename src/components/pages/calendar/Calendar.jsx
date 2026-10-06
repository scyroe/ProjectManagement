import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Circle,
  Flag,
  FolderKanban,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MetricStrip } from '@/components/Common/analytics-ui';
import {
  AnimatedTabIndicator,
  AnimatedTabPanel,
} from '@/components/Common/animated-tabs';
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VirtualList } from '@/components/ui/virtual-list';
import VirtualSelect from '@/components/ui/virtual-select';
import { useLanguage, useStrings } from '@/lib/i18n';
import { CalendarDateDropZone, CalendarEventItem } from './CalendarEventItem';

const viewNames = ['month', 'week', 'agenda'];
const viewStorageKey = 'projectly-calendar-view';

const getInitialView = () => {
  const storedView = window.localStorage.getItem(viewStorageKey);
  if (viewNames.includes(storedView)) return storedView;
  return window.matchMedia('(max-width: 767px)').matches ? 'agenda' : 'month';
};

const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const addDays = (date, amount) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

const startOfWeek = (date, weekStartsOn) =>
  addDays(date, -((date.getDay() - weekStartsOn + 7) % 7));

const getMonthDays = (date, weekStartsOn) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const endOffset = (weekStartsOn + 6 - lastDay.getDay() + 7) % 7;
  const endDay = addDays(lastDay, endOffset);
  const days = [];
  for (
    let current = startOfWeek(firstDay, weekStartsOn);
    current <= endDay;
    current = addDays(current, 1)
  ) {
    days.push(current);
  }
  return days;
};

const formatDate = (date, locale, options) =>
  new Intl.DateTimeFormat(locale, options).format(date);

const getProjectClients = (project) => {
  const clients = [
    project.client,
    ...(project.linked_clients ?? []).map((link) => link.client),
  ].filter(Boolean);
  return Array.from(
    new Map(clients.map((client) => [client.id, client])).values(),
  );
};

function Calendar({ calendar, navigate, weekStartsOn, workspace }) {
  const strings = useStrings();
  const t = strings.calendarPage;
  const { language } = useLanguage();
  const locale = language === 'ro' ? 'ro-RO' : 'en-US';
  const [view, setView] = useState(getInitialView);
  const [focusDate, setFocusDate] = useState(() => new Date());
  const [clientFilter, setClientFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const todayKey = dateKey(new Date());
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    window.localStorage.setItem(viewStorageKey, view);
  }, [view]);

  const projects = useMemo(
    () =>
      calendar.projects.map((project) => {
        const clients = getProjectClients(project);
        return {
          ...project,
          clients,
          clientIds: clients.map((client) => client.id),
        };
      }),
    [calendar.projects],
  );
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const clients = useMemo(
    () =>
      Array.from(
        new Map(
          projects.flatMap((project) =>
            project.clients.map((client) => [client.id, client]),
          ),
        ).values(),
      ).sort((first, second) => first.name.localeCompare(second.name)),
    [projects],
  );

  const events = useMemo(() => {
    const projectEvents = projects.flatMap((project) =>
      [
        project.start_date && {
          id: `${project.id}-start`,
          date: project.start_date,
          kind: 'projectStart',
          title: project.name,
          projectIds: [project.id],
          clientIds: project.clientIds,
          projectNames: [project.name],
          clientNames: project.clients.map((client) => client.name),
          statusLabel: project.status,
        },
        project.due_date && {
          id: `${project.id}-deadline`,
          date: project.due_date,
          kind: 'projectDeadline',
          title: project.name,
          projectIds: [project.id],
          clientIds: project.clientIds,
          projectNames: [project.name],
          clientNames: project.clients.map((client) => client.name),
          statusLabel: project.status,
        },
      ].filter(Boolean),
    );
    const taskEvents = workspace.tasks
      .filter((task) => task.due_date)
      .map((task) => {
        const linkedProjects = (task.linked_projects ?? [])
          .map((link) => link.project)
          .filter(Boolean);
        const taskProjects = Array.from(
          new Map(
            [task.project, ...linkedProjects]
              .filter(Boolean)
              .map((project) => [project.id, project]),
          ).values(),
        );
        const taskClientIds = taskProjects.flatMap((project) => {
          const savedProject = projectById.get(project.id);
          return (
            savedProject?.clientIds ??
            (project.client_id ? [project.client_id] : [])
          );
        });
        const projectNames = taskProjects.map((project) => project.name);
        const clientNames = Array.from(
          new Set(
            taskProjects.flatMap((project) => {
              const savedProject = projectById.get(project.id);
              return (
                savedProject?.clients.map((client) => client.name) ??
                (project.client?.name ? [project.client.name] : [])
              );
            }),
          ),
        );

        return {
          id: task.id,
          date: task.due_date,
          kind: 'taskDue',
          title: task.title,
          projectIds: taskProjects.map((project) => project.id),
          clientIds: [...new Set(taskClientIds)],
          projectNames,
          clientNames,
          task,
          completed: Boolean(task.state?.is_completed),
          statusLabel: task.state?.name ?? strings.common.noState,
          priorityLabel: t.priorities[task.priority] ?? task.priority,
        };
      });

    return [...projectEvents, ...taskEvents].filter((event) => {
      if (
        projectFilter !== 'all' &&
        !event.projectIds.includes(projectFilter)
      ) {
        return false;
      }
      if (clientFilter !== 'all' && !event.clientIds.includes(clientFilter)) {
        return false;
      }
      if (event.task && statusFilter === 'open' && event.completed)
        return false;
      if (event.task && statusFilter === 'completed' && !event.completed) {
        return false;
      }
      return true;
    });
  }, [
    clientFilter,
    projectById,
    projectFilter,
    projects,
    statusFilter,
    strings.common.noState,
    t.priorities,
    workspace.tasks,
  ]);

  const range = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(focusDate, weekStartsOn);
      return {
        start,
        end: addDays(start, 6),
        days: Array.from({ length: 7 }, (_, index) => addDays(start, index)),
      };
    }
    if (view === 'agenda') {
      const start = new Date(
        focusDate.getFullYear(),
        focusDate.getMonth(),
        focusDate.getDate(),
      );
      const days = Array.from({ length: 30 }, (_, index) =>
        addDays(start, index),
      );
      return { start, end: days[days.length - 1], days };
    }
    const days = getMonthDays(focusDate, weekStartsOn);
    return { start: days[0], end: days[days.length - 1], days };
  }, [focusDate, view, weekStartsOn]);

  const eventsByDate = useMemo(() => {
    const grouped = new Map();
    for (const event of events) {
      grouped.set(event.date, [...(grouped.get(event.date) ?? []), event]);
    }
    for (const dayEvents of grouped.values()) {
      dayEvents.sort((first, second) => {
        const firstRank =
          first.kind === 'projectStart' ? 0 : first.kind === 'taskDue' ? 1 : 2;
        const secondRank =
          second.kind === 'projectStart'
            ? 0
            : second.kind === 'taskDue'
              ? 1
              : 2;
        return (
          firstRank - secondRank || first.title.localeCompare(second.title)
        );
      });
    }
    return grouped;
  }, [events]);

  const unscheduledTasks = useMemo(
    () =>
      workspace.tasks
        .filter((task) => !task.due_date && !task.state?.is_completed)
        .filter((task) => {
          const taskProjectIds = [
            task.project?.id,
            ...(task.linked_projects ?? []).map((link) => link.project?.id),
          ].filter(Boolean);
          if (
            projectFilter !== 'all' &&
            !taskProjectIds.includes(projectFilter)
          ) {
            return false;
          }
          if (clientFilter === 'all') return true;
          return taskProjectIds.some((id) =>
            projectById.get(id)?.clientIds.includes(clientFilter),
          );
        })
        .sort((first, second) => first.title.localeCompare(second.title)),
    [clientFilter, projectById, projectFilter, workspace.tasks],
  );

  const activeFilters = useMemo(
    () =>
      [
        clientFilter !== 'all' && {
          id: 'client',
          label: `${t.filters.client}: ${clients.find((client) => client.id === clientFilter)?.name ?? clientFilter}`,
          clear: () => setClientFilter('all'),
        },
        projectFilter !== 'all' && {
          id: 'project',
          label: `${t.filters.project}: ${projects.find((project) => project.id === projectFilter)?.name ?? projectFilter}`,
          clear: () => setProjectFilter('all'),
        },
        statusFilter !== 'all' && {
          id: 'status',
          label: `${t.filters.status}: ${statusFilter === 'open' ? t.filters.openTasks : t.filters.completedTasks}`,
          clear: () => setStatusFilter('all'),
        },
      ].filter(Boolean),
    [clientFilter, clients, projects, projectFilter, statusFilter, t.filters],
  );
  const clearFilters = () => {
    setClientFilter('all');
    setProjectFilter('all');
    setStatusFilter('all');
  };
  const weekEndKey = dateKey(addDays(startOfWeek(new Date(), weekStartsOn), 6));
  const weekSummary = useMemo(
    () => ({
      due: events.filter(
        (event) =>
          event.task &&
          !event.completed &&
          event.date >= todayKey &&
          event.date <= weekEndKey,
      ).length,
      overdue: events.filter(
        (event) => event.task && !event.completed && event.date < todayKey,
      ).length,
      milestones: events.filter(
        (event) =>
          !event.task && event.date >= todayKey && event.date <= weekEndKey,
      ).length,
    }),
    [events, todayKey, weekEndKey],
  );

  const title =
    view === 'month'
      ? formatDate(focusDate, locale, { month: 'long', year: 'numeric' })
      : `${formatDate(range.start, locale, { month: 'short', day: 'numeric' })} – ${formatDate(range.end, locale, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const day = new Date(2026, 0, 4 + ((weekStartsOn + index) % 7));
        return {
          key: dateKey(day),
          label: formatDate(day, locale, { weekday: 'short' }),
        };
      }),
    [locale, weekStartsOn],
  );
  const loading = workspace.loading || calendar.projectsLoading;
  const error = workspace.error || calendar.error;
  const hasEventsInRange = useMemo(
    () =>
      events.some(
        (event) =>
          event.date >= dateKey(range.start) &&
          event.date <= dateKey(range.end),
      ),
    [events, range],
  );

  const handleNavigatePeriod = (direction) => {
    const offset =
      view === 'month' ? 0 : view === 'week' ? direction * 7 : direction * 30;
    setFocusDate(
      view === 'month'
        ? new Date(focusDate.getFullYear(), focusDate.getMonth() + direction, 1)
        : addDays(focusDate, offset),
    );
  };

  const handleEventSelect = (event) => {
    if (event.task) {
      workspace.setSelectedId(event.task.id);
      workspace.setFilter(
        event.completed
          ? 'completed'
          : workspace.runningTaskId === event.task.id
            ? 'active'
            : 'current',
      );
      navigate('tasks');
      return;
    }
    navigate('projects');
  };

  const handleShowDayEvents = (day) => {
    setFocusDate(day);
    setView('agenda');
  };

  const handleDragEnd = ({ active, over }) => {
    const taskId = active.data.current?.taskId;
    const dueDate = over?.id;
    if (
      !taskId ||
      typeof dueDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)
    ) {
      return;
    }

    const task = workspace.tasks.find((item) => item.id === taskId);
    if (task && task.due_date !== dueDate) {
      calendar.scheduleTask(taskId, dueDate);
    }
  };

  const eventLabels = {
    client: t.client,
    dragToReschedule: t.dragToReschedule,
    noClient: t.noClient,
    noProject: strings.common.noProject,
    overdue: t.overdue,
    priorities: t.priorities,
    priority: t.priority,
    project: t.project,
    projectDeadline: t.projectDeadline,
    projectStart: t.projectStart,
    status: t.status,
    taskDue: t.taskDue,
  };
  const renderEvent = (event, compact = false) => (
    <CalendarEventItem
      key={event.id}
      event={event}
      compact={compact}
      labels={eventLabels}
      onSelect={handleEventSelect}
      todayKey={todayKey}
    />
  );

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-auto pb-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <fieldset className="flex rounded-lg border bg-muted/50 p-1">
          <legend className="sr-only">{t.title}</legend>
          {viewNames.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={view === name}
              onClick={() => setView(name)}
              className={`relative rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${view === name ? 'text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              {view === name && (
                <AnimatedTabIndicator layoutId="calendar-view-tabs" />
              )}
              <span className="relative z-10">{t.views[name]}</span>
            </button>
          ))}
        </fieldset>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full space-y-1 sm:w-44">
          <Label
            htmlFor="calendar-client-filter"
            className="text-xs text-muted-foreground"
          >
            {t.filters.client}
          </Label>
          <VirtualSelect
            id="calendar-client-filter"
            ariaLabel={t.filters.client}
            searchLabel={t.filters.client}
            value={clientFilter}
            onChange={setClientFilter}
            placeholder={t.filters.allClients}
            options={[
              { value: 'all', label: t.filters.allClients },
              ...clients.map((client) => ({
                value: client.id,
                label: client.name,
              })),
            ]}
          />
        </div>
        <div className="w-full space-y-1 sm:w-52">
          <Label
            htmlFor="calendar-project-filter"
            className="text-xs text-muted-foreground"
          >
            {t.filters.project}
          </Label>
          <VirtualSelect
            id="calendar-project-filter"
            ariaLabel={t.filters.project}
            searchLabel={t.filters.project}
            value={projectFilter}
            onChange={setProjectFilter}
            placeholder={t.filters.allProjects}
            options={[
              { value: 'all', label: t.filters.allProjects },
              ...projects.map((project) => ({
                value: project.id,
                label: project.name,
              })),
            ]}
          />
        </div>
        <div className="w-full space-y-1 sm:w-48">
          <Label
            htmlFor="calendar-status-filter"
            className="text-xs text-muted-foreground"
          >
            {t.filters.status}
          </Label>
          <VirtualSelect
            id="calendar-status-filter"
            ariaLabel={t.filters.status}
            searchLabel={t.filters.status}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder={t.filters.allStatuses}
            options={[
              { value: 'all', label: t.filters.allStatuses },
              { value: 'open', label: t.filters.openTasks },
              { value: 'completed', label: t.filters.completedTasks },
            ]}
          />
        </div>
      </div>

      {activeFilters.length > 0 && (
        <section
          className="flex flex-wrap items-center gap-2"
          aria-label={t.activeFilters}
        >
          <span className="text-xs text-muted-foreground">
            {t.activeFilters}
          </span>
          {activeFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={filter.clear}
              aria-label={`${t.removeFilter}: ${filter.label}`}
              className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-accent"
            >
              {filter.label}
              <X className="size-3" aria-hidden="true" />
            </button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            {t.clearFilters}
          </Button>
        </section>
      )}

      {error && (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <MetricStrip
        ariaLabel={t.weekSummary.title}
        columns={3}
        metrics={[
          [t.weekSummary.due, weekSummary.due, CalendarDays, 'text-info'],
          [
            t.weekSummary.overdue,
            weekSummary.overdue,
            AlertTriangle,
            'text-warning',
          ],
          [
            t.weekSummary.milestones,
            weekSummary.milestones,
            Flag,
            'text-primary',
          ],
        ]}
      />

      {!loading && !hasEventsInRange && activeFilters.length > 0 && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-3 text-sm"
          role="status"
        >
          <p>{t.noMatchingEvents}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFilters}
          >
            {t.clearFilters}
          </Button>
        </div>
      )}

      <div className="grid min-w-0 gap-4 xl:grid-cols-12">
        <Frame className="min-w-0 xl:col-span-9" stacked>
          <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2 border-b px-3 py-2 pr-12">
            <FrameTitle className="text-sm capitalize">{title}</FrameTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t.previousPeriod}
                  title={t.previousPeriod}
                  onClick={() => handleNavigatePeriod(-1)}
                >
                  <ArrowLeft />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t.nextPeriod}
                  title={t.nextPeriod}
                  onClick={() => handleNavigatePeriod(1)}
                >
                  <ArrowRight />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFocusDate(new Date())}
              >
                {t.today}
              </Button>
            </div>
          </FrameHeader>
          <FramePanel className="min-w-0 max-h-[72vh] overflow-auto p-0 shadow-none">
            <AnimatedTabPanel activeId={view} className="min-w-0">
              {loading ? (
                <p className="p-6 text-sm text-muted-foreground">{t.loading}</p>
              ) : (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  {view === 'agenda' ? (
                    <AgendaView
                      days={range.days}
                      eventsByDate={eventsByDate}
                      formatDate={(date, options) =>
                        formatDate(date, locale, options)
                      }
                      renderEvent={renderEvent}
                    />
                  ) : (
                    <div className="min-w-155">
                      <div className="sticky top-0 z-10 grid grid-cols-7 border-b bg-muted/90 backdrop-blur">
                        {weekdayLabels.map(({ key, label }) => (
                          <div
                            key={key}
                            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
                          >
                            {label}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7">
                        {range.days.map((day) => {
                          const key = dateKey(day);
                          const dayEvents = eventsByDate.get(key) ?? [];
                          const isOutsideMonth =
                            view === 'month' &&
                            day.getMonth() !== focusDate.getMonth();
                          const visibleCount = view === 'week' ? 5 : 3;
                          return (
                            <CalendarDateDropZone
                              key={key}
                              date={day}
                              className={`min-h-28 border-b border-r p-1.5 ${isOutsideMonth ? 'bg-muted/20' : ''}`}
                            >
                              <div className="mb-1 flex items-center justify-between">
                                <span
                                  className={`flex size-7 items-center justify-center rounded-full text-xs ${key === todayKey ? 'bg-primary font-semibold text-primary-foreground' : isOutsideMonth ? 'text-muted-foreground/60' : 'text-foreground'}`}
                                >
                                  {day.getDate()}
                                </span>
                                {dayEvents.length > 0 && (
                                  <span className="pr-1 text-2xs tabular-nums text-muted-foreground">
                                    {dayEvents.length}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1">
                                {dayEvents
                                  .slice(0, visibleCount)
                                  .map((event) => renderEvent(event, true))}
                                {dayEvents.length > visibleCount && (
                                  <button
                                    type="button"
                                    className="px-1.5 text-2xs text-primary hover:underline"
                                    aria-label={`${t.showEventsFor} ${formatDate(day, locale, { month: 'short', day: 'numeric' })}`}
                                    onClick={() => handleShowDayEvents(day)}
                                  >
                                    +{dayEvents.length - visibleCount} {t.more}
                                  </button>
                                )}
                              </div>
                            </CalendarDateDropZone>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </DndContext>
              )}
            </AnimatedTabPanel>
          </FramePanel>
        </Frame>

        <Frame className="min-w-0 xl:col-span-3" stacked>
          <FrameHeader className="border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <CalendarDays
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <div>
                <FrameTitle className="text-sm">
                  {t.unscheduledTitle}
                </FrameTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.unscheduledDescription}
                </p>
              </div>
            </div>
          </FrameHeader>
          <FramePanel className="overflow-hidden p-0 shadow-none">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">{t.loading}</p>
            ) : unscheduledTasks.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {t.unscheduledEmpty}
              </p>
            ) : (
              <VirtualList
                ariaLabel={t.unscheduledTitle}
                className="max-h-136"
                estimateSize={60}
                itemClassName="border-b"
                items={unscheduledTasks}
                renderItem={(task) => (
                  <div className="flex items-center gap-2 p-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() =>
                        handleEventSelect({ task, completed: false })
                      }
                    >
                      <span className="block truncate text-sm font-medium">
                        {task.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <FolderKanban
                          className="size-3 shrink-0"
                          aria-hidden="true"
                        />
                        {task.project?.name ?? strings.common.noProject}
                      </span>
                    </button>
                    <label
                      htmlFor={`schedule-${task.id}`}
                      className="relative inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-muted-foreground transition-colors hover:bg-accent focus-within:ring-3 focus-within:ring-ring/50"
                      title={t.scheduleTask}
                    >
                      <CalendarDays className="size-4" aria-hidden="true" />
                      <span className="text-xs">{t.scheduleTask}</span>
                      <Input
                        id={`schedule-${task.id}`}
                        aria-label={`${t.chooseDate} ${task.title}`}
                        className="absolute inset-0 size-full cursor-pointer opacity-0"
                        type="date"
                        disabled={calendar.schedulingTaskId === task.id}
                        onChange={(event) => {
                          if (event.target.value) {
                            calendar.scheduleTask(task.id, event.target.value);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              />
            )}
          </FramePanel>
        </Frame>
      </div>

      <ul
        className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"
        aria-label={t.title}
      >
        <li className="inline-flex items-center gap-1.5">
          <Circle className="size-3 text-primary" aria-hidden="true" />
          {t.taskDue}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Flag className="size-3 text-info" aria-hidden="true" />
          {t.projectStart}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <CalendarClock className="size-3 text-success" aria-hidden="true" />
          {t.projectDeadline}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <AlertTriangle className="size-3 text-warning" aria-hidden="true" />
          {t.overdue}
        </li>
      </ul>
    </div>
  );
}

function AgendaView({ days, eventsByDate, formatDate, renderEvent }) {
  const agendaEntries = days
    .map((day) => ({ day, events: eventsByDate.get(dateKey(day)) ?? [] }))
    .filter((entry) => entry.events.length > 0);

  if (!agendaEntries.length) return null;

  return (
    <div className="divide-y">
      {agendaEntries.map(({ day, events }) => (
        <CalendarDateDropZone
          key={dateKey(day)}
          date={day}
          className="grid gap-2 p-3 sm:grid-cols-[9rem_1fr]"
        >
          <h3 className="sticky top-0 z-10 self-start bg-card py-1 text-sm font-medium">
            {formatDate(day, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </h3>
          <VirtualList
            className="max-h-96"
            estimateSize={72}
            items={events}
            itemClassName="pb-1.5"
            renderItem={(event) => renderEvent(event)}
          />
        </CalendarDateDropZone>
      ))}
    </div>
  );
}

export default Calendar;
