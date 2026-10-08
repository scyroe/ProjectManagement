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
    memberDialogOpen,
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
    setMemberDialogOpen,
    setProjectForm,
    setProjectSearchQuery,
    setShortcutsOpen,
    setTaskFormDialog,
    shortcutsOpen,
    syncStatus,
    taskFormDialog,
    taskMetrics,
    workspaces,
    workspace,
  } = layout;

  return (
    <AnimationPreferencesProvider enabled={animationsEnabled}>
      <div
        className={`bg-background text-foreground ${
          activeRoute === 'settings'
            ? 'fixed inset-0 overflow-hidden'
            : 'h-dvh overflow-hidden'
        }`}
      >
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
          className={`flex h-full min-h-0 flex-col transition-[padding] duration-200 ${
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
            onAddUser={() => setMemberDialogOpen(true)}
            onSearch={() => setSearchOpen(true)}
            onSidebarToggle={() =>
              setSidebarCollapsed((collapsed) => !collapsed)
            }
            sidebarCollapsed={sidebarCollapsed}
            taskMetrics={taskMetrics}
            workspaces={workspaces}
          />
          <main className="flex min-h-0 flex-1 flex-col p-3 sm:p-5">
            <WorkspaceRouteContent
              activeRoute={activeRoute}
              calendarState={calendarState}
              clientsState={clientsState}
              currentPage={currentPage}
              navigate={navigate}
              onAddSubtask={openTaskForm}
              onAddUser={() => setMemberDialogOpen(true)}
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
              workspaces={workspaces}
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
              weekStartsOn={weekStartsOn}
              workspaceReady={
                workspaces.isReady && Boolean(workspaces.activeWorkspaceId)
              }
              workspaceId={workspaces.activeWorkspaceId}
              workspace={workspace}
            />
          </main>
        </div>
        <UserPanel
          collapsed={accountPanelCollapsed}
          email={userEmail}
          hasMoreNotifications={notificationState.hasMoreNotifications}
          loadingMoreNotifications={notificationState.loadingMoreNotifications}
          notifications={notificationState.notifications}
          onLoadMoreNotifications={notificationState.loadMoreNotifications}
          onMarkAllNotificationsRead={notificationState.markAllRead}
          unreadCount={notificationState.unreadCount}
          profile={notificationState.profile}
          syncStatus={syncStatus}
          onMarkNotificationRead={notificationState.markRead}
          onOpenNotification={handleOpenNotification}
          onToggle={() => setAccountPanelCollapsed((collapsed) => !collapsed)}
          onExpand={() => setAccountPanelCollapsed(false)}
          onSettings={() => navigate('settings')}
          onShortcuts={() => setShortcutsOpen(true)}
        />
        <WorkspaceDialogStack
          dialogs={{
            shortcutsOpen,
            setShortcutsOpen,
            memberDialogOpen,
            setMemberDialogOpen,
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
          workspaces={workspaces}
          workspace={workspace}
          workspaceId={workspaces.activeWorkspaceId}
        />
      </div>
    </AnimationPreferencesProvider>
  );
}

export default WorkspaceLayout;
