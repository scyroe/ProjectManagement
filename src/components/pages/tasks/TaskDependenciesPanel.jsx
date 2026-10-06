import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import VirtualSelect from '@/components/ui/virtual-select';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const TaskDependenciesPanel = ({ task, tasks }) => {
  const t = useStrings();
  const queryClient = useQueryClient();
  const queryKey = ['task-dependencies', task.id];
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: dependencyIds = [], error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('task_dependencies')
        .select('depends_on_task_id')
        .eq('task_id', task.id);
      if (queryError) throw new Error(queryError.message);
      return data.map((dependency) => dependency.depends_on_task_id);
    },
  });

  useEffect(() => {
    setSelectedIds(dependencyIds);
  }, [dependencyIds]);

  useEffect(() => {
    if (error) {
      toast.error(t.toasts.taskDependencies.loadError, {
        description: error.message,
      });
    }
  }, [error, t]);

  const taskById = useMemo(
    () => new Map(tasks.map((candidate) => [candidate.id, candidate])),
    [tasks],
  );
  const options = useMemo(
    () =>
      tasks
        .filter((candidate) => candidate.id !== task.id)
        .map((candidate) => ({
          value: candidate.id,
          label: `${candidate.title} · ${candidate.state?.name ?? t.common.noState}`,
        })),
    [task.id, tasks, t.common.noState],
  );
  const isDirty =
    selectedIds.length !== dependencyIds.length ||
    selectedIds.some((id) => !dependencyIds.includes(id));
  const blockedCount = dependencyIds.filter(
    (id) => !taskById.get(id)?.state?.is_completed,
  ).length;

  const handleSave = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      toast.error(t.toasts.taskDependencies.signInError);
      return;
    }

    const newIds = selectedIds.filter((id) => !dependencyIds.includes(id));
    const removedIds = dependencyIds.filter((id) => !selectedIds.includes(id));
    if (newIds.length) {
      const { error: insertError } = await supabase
        .from('task_dependencies')
        .insert(
          newIds.map((dependsOnTaskId) => ({
            task_id: task.id,
            depends_on_task_id: dependsOnTaskId,
            created_by: userData.user.id,
          })),
        );
      if (insertError) {
        toast.error(t.toasts.taskDependencies.saveError, {
          description: insertError.message,
        });
        queryClient.invalidateQueries({ queryKey });
        return;
      }
    }
    if (removedIds.length) {
      const { error: deleteError } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('task_id', task.id)
        .in('depends_on_task_id', removedIds);
      if (deleteError) {
        toast.error(t.toasts.taskDependencies.saveError, {
          description: deleteError.message,
        });
        queryClient.invalidateQueries({ queryKey });
        return;
      }
    }

    toast.success(t.toasts.taskDependencies.saved);
    queryClient.invalidateQueries({ queryKey });
  };

  return (
    <section className="space-y-3 border-t pt-4">
      <div>
        <h3 className="text-sm font-semibold">{t.taskDependencies.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {blockedCount
            ? t.taskDependencies.blocked.replace(
                '{count}',
                String(blockedCount),
              )
            : t.taskDependencies.unblocked}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-dependencies">
          {t.taskDependencies.dependsOn}
        </Label>
        <VirtualSelect
          id="task-dependencies"
          ariaLabel={t.taskDependencies.dependsOn}
          searchLabel={t.taskDependencies.dependsOn}
          multiple
          values={selectedIds}
          onChange={setSelectedIds}
          options={options}
          placeholder={t.taskDependencies.select}
          emptyLabel={t.taskDependencies.noneFound}
        />
      </div>
      {blockedCount > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {dependencyIds
            .filter((id) => !taskById.get(id)?.state?.is_completed)
            .map((id) => (
              <li key={id}>
                {taskById.get(id)?.title ?? t.taskDependencies.unknownTask}
              </li>
            ))}
        </ul>
      )}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={!isDirty}
          onClick={handleSave}
        >
          {t.taskDependencies.save}
        </Button>
      </div>
    </section>
  );
};

export default TaskDependenciesPanel;
