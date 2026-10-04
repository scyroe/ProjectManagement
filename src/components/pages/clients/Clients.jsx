import { Building2 } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';
import ClientWorkspace from './ClientWorkspace';

const Clients = ({
  clients,
  error,
  loading,
  onClientUpdated,
  onEditProject,
  onNewClient,
  query,
  setQuery,
}) => {
  const t = useStrings().clientsPage;
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [projectFilter, setProjectFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const visibleClients = useMemo(
    () =>
      clients.filter((client) => {
        if (projectFilter === 'with-projects' && client.projectCount === 0) {
          return false;
        }
        if (projectFilter === 'without-projects' && client.projectCount > 0) {
          return false;
        }
        if (taskFilter === 'overdue' && !(client.overdue > 0)) return false;
        if (taskFilter === 'due-soon' && !(client.dueSoon > 0)) return false;
        return true;
      }),
    [clients, projectFilter, taskFilter],
  );
  const hasActiveFilters = projectFilter !== 'all' || taskFilter !== 'all';
  const selectedClient =
    visibleClients.find((client) => client.id === selectedClientId) ??
    visibleClients[0];

  return (
    <div className="min-h-0 flex-1">
      <ResizableResponsive
        first={
          <ClientList
            clients={visibleClients}
            error={error}
            loading={loading}
            onNewClient={onNewClient}
            projectFilter={projectFilter}
            onProjectFilterChange={setProjectFilter}
            taskFilter={taskFilter}
            onTaskFilterChange={setTaskFilter}
            query={query}
            selectedId={selectedClient?.id}
            setQuery={setQuery}
            setSelectedId={setSelectedClientId}
            t={t}
          />
        }
        second={
          selectedClient ? (
            <ClientWorkspace
              key={selectedClient.id}
              client={selectedClient}
              onClientUpdated={onClientUpdated}
              onEditProject={onEditProject}
            />
          ) : loading || error ? (
            <ClientEmptyState
              error={error}
              loading={loading}
              onNewClient={onNewClient}
              t={t}
            />
          ) : query.trim() || hasActiveFilters ? (
            <p className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
              {t.noMatchingClients}
            </p>
          ) : (
            <ClientEmptyState
              error={error}
              loading={loading}
              onNewClient={onNewClient}
              t={t}
            />
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

function ClientList({
  clients,
  error,
  loading,
  onNewClient,
  onProjectFilterChange,
  onTaskFilterChange,
  projectFilter,
  query,
  selectedId,
  setQuery,
  setSelectedId,
  taskFilter,
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
          addLabel={t.addClient}
          closeSearchLabel={t.closeSearch}
          onAdd={onNewClient}
          query={query}
          queryPlaceholder={t.searchPlaceholder}
          searchLabel={t.searchClients}
          onQueryChange={setQuery}
          primaryLabel={t.projectFilter}
          primaryValue={projectFilter}
          primaryOptions={[
            { value: 'all', label: t.filters.allClients },
            { value: 'with-projects', label: t.filters.withProjects },
            { value: 'without-projects', label: t.filters.withoutProjects },
          ]}
          onPrimaryChange={onProjectFilterChange}
          secondaryLabel={t.taskFilter}
          secondaryValue={taskFilter}
          secondaryOptions={[
            { value: 'all', label: t.filters.allTasks },
            { value: 'overdue', label: t.filters.overdueTasks },
            { value: 'due-soon', label: t.filters.dueSoonTasks },
          ]}
          onSecondaryChange={onTaskFilterChange}
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
        {!loading && !error && clients.length > 0 && (
          <VirtualList
            ariaLabel={t.title}
            className="h-full"
            estimateSize={76}
            getItemKey={(client) => client.id}
            itemClassName="pb-1.5"
            items={clients}
            renderItem={(client) => {
              const progress = client.total
                ? Math.round((client.completed / client.total) * 100)
                : 0;
              return (
                <button
                  type="button"
                  aria-current={selectedId === client.id ? 'true' : undefined}
                  onClick={() => setSelectedId(client.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedId === client.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border/70 hover:border-border hover:bg-muted/50'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="size-8 shrink-0 bg-primary/10 text-primary">
                      <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {client.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {client.company || client.email || t.noCompany}
                      </span>
                    </span>
                    <Badge variant="secondary" size="sm">
                      {client.projectCount}
                    </Badge>
                  </span>
                  {client.projectCount > 0 && (
                    <span className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {client.overdue} {t.overdueTasks}
                      </span>
                      <span>{progress}%</span>
                    </span>
                  )}
                </button>
              );
            }}
          />
        )}
        {!loading &&
          !error &&
          !clients.length &&
          (query.trim() || projectFilter !== 'all' || taskFilter !== 'all') && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {t.noMatchingClients}
            </p>
          )}
        {!loading &&
          !error &&
          !clients.length &&
          !query.trim() &&
          projectFilter === 'all' &&
          taskFilter === 'all' && (
            <ClientEmptyState onNewClient={onNewClient} t={t} compact />
          )}
      </FramePanel>
    </Frame>
  );
}

function ClientEmptyState({ error, loading, onNewClient, t, compact = false }) {
  if (loading || error) return null;
  return (
    <div
      className={`grid justify-items-center gap-2 text-center ${compact ? 'px-3 py-10' : 'h-full content-center px-6 py-10'}`}
    >
      <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
        <Building2 aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold">{t.empty}</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t.emptyDescription}
      </p>
      <Button type="button" className="mt-2" onClick={onNewClient}>
        {t.createFirstClient}
      </Button>
    </div>
  );
}

function getInitials(value) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase();
}

export default Clients;
