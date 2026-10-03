import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const dayInMs = 24 * 60 * 60 * 1000;

const TeamWorkloadPanel = ({ tasks, userId }) => {
  const t = useStrings();
  const queryClient = useQueryClient();
  const [capacityHours, setCapacityHours] = useState('');
  const { data: profiles = [], error } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,username,display_name,weekly_capacity_minutes')
        .order('display_name');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (error) {
      toast.error(t.toasts.teamWorkload.loadError, {
        description: error.message,
      });
    }
  }, [error, t]);

  const currentProfile = profiles.find((profile) => profile.id === userId);
  useEffect(() => {
    setCapacityHours(
      currentProfile ? String(currentProfile.weekly_capacity_minutes / 60) : '',
    );
  }, [currentProfile]);

  const workloads = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today.getTime() + 7 * dayInMs);
    const groups = new Map(
      profiles.map((profile) => [
        profile.id,
        {
          id: profile.id,
          name: profile.display_name,
          capacity: profile.weekly_capacity_minutes,
          estimate: 0,
          tasks: 0,
          withoutEstimate: 0,
        },
      ]),
    );
    groups.set('unassigned', {
      id: 'unassigned',
      name: t.teamWorkload.unassigned,
      capacity: null,
      estimate: 0,
      tasks: 0,
      withoutEstimate: 0,
    });

    for (const task of tasks) {
      if (
        task.state?.is_completed ||
        !task.due_date ||
        new Date(`${task.due_date}T00:00:00`) < today ||
        new Date(`${task.due_date}T00:00:00`) > end
      ) {
        continue;
      }
      const id = task.assigned_to ?? 'unassigned';
      const current = groups.get(id) ?? {
        id,
        name: t.teamWorkload.unknownMember,
        capacity: 2400,
        estimate: 0,
        tasks: 0,
        withoutEstimate: 0,
      };
      current.tasks += 1;
      current.estimate += task.estimate_minutes ?? 0;
      if (!task.estimate_minutes) current.withoutEstimate += 1;
      groups.set(id, current);
    }

    return [...groups.values()].filter((item) => item.tasks);
  }, [profiles, t.teamWorkload, tasks]);

  const handleSaveCapacity = async (event) => {
    event.preventDefault();
    const hours = Number(capacityHours);
    if (!Number.isFinite(hours) || hours <= 0 || !currentProfile) return;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ weekly_capacity_minutes: Math.round(hours * 60) })
      .eq('id', userId);
    if (updateError) {
      toast.error(t.toasts.teamWorkload.updateError, {
        description: updateError.message,
      });
      return;
    }
    toast.success(t.toasts.teamWorkload.updated);
    queryClient.invalidateQueries({ queryKey: ['profiles'] });
  };

  return (
    <Frame stacked>
      <FrameHeader>
        <FrameTitle className="text-sm">{t.teamWorkload.title}</FrameTitle>
        <FrameDescription>{t.teamWorkload.description}</FrameDescription>
      </FrameHeader>
      <FramePanel className="space-y-4 p-4 shadow-none">
        {currentProfile && (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={handleSaveCapacity}
          >
            <div className="space-y-1">
              <Label htmlFor="weekly-capacity">
                {t.teamWorkload.capacityLabel}
              </Label>
              <Input
                id="weekly-capacity"
                type="number"
                min="1"
                step="0.5"
                value={capacityHours}
                onChange={(event) => setCapacityHours(event.target.value)}
                className="w-28"
                required
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              {t.teamWorkload.saveCapacity}
            </Button>
          </form>
        )}
        {workloads.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {workloads.map((item) => {
              const capacity = item.capacity ?? 0;
              const percentage = capacity
                ? Math.min(100, (item.estimate / capacity) * 100)
                : 0;
              return (
                <li key={item.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                      {item.name}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.tasks} {t.teamWorkload.tasksSuffix}
                    </span>
                  </div>
                  {capacity > 0 && (
                    <div
                      className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label={`${item.name}: ${t.teamWorkload.estimatedLoad}`}
                      aria-valuenow={Math.round(percentage)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t.teamWorkload.estimatedLoad}:{' '}
                    {(item.estimate / 60).toFixed(1)}h
                    {capacity > 0 &&
                      ` / ${(capacity / 60).toFixed(1)}h ${t.teamWorkload.capacitySuffix}`}
                  </p>
                  {capacity > 0 && item.estimate > capacity && (
                    <p className="mt-1 text-xs text-destructive">
                      {t.teamWorkload.overCapacity}:{' '}
                      {((item.estimate - capacity) / 60).toFixed(1)}h
                    </p>
                  )}
                  {item.withoutEstimate > 0 && (
                    <p className="mt-1 text-xs text-warning-foreground">
                      {item.withoutEstimate} {t.teamWorkload.missingEstimate}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {t.teamWorkload.empty}
          </p>
        )}
      </FramePanel>
    </Frame>
  );
};

export default TeamWorkloadPanel;
