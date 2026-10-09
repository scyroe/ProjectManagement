import { FolderKanban, Pencil } from 'lucide-react';
import { Badge } from '@/components/reui/badge';
import { Button } from '@/components/ui/button';
import { VirtualList } from '@/components/ui/virtual-list';

export function ClientProjectsPanel({ client, onEditProject, t }) {
  if (!client.projects.length) {
    return (
      <div className="grid min-h-64 place-items-center rounded-lg border border-dashed p-8 text-center">
        <div>
          <FolderKanban className="mx-auto mb-3 size-7 text-muted-foreground" />
          <p className="text-sm font-medium">{t.noProjects}</p>
        </div>
      </div>
    );
  }

  return (
    <VirtualList
      ariaLabel={t.projectsTitle}
      className="max-h-[min(68vh,48rem)]"
      estimateSize={116}
      getItemKey={(project) => project.id}
      itemClassName="pb-2"
      items={client.projects}
      renderItem={(project) => {
        const progress = project.total
          ? Math.round((project.completed / project.total) * 100)
          : 0;
        return (
          <article className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">
                  {project.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {project.code}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary" size="sm">
                  {project.status}
                </Badge>
                {onEditProject && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`${t.editProject}: ${project.name}`}
                    onClick={() => onEditProject(project)}
                  >
                    <Pencil />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {project.completed}/{project.total} {t.tasks}
              </span>
              <span>{progress}%</span>
            </div>
            <div
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={`${project.name} ${t.progress}`}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </article>
        );
      }}
    />
  );
}
