import {
  Activity,
  Building2,
  ChartNoAxesCombined,
  FolderKanban,
} from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import {
  AnimatedTabIndicator,
  AnimatedTabPanel,
} from '@/components/Common/animated-tabs';
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useClientActivity } from '@/hooks/clients/use-client-activity';
import { useStrings } from '@/lib/i18n';
import ClientFormEditor from './ClientFormEditor';

const ClientActivityPanel = lazy(() => import('./ClientActivityPanel'));
const ClientProjectsPanel = lazy(() =>
  import('./ClientProjectsPanel').then((module) => ({
    default: module.ClientProjectsPanel,
  })),
);
const ClientStatisticsPanel = lazy(() =>
  import('./ClientStatisticsPanel').then((module) => ({
    default: module.ClientStatisticsPanel,
  })),
);

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
          <Suspense
            fallback={
              <p
                role="status"
                className="grid h-full min-h-32 place-items-center p-4 text-sm text-muted-foreground"
              >
                {strings.workspaceManagement.loading}
              </p>
            }
          >
            {tab === 'details' ? (
              <ClientDetails client={client} onSaved={onClientUpdated} t={t} />
            ) : (
              <div className="h-full min-h-0 overflow-auto p-3 sm:p-4">
                {tab === 'projects' ? (
                  <ClientProjectsPanel
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
                  <ClientStatisticsPanel client={client} t={t} />
                )}
              </div>
            )}
          </Suspense>
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
