import { useEffect, useMemo, useState } from 'react';
import { useCalendar } from '@/hooks/calendar/use-calendar';
import { useClients } from '@/hooks/clients/use-clients';
import { useAppShell } from '@/hooks/common/use-app-shell';
import { useNotifications } from '@/hooks/common/use-notifications';
import { useRealtimeSync } from '@/hooks/common/use-realtime-sync';
import { useWorkspacePreferences } from '@/hooks/common/use-workspace-preferences';
import { useWorkspaces } from '@/hooks/common/use-workspaces';
import { useTaskWorkspace } from '@/hooks/tasks/use-task-workspace';
import { useStrings } from '@/lib/i18n';

export function useWorkspaceLayout({ activeRoute, navigate, userId }) {
  const layoutStrings = useStrings().layout;
  const appShell = useAppShell();
  const preferences = useWorkspacePreferences();
  const workspaces = useWorkspaces(userId);
  const workspaceReady =
    workspaces.isReady && Boolean(workspaces.activeWorkspaceId);
  const syncStatus = useRealtimeSync({
    userId,
    workspaceId: workspaces.activeWorkspaceId,
  });
  const [taskMetrics, setTaskMetrics] = useState({
    currentCount: 0,
    completedCount: 0,
    activeCount: 0,
  });
  const [taskFormDialog, setTaskFormDialog] = useState({
    open: false,
    parentTask: null,
    initialProjectId: null,
  });
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ open: false, client: null });
  const [projectForm, setProjectForm] = useState({
    open: false,
    project: null,
  });
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const workspace = useTaskWorkspace({
    enabled:
      workspaceReady &&
      (activeRoute === 'tasks' ||
        activeRoute === 'dashboard' ||
        activeRoute === 'projects' ||
        activeRoute === 'calendar' ||
        activeRoute === 'reports' ||
        appShell.searchOpen),
    workspaceId: workspaces.activeWorkspaceId,
    defaultTaskFilter:
      activeRoute === 'tasks'
        ? ({
            active: 'current',
            'due-soon': 'due-weekend',
          }[preferences.defaultTaskFilter] ?? preferences.defaultTaskFilter)
        : preferences.defaultTaskFilter,
    includeWorkspaceActivity: activeRoute === 'reports',
    loadAllTasks:
      activeRoute === 'projects' ||
      activeRoute === 'calendar' ||
      activeRoute === 'reports',
    loadSession:
      activeRoute === 'tasks' ||
      activeRoute === 'dashboard' ||
      activeRoute === 'projects' ||
      activeRoute === 'calendar',
    loadTasks:
      activeRoute === 'tasks' ||
      activeRoute === 'projects' ||
      activeRoute === 'calendar' ||
      activeRoute === 'reports' ||
      appShell.searchOpen,
    onMetricsChange: setTaskMetrics,
    searchEnabled: appShell.searchOpen,
    searchQuery: appShell.searchQuery,
    userId,
  });
  const clientsState = useClients({
    enabled:
      workspaceReady &&
      (activeRoute === 'clients' ||
        activeRoute === 'projects' ||
        appShell.searchOpen),
    workspaceId: workspaces.activeWorkspaceId,
  });
  const calendarState = useCalendar({
    enabled:
      workspaceReady && (activeRoute === 'calendar' || appShell.searchOpen),
    workspaceId: workspaces.activeWorkspaceId,
  });
  const notificationState = useNotifications({
    userId,
    enabled: workspaceReady,
    workspaceId: workspaces.activeWorkspaceId,
  });
  const searchValue = appShell.searchQuery.trim().toLocaleLowerCase();
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
  const openTaskForm = (parentTask = null, initialProjectId = null) =>
    setTaskFormDialog({ open: true, parentTask, initialProjectId });

  useEffect(() => {
    const dialogOpen =
      appShell.searchOpen ||
      shortcutsOpen ||
      memberDialogOpen ||
      taskFormDialog.open ||
      clientForm.open ||
      projectForm.open;
    const handleKeyDown = (event) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return;
      }
      if (dialogOpen) return;

      const commandKey = event.ctrlKey || event.metaKey;
      if (commandKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        appShell.setSearchOpen(true);
      } else if (
        commandKey &&
        event.altKey &&
        /^Digit[1-7]$/.test(event.code)
      ) {
        event.preventDefault();
        const routeIndex = Number(event.code.slice(-1)) - 1;
        const routeIds = [
          'dashboard',
          'tasks',
          'projects',
          'clients',
          'calendar',
          'work-log',
          'reports',
        ];
        navigate(routeIds[routeIndex]);
      } else if (
        activeRoute === 'tasks' &&
        event.altKey &&
        /^Digit[1-5]$/.test(event.code) &&
        workspace.selected
      ) {
        const states = [
          ...new Map(
            workspace.tasks
              .map((task) => task.state)
              .filter(Boolean)
              .sort((first, second) => first.sort_order - second.sort_order)
              .map((state) => [state.id, state]),
          ).values(),
        ];
        const targetState = states[Number(event.code.slice(-1)) - 1];
        if (targetState) {
          event.preventDefault();
          workspace.updateTaskState(workspace.selected, targetState);
        }
      } else if (
        activeRoute === 'tasks' &&
        event.code === 'Space' &&
        workspace.selected &&
        !(
          event.target instanceof HTMLElement &&
          event.target.closest('button, a, select, [role="button"]')
        ) &&
        !event.altKey &&
        !commandKey
      ) {
        event.preventDefault();
        workspace.toggleTimer(workspace.selected);
      } else if (event.key === '?' && !commandKey) {
        event.preventDefault();
        setShortcutsOpen(true);
      } else if (
        event.key.toLowerCase() === 'n' &&
        !commandKey &&
        !event.altKey
      ) {
        event.preventDefault();
        setTaskFormDialog({ open: true, parentTask: null });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    appShell.searchOpen,
    appShell.setSearchOpen,
    activeRoute,
    clientForm.open,
    memberDialogOpen,
    projectForm.open,
    shortcutsOpen,
    taskFormDialog.open,
    navigate,
    workspace.selected,
    workspace.tasks,
    workspace.toggleTimer,
    workspace.updateTaskState,
  ]);

  const handleSearchEntitySelect = (type, id, label) => {
    appShell.rememberSearch(appShell.searchQuery);
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
    appShell.setSearchOpen(false);
  };

  const handleOpenNotification = async (notification) => {
    await notificationState.markRead(notification);
    if (!notification.task_id) return;
    workspace.setSelectedId(notification.task_id);
    const task = workspace.tasks.find(
      (item) => item.id === notification.task_id,
    );
    workspace.setFilter(task?.state?.is_completed ? 'completed' : 'current');
    navigate('tasks');
    appShell.setAccountPanelCollapsed(true);
  };

  const onClientSaved = (client) =>
    clientForm.client
      ? clientsState.handleClientUpdated(client)
      : clientsState.handleClientCreated(client);
  const onCreateTaskForProject = (project) => openTaskForm(null, project.id);
  const onProjectSaved = (project) => {
    if (projectForm.project) {
      clientsState.handleProjectUpdated(project);
      workspace.handleProjectUpdated(project);
    } else {
      clientsState.handleProjectCreated(project);
    }
  };

  return {
    appShell,
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
    preferences,
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
  };
}
