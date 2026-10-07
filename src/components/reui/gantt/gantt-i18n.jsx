import { format, isSameMonth, isSameYear, subMilliseconds } from 'date-fns';

const DEFAULT_LABELS = {
  today: 'Today',
  previous: 'Previous',
  next: 'Next',
  addEvent: 'Add event',
  addTask: 'Add task',
  allDay: 'All day',
  loading: 'Loading events',
  event: 'event',
  events: (count) => (count === 1 ? '1 event' : `${count} events`),
  week: (weekNumber) => `W${weekNumber}`,
  resources: 'Resources',
  goToDate: 'Go to date',
  scheduleHint: 'Click to add a schedule',
  scheduleHintDrag: 'Click or drag to add a schedule',
  reorder: 'Reorder',
  selectView: 'Select view',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  resizePanel: 'Resize panel',
  jumpToBar: (title) => `Scroll to "${title}"`,
  progress: (percent) => `${percent}% complete`,
  durationDays: (days) => (days === 1 ? '1 day' : `${days} days`),
  continues: 'continues',
  planned: (rangeLabel) => `Planned ${rangeLabel}`,
  milestone: 'milestone',
  scales: {
    day: 'Day',
    week: 'Week',
    month: 'Month',
    quarter: 'Quarter',
    year: 'Year',
  },
};

const DEFAULT_FORMATS = {
  monthTitle: 'MMMM yyyy',
  dayTitle: 'EEEE, MMMM d, yyyy',
  timeGutter: 'h a',
  eventTime: 'h:mm a',
};

/**
 * Default formatting functions BOUND to a config's labels/formats, so that
 * `formats` overrides flow into the default renderers (a consumer overriding
 * formats.eventTime without replacing formatEventTime still sees it applied).
 */
function makeDefaultGanttFunctions(cfg) {
  return {
    formatTitle: (scale, { date, activeRange, locale }) => {
      const opts = { locale };
      if (scale === 'day') {
        return format(date, cfg.formats.dayTitle, opts);
      }
      if (scale === 'month') {
        return format(date, cfg.formats.monthTitle, opts);
      }
      if (scale === 'quarter') {
        return format(date, 'QQQ yyyy', opts);
      }
      if (scale === 'year') {
        return format(date, 'yyyy', opts);
      }
      // week: smart range label, last day is activeRange.end - 1ms.
      // subMilliseconds keeps the zoned date type (a plain new Date(ms)
      // would flip the label to the machine zone near midnight)
      const rangeEnd = subMilliseconds(activeRange.end, 1);
      const start = activeRange.start;
      if (isSameMonth(start, rangeEnd)) {
        return `${format(start, 'MMMM d', opts)} - ${format(rangeEnd, 'd, yyyy', opts)}`;
      }
      if (isSameYear(start, rangeEnd)) {
        return `${format(start, 'MMM d', opts)} - ${format(rangeEnd, 'MMM d, yyyy', opts)}`;
      }
      return `${format(start, 'MMM d, yyyy', opts)} - ${format(rangeEnd, 'MMM d, yyyy', opts)}`;
    },
    formatEventTime: (start, end, allDay, locale) => {
      const opts = { locale };
      if (end.getTime() === start.getTime()) {
        // a milestone is an instant, not a range - "9:00 AM - 9:00 AM" reads
        // like a data bug
        return allDay
          ? format(start, 'MMM d, yyyy', opts)
          : format(start, `MMM d, ${cfg.formats.eventTime}`, opts);
      }
      if (allDay) {
        // a gantt bar is a DATE RANGE: show it, never a bare "All day".
        // Ends are exclusive midnights, so the last shown day is end - 1ms;
        // subMilliseconds keeps the caller's zoned date type intact.
        const last =
          end.getTime() - 1 >= start.getTime()
            ? subMilliseconds(end, 1)
            : start;
        const sameDay =
          format(start, 'yyyy-MM-dd') === format(last, 'yyyy-MM-dd');
        if (sameDay) return format(start, 'MMM d, yyyy', opts);
        if (isSameYear(start, last)) {
          return `${format(start, 'MMM d', opts)} - ${format(last, 'MMM d, yyyy', opts)}`;
        }
        return `${format(start, 'MMM d, yyyy', opts)} - ${format(last, 'MMM d, yyyy', opts)}`;
      }
      const fmt = cfg.formats.eventTime;
      // Multi-day timed events carry the date on both sides. Compare calendar
      // days off the last rendered instant (end is exclusive, so a 14:00 to
      // midnight bar still ends on the start day). Elapsed ms would miss an
      // exactly-24h bar and a DST day that only runs 23 hours.
      const lastInstant =
        end.getTime() - 1 >= start.getTime() ? subMilliseconds(end, 1) : start;
      if (format(start, 'yyyy-MM-dd') !== format(lastInstant, 'yyyy-MM-dd')) {
        return `${format(start, `MMM d, ${fmt}`, opts)} - ${format(end, `MMM d, ${fmt}`, opts)}`;
      }
      return `${format(start, fmt, opts)} - ${format(end, fmt, opts)}`;
    },
    formatDayRange: (range, locale) => {
      const opts = { locale };
      const rangeEnd = subMilliseconds(range.end, 1);
      return `${format(range.start, 'MMM d', opts)} - ${format(rangeEnd, 'MMM d', opts)}`;
    },
    formatEventAriaLabel: ({
      title,
      timeLabel,
      milestoneLabel,
      rowTitle,
      progressLabel,
      plannedLabel,
      continues,
    }) =>
      [
        title,
        timeLabel,
        milestoneLabel,
        rowTitle,
        progressLabel,
        plannedLabel,
        continues ? cfg.labels.continues : undefined,
      ]
        .filter(Boolean)
        .join(', '),
  };
}

const DEFAULT_GANTT_I18N = {
  labels: DEFAULT_LABELS,
  formats: DEFAULT_FORMATS,
  functions: makeDefaultGanttFunctions({
    labels: DEFAULT_LABELS,
    formats: DEFAULT_FORMATS,
  }),
};

/**
 * Shallow merge per nested object, matching the filters.tsx i18n contract:
 * a partial override replaces individual keys, never whole sections. Default
 * functions are re-bound to the MERGED labels/formats so a `formats` (or
 * `labels.continues`) override reaches the default renderers; explicit
 * `functions` overrides still win.
 */
function mergeGanttI18n(overrides) {
  if (!overrides) return DEFAULT_GANTT_I18N;
  const labels = {
    ...DEFAULT_LABELS,
    ...overrides.labels,
    // nested section: replace individual scale names, never the whole set
    scales: {
      ...DEFAULT_LABELS.scales,
      ...overrides.labels?.scales,
    },
  };
  const formats = { ...DEFAULT_FORMATS, ...overrides.formats };
  return {
    labels,
    formats,
    functions: {
      ...makeDefaultGanttFunctions({ labels, formats }),
      ...overrides.functions,
    },
  };
}

export { DEFAULT_GANTT_I18N, mergeGanttI18n };
