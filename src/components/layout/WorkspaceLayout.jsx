import { AnimationPreferencesProvider } from '@/components/Common/animation-preferences';
import { useWorkspaceLayout } from '@/hooks/common/use-workspace-layout';
import Sidebar from './Sidebar';
import UserPanel from './UserPanel';
import WorkspaceDialogStack from './WorkspaceDialogStack';
import WorkspaceHeader from './WorkspaceHeader';
import WorkspaceRouteContent from './WorkspaceRouteContent';

function WorkspaceLayout({
  activeRoute,
  currentPage,
  navigate,
  userEmail,
  userId,
}) {
  const layout = useWorkspaceLayout({ activeRoute, navigate, userId });
  const { appShell, preferences } = layout;
  const {
    accountPanelCollapsed,
    recentSearches,
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
  } = appShell;
  const {
    animationMode,
    animationsEnabled,
    colorMode,
    defaultTaskFilter,
    setAnimationMode,
    setColorMode,
    setDefaultTaskFilter,
    setStyle,
    setTheme,
    setWeekStartsOn,
    style,
    theme,
    weekStartsOn,
  } = preferences;
  const {
    calendarState,
    clientForm,
    clientsState,
    handleOpenNotification,
    handleSearchEntitySelect,
    layoutStrings,
    notificationState,
    onClientSaved,
    onCreateTaskForProject,
    onProjectSaved,
    openClientForm,
    openProjectForm,
    openTaskForm,
    projectForm,
    projectSearchQuery,
    searchClients,
    searchProjects,
    setClientForm,
    setProjectForm,
    setProjectSearchQuery,
    setShortcutsOpen,
    setTaskFormDialog,
    shortcutsOpen,
    syncStatus,
    taskFormDialog,
    taskMetrics,
    workspace,
  } = layout;

  return (
    <AnimationPreferencesProvider enabled={animationsEnabled}>
      <div className="min-h-screen bg-background text-foreground">
        {(!sidebarCollapsed || !accountPanelCollapsed) && (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-black/30 lg:hidden"
            aria-label={layoutStrings.closePanels}
            onClick={() => {
              setSidebarCollapsed(true);
              setAccountPanelCollapsed(true);
            }}
          />
        )}
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
            <WorkspaceRouteContent
              activeRoute={activeRoute}
              calendarState={calendarState}
              clientsState={clientsState}
              currentPage={currentPage}
              navigate={navigate}
              onAddSubtask={openTaskForm}
              onClientUpdated={clientsState.handleClientUpdated}
              onEditProject={openProjectForm}
              onProjectSaved={onProjectSaved}
              onNewClient={() => openClientForm()}
              onNewProject={() => openProjectForm()}
              onNewTask={openTaskForm}
              setProjectSearchQuery={setProjectSearchQuery}
              projectSearchQuery={projectSearchQuery}
              animationsEnabled={animationsEnabled}
              userId={userId}
              weekStartsOn={weekStartsOn}
              workspace={workspace}
            />
          </main>
        </div>
        <UserPanel
          collapsed={accountPanelCollapsed}
          email={userEmail}
          notifications={notificationState.notifications}
          unreadCount={notificationState.unreadCount}
          profile={notificationState.profile}
          syncStatus={syncStatus}
          onOpenNotification={handleOpenNotification}
          onToggle={() => setAccountPanelCollapsed((collapsed) => !collapsed)}
          onExpand={() => setAccountPanelCollapsed(false)}
          onSettings={() => setSettingsOpen(true)}
          onShortcuts={() => setShortcutsOpen(true)}
        />
        <WorkspaceDialogStack
          dialogs={{
            shortcutsOpen,
            setShortcutsOpen,
            settingsOpen,
            setSettingsOpen,
            searchOpen,
            setSearchOpen,
            searchQuery,
            setSearchQuery,
            recentSearches,
            searchProjects,
            searchClients,
            handleSearchEntitySelect,
            taskFormDialog,
            setTaskFormDialog,
            clientForm,
            setClientForm,
            projectForm,
            setProjectForm,
            onNewProject: () => openProjectForm(),
            onClientSaved,
            onCreateTaskForProject,
            onProjectSaved,
          }}
          preferences={{
            animationMode,
            onAnimationModeChange: setAnimationMode,
            colorMode,
            onColorModeChange: setColorMode,
            style,
            onStyleChange: setStyle,
            theme,
            onThemeChange: setTheme,
            defaultTaskFilter,
            onDefaultTaskFilterChange: setDefaultTaskFilter,
            weekStartsOn,
            onWeekStartsOnChange: setWeekStartsOn,
          }}
          userId={userId}
          workspace={workspace}
        />
      </div>
    </AnimationPreferencesProvider>
  );
}

export default WorkspaceLayout;
