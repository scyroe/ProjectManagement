import { CheckCircle2, ListTodo, TimerReset } from 'lucide-react';
import { useStrings } from '@/lib/i18n';

const Metric = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border bg-background/70 px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2">
      <Icon className="size-4 text-primary" />
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {label}
      </span>
      <strong className="text-sm">{value}</strong>
    </div>
  );
};

const TaskWorkspaceHeader = ({ currentCount, completedCount, activeCount }) => {
  const t = useStrings().taskWorkspaceHeader;
  return (
    <div className="grid shrink-0 grid-cols-3 gap-1.5">
      <Metric icon={ListTodo} label={t.current} value={currentCount} />
      <Metric icon={CheckCircle2} label={t.completed} value={completedCount} />
      <Metric icon={TimerReset} label={t.active} value={activeCount} />
    </div>
  );
};

export default TaskWorkspaceHeader;
