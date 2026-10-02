import { ChevronDown, ChevronRight, FolderKanban } from 'lucide-react';
import { useMemo, useState } from 'react';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';
import ProjectActivityPanel from '../projects/ProjectActivityPanel';

const ClientActivityPanel = ({
  entries,
  loading = false,
  projects,
  tasksByProject,
}) => {
  const t = useStrings().activity;
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const entriesByProject = useMemo(() => {
    const taskProjects = new Map();
    const groupedEntries = new Map(projects.map((project) => [project.id, []]));

    for (const project of projects) {
      for (const task of tasksByProject[project.id] ?? []) {
        const projectIds = taskProjects.get(task.id) ?? [];
        projectIds.push(project.id);
        taskProjects.set(task.id, projectIds);
      }
    }

    for (const entry of entries) {
      for (const projectId of taskProjects.get(entry.task_id) ?? []) {
        groupedEntries.get(projectId)?.push(entry);
      }
    }

    return groupedEntries;
  }, [entries, projects, tasksByProject]);

  if (loading) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        {t.loading}
      </p>
    );
  }

  if (!projects.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <FolderKanban className="mx-auto mb-3 size-7 text-muted-foreground" />
        <p className="text-sm font-medium">{t.noProjects}</p>
      </div>
    );
  }

  return (
    <VirtualList
      className="max-h-136"
      estimateSize={56}
      getItemKey={(project) => project.id}
      itemClassName="pb-2"
      items={projects}
      renderItem={(project) => {
        const projectTasks = tasksByProject[project.id] ?? [];
        const projectEntries = entriesByProject.get(project.id) ?? [];
        const expanded = expandedProjectId === project.id;
        return (
          <div className="rounded-lg border">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 p-3 text-left text-sm font-medium"
              onClick={() => setExpandedProjectId(expanded ? null : project.id)}
            >
              <span className="flex min-w-0 items-center gap-2">
                {expanded ? (
                  <ChevronDown className="size-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="size-3.5 shrink-0" />
                )}
                <span className="truncate">{project.name}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {projectTasks.length} {t.tasksSuffix}
              </span>
            </button>
            {expanded && (
              <div className="border-t p-3">
                <ProjectActivityPanel
                  entries={projectEntries}
                  tasks={projectTasks}
                />
              </div>
            )}
          </div>
        );
      }}
    />
  );
};

export default ClientActivityPanel;
