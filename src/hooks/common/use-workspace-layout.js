import { useEffect, useMemo, useState } from 'react';
import { useCalendar } from '@/hooks/calendar/use-calendar';
import { useClients } from '@/hooks/clients/use-clients';
import { useAppShell } from '@/hooks/common/use-app-shell';
import { useNotifications } from '@/hooks/common/use-notifications';
import { useRealtimeSync } from '@/hooks/common/use-realtime-sync';
import { useWorkspacePreferences } from '@/hooks/common/use-workspace-preferences';
import { useTaskWorkspace } from '@/hooks/tasks/use-task-workspace';
import { useStrings } from '@/lib/i18n';

export function useWorkspaceLayout({ activeRoute, navigate, userId }) {
  const layoutStrings = useStrings().layout;
  const syncStatus = useRealtimeSync();
  const appShell = useAppShell();
  const preferences = useWorkspacePreferences();
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
      appShell.searchOpen,
    defaultTaskFilter:
      activeRoute === 'tasks'
        ? ({
            active: 'current',
            'due-soon': 'due-weekend',
          }[preferences.defaultTaskFilter] ?? preferences.defaultTaskFilter)
        : preferences.defaultTaskFilter,
    includeWorkspaceActivity: activeRoute === 'reports',
    onMetricsChange: setTaskMetrics,
    searchQuery: appShell.searchQuery,
    userId,
  });
  const clientsState = useClients({
    enabled:
      activeRoute === 'clients' ||
      activeRoute === 'projects' ||
      activeRoute === 'dashboard' ||
      appShell.searchOpen,
  });
  const calendarState = useCalendar({
    enabled: activeRoute === 'calendar' || appShell.searchOpen,
  });
  const notificationState = useNotifications({
    tasks: workspace.tasks,
    userId,
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
      appShell.settingsOpen ||
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

      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setShortcutsOpen(true);
      } else if (
        event.key.toLowerCase() === 'n' &&
        !event.ctrlKey &&
        !event.metaKey &&
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
    appShell.settingsOpen,
    clientForm.open,
    projectForm.open,
    shortcutsOpen,
    taskFormDialog.open,
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
    setProjectForm,
    setProjectSearchQuery,
    setShortcutsOpen,
    setTaskFormDialog,
    shortcutsOpen,
    syncStatus,
    taskFormDialog,
    taskMetrics,
    workspace,
  };
}
