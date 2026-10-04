import {
  Activity,
  Building2,
  ChartNoAxesCombined,
  FolderKanban,
  Pencil,
} from 'lucide-react';
import { useState } from 'react';
import {
  AnimatedTabIndicator,
  AnimatedTabPanel,
} from '@/components/Common/animated-tabs';
import { Badge } from '@/components/reui/badge';
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VirtualList } from '@/components/ui/virtual-list';
import { useClientActivity } from '@/hooks/clients/use-client-activity';
import { useStrings } from '@/lib/i18n';
import ClientActivityPanel from './ClientActivityPanel';
import ClientFormEditor from './ClientFormEditor';

const ClientWorkspace = ({ client, onClientUpdated, onEditProject }) => {
  const strings = useStrings();
  const t = strings.clientWorkspace;
  const [tab, setTab] = useState('details');
  const { entries, loading, projects, tasksByProject, error } =
    useClientActivity({
      clientId: client.id,
      enabled: tab === 'activity',
    });
  const tabs = [
    ['details', t.tabs.details, Building2],
    ['projects', t.tabs.projects, FolderKanban],
    ['activity', t.tabs.activity, Activity],
    ['statistics', t.tabs.statistics, ChartNoAxesCombined],
  ];

  return (
    <Frame className="h-full min-h-0" stacked dense>
      <FrameHeader className="gap-3 border-b p-3 sm:p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-10 bg-primary/10 text-primary">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <FrameTitle className="truncate">{client.name}</FrameTitle>
              {client.company && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {client.company}
                </p>
              )}
            </div>
          </div>
        </div>
        <div
          className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-4"
          role="tablist"
          aria-label={t.tabListLabel}
        >
          {tabs.map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`relative flex min-h-10 items-center justify-start gap-1.5 rounded-md px-1 py-1.5 text-xs font-medium leading-tight transition-colors sm:min-h-0 sm:px-2 ${
                tab === value
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab === value && (
                <AnimatedTabIndicator layoutId="client-workspace-tabs" />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="size-3.5 shrink-0" />
                <span>{label}</span>
              </span>
            </button>
          ))}
        </div>
      </FrameHeader>
      <FramePanel
        className={`min-h-0 flex-1 shadow-none ${
          tab === 'details' ? 'overflow-auto p-0' : 'overflow-hidden p-0'
        }`}
      >
        <AnimatedTabPanel
          activeId={tab}
          className={tab === 'details' ? 'min-h-full' : 'h-full min-h-0'}
        >
          {tab === 'details' ? (
            <ClientDetails client={client} onSaved={onClientUpdated} t={t} />
          ) : (
            <div className="h-full min-h-0 overflow-auto p-3 sm:p-4">
              {tab === 'projects' ? (
                <ClientProjects
                  client={client}
                  onEditProject={onEditProject}
                  t={t}
                />
              ) : tab === 'activity' ? (
                error ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    {error}
                  </p>
                ) : (
                  <ClientActivityPanel
                    entries={entries}
                    loading={loading}
                    projects={projects}
                    tasksByProject={tasksByProject}
                  />
                )
              ) : (
                <ClientStatistics client={client} t={t} />
              )}
            </div>
          )}
        </AnimatedTabPanel>
      </FramePanel>
    </Frame>
  );
};

function ClientDetails({ client, onSaved, t }) {
  return (
    <div className="w-full space-y-4 p-3 sm:p-4">
      <div>
        <h2 className="text-base font-semibold">{t.detailsTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.detailsDescription}
        </p>
      </div>
      <ClientFormEditor client={client} inline onSaved={onSaved} open />
    </div>
  );
}

function ClientProjects({ client, onEditProject, t }) {
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

function ClientStatistics({ client, t }) {
  const completion = client.total
    ? Math.round((client.completed / client.total) * 100)
    : 0;
  const activeProjects = client.projects.filter(
    (project) => project.status === 'active',
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{t.statisticsTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.statisticsDescription}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Statistic label={t.projectCount} value={client.projectCount} />
        <Statistic label={t.activeProjects} value={activeProjects} />
        <Statistic label={t.completedTasks} value={client.completed} />
        <Statistic label={t.overdueTasks} value={client.overdue} />
      </div>
      <Frame stacked>
        <FrameHeader>
          <FrameTitle className="text-sm">{t.deliveryTitle}</FrameTitle>
        </FrameHeader>
        <FramePanel className="space-y-3 p-4 shadow-none">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span>{t.completion}</span>
            <span className="font-semibold">{completion}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={t.completion}
            aria-valuenow={completion}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {client.dueSoon} {t.dueSoonTasks} · {client.total} {t.tasks}
          </p>
        </FramePanel>
      </Frame>
    </div>
  );
}

function Statistic({ label, value }) {
  return (
    <Frame dense>
      <FramePanel className="p-4 shadow-none">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </FramePanel>
    </Frame>
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

export default ClientWorkspace;
