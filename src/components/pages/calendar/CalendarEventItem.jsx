import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock, CheckCircle2, Circle, Flag } from 'lucide-react';
import { useMemo } from 'react';

const priorityColors = {
  urgent: 'bg-destructive',
  high: 'bg-warning',
  medium: 'bg-primary',
  low: 'bg-muted-foreground',
};

const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function CalendarEventItem({
  compact = false,
  event,
  labels,
  onSelect,
  todayKey,
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: event.id,
      data: event.task ? { taskId: event.task.id } : undefined,
      disabled: !event.task,
    });
  const Icon =
    event.kind === 'taskDue'
      ? event.completed
        ? CheckCircle2
        : Circle
      : event.kind === 'projectStart'
        ? Flag
        : CalendarClock;
  const isOverdue = event.task && event.date < todayKey && !event.completed;
  const kindLabel =
    event.kind === 'taskDue'
      ? labels.taskDue
      : event.kind === 'projectStart'
        ? labels.projectStart
        : event.kind === 'milestone'
          ? labels.milestone
          : labels.projectDeadline;
  const previewDetails = useMemo(
    () =>
      [
        event.projectNames?.length &&
          `${labels.project}: ${event.projectNames.join(', ')}`,
        `${labels.client}: ${event.clientNames?.join(', ') || labels.noClient}`,
        event.statusLabel && `${labels.status}: ${event.statusLabel}`,
        event.priorityLabel && `${labels.priority}: ${event.priorityLabel}`,
      ].filter(Boolean),
    [event, labels],
  );
  const previewText = useMemo(
    () =>
      [
        `${kindLabel}: ${event.title}`,
        ...previewDetails,
        event.task && labels.dragToReschedule,
      ]
        .filter(Boolean)
        .join('\n'),
    [
      event.task,
      event.title,
      kindLabel,
      labels.dragToReschedule,
      previewDetails,
    ],
  );
  const priorityColor =
    priorityColors[event.task?.priority] ?? 'bg-muted-foreground';

  return (
    <button
      ref={setNodeRef}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.45 : undefined,
      }}
      type="button"
      onClick={() => onSelect(event)}
      aria-label={previewText.replaceAll('\n', '. ')}
      title={previewText}
      {...attributes}
      {...listeners}
      disabled={false}
      aria-disabled={false}
      tabIndex={0}
      className={`group relative flex min-w-0 w-full items-center gap-1.5 rounded-md border-l-2 px-1.5 py-1 text-left text-xs transition-colors hover:bg-accent ${event.task ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'z-20' : ''} ${
        isOverdue
          ? 'border-l-warning bg-warning/10'
          : event.kind === 'projectStart'
            ? 'border-l-info bg-info/10'
            : event.kind === 'projectDeadline'
              ? 'border-l-success bg-success/10'
              : 'border-l-primary bg-primary/10'
      }`}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{event.title}</span>
      {event.task && (
        <span
          className={`size-1.5 shrink-0 rounded-full ${priorityColor}`}
          aria-hidden="true"
        />
      )}
      {!compact && (
        <>
          <span className="hidden shrink-0 text-2xs text-muted-foreground sm:inline">
            {isOverdue ? labels.overdue : (event.statusLabel ?? kindLabel)}
          </span>
          {event.priorityLabel && (
            <span className="hidden shrink-0 text-2xs text-muted-foreground sm:inline">
              {event.priorityLabel}
            </span>
          )}
        </>
      )}
      <span
        role="tooltip"
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-full z-40 hidden w-60 rounded-md border bg-popover p-2.5 text-left text-xs text-popover-foreground shadow-md group-hover:block group-focus-visible:block"
      >
        <span className="mb-1 block font-medium">
          {kindLabel}: {event.title}
        </span>
        {previewDetails.map((detail) => (
          <span key={detail} className="block text-muted-foreground">
            {detail}
          </span>
        ))}
        {event.task && (
          <span className="mt-1 block text-muted-foreground">
            {labels.dragToReschedule}
          </span>
        )}
      </span>
    </button>
  );
}

export function CalendarDateDropZone({ children, className = '', date }) {
  const { isOver, setNodeRef } = useDroppable({ id: dateKey(date) });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-primary/5 ring-2 ring-inset ring-primary/40' : ''}`}
    >
      {children}
    </div>
  );
}
