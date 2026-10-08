import { CheckCircle2, ListTodo, TimerReset } from 'lucide-react';
import { useStrings } from '@/lib/i18n';

const Metric = ({ compact, icon: Icon, label, value }) => {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border bg-background/70 px-2 py-1.5 ${
        compact ? '' : 'sm:gap-2 sm:px-3 sm:py-2'
      }`}
      title={`${label}: ${value}`}
    >
      {compact && <span className="sr-only">{label}</span>}
      <Icon className="size-4 text-primary" />
      <span
        className={`text-xs text-muted-foreground ${
          compact ? 'hidden' : 'hidden sm:inline'
        }`}
      >
        {label}
      </span>
      <strong className="text-sm">{value}</strong>
    </div>
  );
};

const TaskWorkspaceHeader = ({
  activeCount,
  compact = false,
  completedCount,
  currentCount,
}) => {
  const t = useStrings().taskWorkspaceHeader;
  return (
    <div className="grid shrink-0 grid-cols-3 gap-1.5">
      <Metric
        compact={compact}
        icon={ListTodo}
        label={t.current}
        value={currentCount}
      />
      <Metric
        compact={compact}
        icon={CheckCircle2}
        label={t.completed}
        value={completedCount}
      />
      <Metric
        compact={compact}
        icon={TimerReset}
        label={t.active}
        value={activeCount}
      />
    </div>
  );
};

export default TaskWorkspaceHeader;
