import { Activity } from 'lucide-react';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import VirtualSelect from '@/components/ui/virtual-select';

function DashboardRecentActivity({
  actionLabel,
  activity,
  activityActionFilter,
  activityActions,
  activityProjectFilter,
  projectOptions,
  relativeLabel,
  setActivityActionFilter,
  setActivityProjectFilter,
  strings,
  t,
  taskById,
  visibleActivity,
}) {
  return (
    <section className="grid gap-3 xl:grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))]">
      <Frame stacked>
        <FrameHeader className="gap-3">
          <div>
            <FrameTitle className="text-sm">{t.recentActivityTitle}</FrameTitle>
            <FrameDescription className="text-[0.78125rem]">
              {t.recentActivityDescription}
            </FrameDescription>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              value={activityActionFilter}
              onValueChange={setActivityActionFilter}
            >
              <SelectTrigger aria-label={t.allActions}>
                <SelectValue>
                  {activityActionFilter === 'all'
                    ? t.allActions
                    : (actionLabel[activityActionFilter] ??
                      activityActionFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allActions}</SelectItem>
                {activityActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {actionLabel[action] ?? action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <VirtualSelect
              ariaLabel={t.allProjects}
              searchLabel={t.allProjects}
              value={activityProjectFilter}
              onChange={setActivityProjectFilter}
              placeholder={t.allProjects}
              options={[
                { value: 'all', label: t.allProjects },
                ...projectOptions.map((project) => ({
                  value: project.id,
                  label: project.name,
                })),
              ]}
            />
          </div>
        </FrameHeader>
        <FramePanel className="space-y-1 p-2 shadow-none">
          {visibleActivity.slice(0, 6).map((item) => {
            const task = taskById.get(item.task_id);
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-lg px-1.5 py-2"
              >
                <Activity className="size-3.5 shrink-0 text-muted-foreground" />
                <p className="min-w-0 flex-1 truncate text-xs">
                  <span className="font-medium">
                    {actionLabel[item.action] ?? item.action}
                  </span>{' '}
                  {task?.title ?? strings.common.aTask}
                </p>
                <span className="shrink-0 text-[0.78125rem] text-muted-foreground">
                  {relativeLabel(item.created_at, strings.common)}
                </span>
              </div>
            );
          })}
          {!visibleActivity.length && (
            <p className="p-4 text-center text-xs text-muted-foreground">
              {activity.length ? t.noFilteredActivity : t.recentActivityEmpty}
            </p>
          )}
        </FramePanel>
      </Frame>
    </section>
  );
}

export default DashboardRecentActivity;
