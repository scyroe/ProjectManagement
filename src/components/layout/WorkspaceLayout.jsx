import { AnimatePresence, domMax, LazyMotion, m as motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { AnimationPreferencesProvider } from '@/components/Common/animation-preferences';
import Calendar from '@/components/pages/calendar/Calendar';
import ClientFormDialog from '@/components/pages/clients/ClientFormDialog';
import Clients from '@/components/pages/clients/Clients';
import Dashboard from '@/components/pages/dashboard/Dashboard';
import ProjectFormDialog from '@/components/pages/projects/ProjectFormDialog';
import Projects from '@/components/pages/projects/Projects';
import Reports from '@/components/pages/reports/Reports';
import SettingsDialog from '@/components/pages/settings/SettingsDialog';
import TaskFormDialog from '@/components/pages/tasks/TaskFormDialog';
import TaskWorkspace from '@/components/pages/tasks/TaskWorkspace';
import { useCalendar } from '@/hooks/calendar/use-calendar';
import { useClients } from '@/hooks/clients/use-clients';
import { useAppShell } from '@/hooks/common/use-app-shell';
import { useWorkspacePreferences } from '@/hooks/common/use-workspace-preferences';
import { useTaskWorkspace } from '@/hooks/tasks/use-task-workspace';
import EmptyPage from './EmptyPage';
import SearchDialog from './SearchDialog';
import Sidebar from './Sidebar';
import UserPanel from './UserPanel';
import WorkspaceHeader from './WorkspaceHeader';

const WorkspaceLayout = ({ activeRoute, currentPage, navigate, userId }) => {
  const {
    accountPanelCollapsed,
    recentSearches,
    rememberSearch,
    searchOpen,
    searchQuery,
    setAccountPanelCollapsed,
    setSearchOpen,
    setSearchQuery,
    setSettingsOpen,
    settingsOpen,
    setSidebarCollapsed,
    sidebarCollapsed,
    sidebarCollapsedFinished,
  } = useAppShell();
  const {
    animationMode,
    animationsEnabled,
    colorMode,
    defaultTaskFilter,
    setColorMode,
    setAnimationMode,
    setDefaultTaskFilter,
    setStyle,
    setWeekStartsOn,
    style,
    weekStartsOn,
  } = useWorkspacePreferences();
  const [taskMetrics, setTaskMetrics] = useState({
    currentCount: 0,
    completedCount: 0,
    activeCount: 0,
  });
  const [taskFormDialog, setTaskFormDialog] = useState({
    open: false,
    parentTask: null,
  });
  const [clientForm, setClientForm] = useState({ open: false, client: null });
  const [projectForm, setProjectForm] = useState({
    open: false,
    project: null,
  });
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const workspace = useTaskWorkspace({
    enabled:
      activeRoute === 'tasks' ||
      activeRoute === 'dashboard' ||
      activeRoute === 'projects' ||
      activeRoute === 'calendar' ||
      activeRoute === 'reports' ||
      searchOpen,
    defaultTaskFilter,
    includeWorkspaceActivity: activeRoute === 'reports',
    onMetricsChange: setTaskMetrics,
    searchQuery,
    userId,
  });
  const clientsState = useClients({
    enabled:
      activeRoute === 'clients' || activeRoute === 'projects' || searchOpen,
  });
  const calendarState = useCalendar({
    enabled: activeRoute === 'calendar' || searchOpen,
  });
  const searchValue = searchQuery.trim().toLocaleLowerCase();
  const searchProjects = useMemo(
    () =>
      searchValue
        ? calendarState.projects.filter((project) =>
            `${project.name} ${project.code ?? ''} ${project.status ?? ''}`
              .toLocaleLowerCase()
              .includes(searchValue),
          )
        : [],
    [calendarState.projects, searchValue],
  );
  const searchClients = useMemo(
    () =>
      searchValue
        ? clientsState.allClients.filter((client) =>
            `${client.name} ${client.company ?? ''} ${client.email ?? ''}`
              .toLocaleLowerCase()
              .includes(searchValue),
          )
        : [],
    [clientsState.allClients, searchValue],
  );

  const openClientForm = (client = null) =>
    setClientForm({ open: true, client });
  const openProjectForm = (project = null) =>
    setProjectForm({ open: true, project });

  const openTaskForm = (parentTask = null) =>
    setTaskFormDialog({ open: true, parentTask });

  const handleSearchEntitySelect = (type, id, label) => {
    rememberSearch(searchQuery);
    if (type === 'task') {
      const task = workspace.searchResults.find((item) => item.id === id);
      if (!task) return;
      workspace.setSelectedId(id);
      workspace.setFilter(
        task.state?.is_completed
          ? 'completed'
          : workspace.runningTaskId === id
            ? 'active'
            : 'current',
      );
      navigate('tasks');
    } else if (type === 'project') {
      setProjectSearchQuery(label);
      navigate('projects');
    } else if (type === 'client') {
      clientsState.setQuery(label);
      navigate('clients');
    }
    setSearchOpen(false);
  };

  return (
    <AnimationPreferencesProvider enabled={animationsEnabled}>
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar
          activeRoute={activeRoute}
          collapsed={sidebarCollapsed}
          collapsedFinished={sidebarCollapsedFinished}
          onNavigate={navigate}
          onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
        <div
          className={`transition-[padding] duration-200 ${
            sidebarCollapsed
              ? accountPanelCollapsed
                ? 'lg:pl-[49px] lg:pr-[49px]'
                : 'lg:pl-[49px] lg:pr-80'
              : accountPanelCollapsed
                ? 'lg:pl-64 lg:pr-[49px]'
                : 'lg:pl-64 lg:pr-80'
          }`}
          style={{
            '--workspace-sidebar-width': sidebarCollapsed ? '49px' : '16rem',
            '--workspace-user-panel-width': accountPanelCollapsed
              ? '49px'
              : '20rem',
          }}
        >
          <WorkspaceHeader
            accountPanelCollapsed={accountPanelCollapsed}
            activeRoute={activeRoute}
            currentPage={currentPage}
            onAccountPanelToggle={() =>
              setAccountPanelCollapsed((collapsed) => !collapsed)
            }
            onNewClient={() => openClientForm()}
            onNewProject={() => openProjectForm()}
            onNewTask={() => openTaskForm()}
            onSearch={() => setSearchOpen(true)}
            onSidebarToggle={() =>
              setSidebarCollapsed((collapsed) => !collapsed)
            }
            sidebarCollapsed={sidebarCollapsed}
            taskMetrics={taskMetrics}
          />
          <main className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col p-3 sm:p-5">
            <LazyMotion features={domMax}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeRoute}
                  initial={animationsEnabled ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={animationsEnabled ? { opacity: 0, y: -4 } : undefined}
                  transition={
                    animationsEnabled
                      ? { duration: 0.18, ease: 'easeOut' }
                      : { duration: 0 }
                  }
                  className="flex h-full min-h-0 flex-col"
                >
                  {activeRoute === 'dashboard' ? (
                    <Dashboard workspace={workspace} navigate={navigate} />
                  ) : activeRoute === 'tasks' ? (
                    <TaskWorkspace
                      workspace={workspace}
                      onNewTask={() => openTaskForm()}
                      onAddSubtask={openTaskForm}
                    />
                  ) : activeRoute === 'projects' ? (
                    <Projects
                      workspace={workspace}
                      onEditProject={openProjectForm}
                      clientProgress={clientsState.clients}
                      searchQuery={projectSearchQuery}
                    />
                  ) : activeRoute === 'clients' ? (
                    <Clients
                      clients={clientsState.clients}
                      error={clientsState.error}
                      loading={clientsState.loading}
                      onEditClient={openClientForm}
                      query={clientsState.query}
                      setQuery={clientsState.setQuery}
                    />
                  ) : activeRoute === 'calendar' ? (
                    <Calendar
                      calendar={calendarState}
                      workspace={workspace}
                      navigate={navigate}
                      weekStartsOn={weekStartsOn}
                    />
                  ) : activeRoute === 'reports' ? (
                    <Reports workspace={workspace} navigate={navigate} />
                  ) : (
                    <EmptyPage route={currentPage} />
                  )}
                </motion.div>
              </AnimatePresence>
            </LazyMotion>
          </main>
        </div>
        <UserPanel
          collapsed={accountPanelCollapsed}
          onToggle={() => setAccountPanelCollapsed((collapsed) => !collapsed)}
          onExpand={() => setAccountPanelCollapsed(false)}
          onSettings={() => setSettingsOpen(true)}
        />
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          animationMode={animationMode}
          onAnimationModeChange={setAnimationMode}
          colorMode={colorMode}
          onColorModeChange={setColorMode}
          style={style}
          onStyleChange={setStyle}
          defaultTaskFilter={defaultTaskFilter}
          onDefaultTaskFilterChange={setDefaultTaskFilter}
          weekStartsOn={weekStartsOn}
          onWeekStartsOnChange={setWeekStartsOn}
        />
        <SearchDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          tasks={workspace.searchResults}
          projects={searchProjects}
          clients={searchClients}
          recentSearches={recentSearches}
          onSelectRecentSearch={setSearchQuery}
          onSelectEntity={handleSearchEntitySelect}
        />
        <TaskFormDialog
          open={taskFormDialog.open}
          parentTask={taskFormDialog.parentTask}
          onOpenChange={(open) =>
            setTaskFormDialog((current) => ({ ...current, open }))
          }
          onCreated={workspace.handleTaskCreated}
        />
        <ClientFormDialog
          client={clientForm.client}
          open={clientForm.open}
          onOpenChange={(open) =>
            setClientForm((current) => ({ ...current, open }))
          }
          onSaved={(client) =>
            clientForm.client
              ? clientsState.handleClientUpdated(client)
              : clientsState.handleClientCreated(client)
          }
        />
        <ProjectFormDialog
          open={projectForm.open}
          onOpenChange={(open) =>
            setProjectForm((current) => ({ ...current, open }))
          }
          onSaved={(project) => {
            if (projectForm.project) {
              clientsState.handleProjectUpdated(project);
              workspace.handleProjectUpdated(project);
            } else {
              clientsState.handleProjectCreated(project);
            }
          }}
          project={projectForm.project}
        />
      </div>
    </AnimationPreferencesProvider>
  );
};

export default WorkspaceLayout;
