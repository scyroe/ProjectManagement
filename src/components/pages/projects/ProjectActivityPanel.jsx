import { ChevronDown, ChevronRight, ListTodo } from 'lucide-react';
import { useMemo, useState } from 'react';
import ActivityPanel from '@/components/Common/ActivityPanel';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';

const ProjectActivityPanel = ({ entries, loading = false, tasks }) => {
  const t = useStrings().activity;
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const entriesByTask = useMemo(() => {
    const groupedEntries = new Map(tasks.map((task) => [task.id, []]));
    for (const entry of entries) {
      groupedEntries.get(entry.task_id)?.push(entry);
    }
    return groupedEntries;
  }, [entries, tasks]);

  if (loading) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        {t.loading}
      </p>
    );
  }

  if (!tasks.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <ListTodo className="mx-auto mb-3 size-7 text-muted-foreground" />
        <p className="text-sm font-medium">{t.noTasks}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t.overallTitle}
        </p>
        <ActivityPanel entries={entries} showTask />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t.byTaskTitle}
        </p>
        <VirtualList
          className="max-h-136"
          estimateSize={56}
          getItemKey={(task) => task.id}
          itemClassName="pb-2"
          items={tasks}
          renderItem={(task) => {
            const taskEntries = entriesByTask.get(task.id) ?? [];
            const expanded = expandedTaskId === task.id;
            return (
              <div className="rounded-lg border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 p-3 text-left text-sm font-medium"
                  onClick={() => setExpandedTaskId(expanded ? null : task.id)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {expanded ? (
                      <ChevronDown className="size-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0" />
                    )}
                    <span className="truncate">{task.title}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {taskEntries.length} {t.entriesSuffix}
                  </span>
                </button>
                {expanded && (
                  <div className="border-t p-3">
                    <ActivityPanel entries={taskEntries} />
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export default ProjectActivityPanel;
