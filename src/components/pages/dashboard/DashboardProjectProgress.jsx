import { FolderKanban } from 'lucide-react';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { VirtualList } from '@/components/ui/virtual-list';

function DashboardProjectProgress({ projects, strings, t }) {
  return (
    <section className="grid gap-3 xl:grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))]">
      <Frame stacked>
        <FrameHeader className="flex-row items-start justify-between gap-2">
          <div>
            <FrameTitle className="text-sm">
              {t.projectProgressTitle}
            </FrameTitle>
            <FrameDescription className="text-xs">
              {t.projectProgressDescription}
            </FrameDescription>
          </div>
          <FolderKanban className="size-4 text-muted-foreground" />
        </FrameHeader>
        <FramePanel className="max-h-136 p-3 shadow-none">
          {projects.length ? (
            <VirtualList
              className="max-h-96"
              estimateSize={56}
              itemClassName="pb-3"
              items={projects}
              getItemKey={(summary) => summary.project.id}
              renderItem={({ project, total, completed }) => {
                const percentage = Math.round((completed / total) * 100);
                return (
                  <div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate font-medium">
                        {project.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {percentage}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {completed} of {total} tasks complete
                    </p>
                  </div>
                );
              }}
            />
          ) : (
            <p className="p-4 text-center text-xs text-muted-foreground">
              {strings.common.noProjectData}
            </p>
          )}
        </FramePanel>
      </Frame>
    </section>
  );
}

export default DashboardProjectProgress;
