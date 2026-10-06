import { FolderKanban } from 'lucide-react';
import { useMemo, useState } from 'react';
import ListFilterToolbar from '@/components/Common/ListFilterToolbar';
import { Badge } from '@/components/reui/badge';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { ResizableResponsive } from '@/components/reui/resizable';
import { Button } from '@/components/ui/button';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';
import ProjectWorkspace from './ProjectWorkspace';

const Projects = ({
  clientError,
  clientLoading,
  clientProgress = [],
  onNewProject,
  onNewTask,
  onProjectSaved,
  searchQuery = '',
  setSearchQuery,
  workspaceId,
  workspace,
}) => {
  const t = useStrings().projectsPage;
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const activeClientProgress = useMemo(
    () => clientProgress.filter((client) => client.projectCount > 0),
    [clientProgress],
  );
  const projectOptions = useMemo(() => {
    const projectMap = new Map();
    for (const client of activeClientProgress) {
      for (const project of client.projects) {
        const existing = projectMap.get(project.id);
        projectMap.set(project.id, {
          ...existing,
          ...project,
          clientIds: [...new Set([...(existing?.clientIds ?? []), client.id])],
          clientNames: [
            ...new Set([...(existing?.clientNames ?? []), client.name]),
          ],
        });
      }
    }
    return Array.from(projectMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [activeClientProgress]);
  const visibleProjects = useMemo(() => {
    const normalizedQuery = searchQuery.toLocaleLowerCase().trim();
    return projectOptions.filter((project) => {
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return false;
      }
      if (clientFilter !== 'all' && !project.clientIds.includes(clientFilter)) {
        return false;
      }
      return (
        !normalizedQuery ||
        `${project.name} ${project.code ?? ''} ${project.clientNames.join(' ')}`
          .toLocaleLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [clientFilter, projectOptions, searchQuery, statusFilter]);
  const clientOptions = useMemo(() => {
    const clients = new Map();
    for (const project of projectOptions) {
      project.clientIds.forEach((id, index) => {
        clients.set(id, { id, name: project.clientNames[index] });
      });
    }
    return Array.from(clients.values()).sort((first, second) =>
      first.name.localeCompare(second.name),
    );
  }, [projectOptions]);
  const selectedProject =
    visibleProjects.find((project) => project.id === selectedProjectId) ??
    visibleProjects[0];

  return (
    <div className="min-h-0 flex-1">
      <ResizableResponsive
        first={
          <ProjectList
            error={clientError}
            loading={clientLoading}
            onNewProject={onNewProject}
            filter={statusFilter}
            onFilterChange={setStatusFilter}
            clientFilter={clientFilter}
            onClientFilterChange={setClientFilter}
            clients={clientOptions}
            projects={visibleProjects}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedId={selectedProject?.id}
            setSelectedId={setSelectedProjectId}
            t={t}
          />
        }
        second={
          selectedProject ? (
            <ProjectWorkspace
              key={selectedProject.id}
              project={selectedProject}
              workspaceId={workspaceId}
              workspace={workspace}
              onProjectSaved={onProjectSaved}
              onNewTask={onNewTask}
            />
          ) : clientLoading || clientError ? (
            <ProjectEmptyState
              error={clientError}
              loading={clientLoading}
              onNewProject={onNewProject}
              t={t}
            />
          ) : searchQuery.trim() ||
            statusFilter !== 'all' ||
            clientFilter !== 'all' ? (
            <p className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
              {t.noMatchingProjects}
            </p>
          ) : (
            <ProjectEmptyState onNewProject={onNewProject} t={t} />
          )
        }
        defaultSize={34}
        minSize={24}
        maxSize={56}
        className="h-full"
      />
    </div>
  );
};

function ProjectList({
  error,
  filter,
  loading,
  onNewProject,
  onFilterChange,
  clientFilter,
  onClientFilterChange,
  clients,
  projects,
  searchQuery,
  setSearchQuery,
  selectedId,
  setSelectedId,
  t,
}) {
  return (
    <Frame className="h-full min-h-0" stacked dense>
      <FrameHeader className="gap-3 border-b p-3 sm:p-4">
        <div>
          <FrameTitle>{t.title}</FrameTitle>
          <FrameDescription className="mt-1">{t.description}</FrameDescription>
        </div>
        <ListFilterToolbar
          addLabel={t.addProject}
          closeSearchLabel={t.closeSearch}
          onAdd={onNewProject}
          query={searchQuery}
          queryPlaceholder={t.searchPlaceholder}
          searchLabel={t.searchProjects}
          onQueryChange={setSearchQuery}
          primaryLabel={t.statusFilter}
          primaryValue={filter}
          primaryOptions={[
            { value: 'all', label: t.filters.all },
            { value: 'planning', label: t.filters.planning },
            { value: 'active', label: t.filters.active },
            { value: 'paused', label: t.filters.paused },
            { value: 'completed', label: t.filters.completed },
            { value: 'archived', label: t.filters.archived },
          ]}
          onPrimaryChange={onFilterChange}
          secondaryLabel={t.clientFilter}
          secondaryValue={clientFilter}
          secondaryOptions={[
            { value: 'all', label: t.filters.allClients },
            ...clients.map((client) => ({
              value: client.id,
              label: client.name,
            })),
          ]}
          onSecondaryChange={onClientFilterChange}
        />
      </FrameHeader>
      <FramePanel className="min-h-0 flex-1 overflow-hidden p-2 shadow-none sm:p-3">
        {loading && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t.loading}
          </p>
        )}
        {!loading && error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </p>
        )}
        {!loading && !error && projects.length > 0 && (
          <VirtualList
            ariaLabel={t.title}
            className="h-full"
            estimateSize={82}
            getItemKey={(project) => project.id}
            itemClassName="pb-1.5"
            items={projects}
            renderItem={(project) => (
              <button
                type="button"
                aria-current={selectedId === project.id ? 'true' : undefined}
                onClick={() => setSelectedId(project.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedId === project.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border/70 hover:border-border hover:bg-muted/50'
                }`}
              >
                <span className="flex min-w-0 items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {project.name}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {project.code} · {project.clientNames.join(', ')}
                    </span>
                  </span>
                  <Badge variant="secondary" size="sm">
                    {project.status}
                  </Badge>
                </span>
                <span className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {project.completed}/{project.total} {t.tasksSuffix}
                  </span>
                  <span>
                    {project.overdue} {t.overdueSuffix}
                  </span>
                </span>
              </button>
            )}
          />
        )}
        {!loading &&
          !error &&
          !projects.length &&
          (searchQuery.trim() ||
            filter !== 'all' ||
            clientFilter !== 'all') && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {t.noMatchingProjects}
            </p>
          )}
        {!loading &&
          !error &&
          !projects.length &&
          !searchQuery.trim() &&
          filter === 'all' &&
          clientFilter === 'all' && (
            <ProjectEmptyState onNewProject={onNewProject} t={t} compact />
          )}
      </FramePanel>
    </Frame>
  );
}

function ProjectEmptyState({
  error,
  loading,
  onNewProject,
  t,
  compact = false,
}) {
  if (loading || error) return null;
  return (
    <div
      className={`grid justify-items-center gap-2 text-center ${compact ? 'px-3 py-10' : 'h-full content-center px-6 py-10'}`}
    >
      <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
        <FolderKanban aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold">{t.empty}</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t.emptyDescription}
      </p>
      <Button type="button" className="mt-2" onClick={onNewProject}>
        {t.addProject}
      </Button>
    </div>
  );
}

export default Projects;
