import ClientFormDialog from '@/components/pages/clients/ClientFormDialog';
import ProjectFormDialog from '@/components/pages/projects/ProjectFormDialog';
import SettingsDialog from '@/components/pages/settings/SettingsDialog';
import TaskFormDialog from '@/components/pages/tasks/TaskFormDialog';
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog';
import SearchDialog from './SearchDialog';

function WorkspaceDialogStack({ dialogs, preferences, userId, workspace }) {
  const {
    clientForm,
    handleSearchEntitySelect,
    projectForm,
    recentSearches,
    searchClients,
    searchOpen,
    searchProjects,
    searchQuery,
    setClientForm,
    setProjectForm,
    setSearchOpen,
    setSearchQuery,
    setSettingsOpen,
    setShortcutsOpen,
    setTaskFormDialog,
    settingsOpen,
    shortcutsOpen,
    taskFormDialog,
  } = dialogs;

  return (
    <>
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        tasks={workspace.tasks}
        userId={userId}
        {...preferences}
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
        initialProjectId={taskFormDialog.initialProjectId}
        onOpenChange={(open) =>
          setTaskFormDialog((current) => ({ ...current, open }))
        }
        onCreated={workspace.handleTaskCreated}
        onStartTask={(task) => workspace.toggleTimer(task)}
      />
      <ClientFormDialog
        client={clientForm.client}
        onCreateProject={dialogs.onNewProject}
        open={clientForm.open}
        onOpenChange={(open) =>
          setClientForm((current) => ({ ...current, open }))
        }
        onSaved={dialogs.onClientSaved}
      />
      <ProjectFormDialog
        open={projectForm.open}
        onCreateTask={dialogs.onCreateTaskForProject}
        onOpenChange={(open) =>
          setProjectForm((current) => ({ ...current, open }))
        }
        onSaved={dialogs.onProjectSaved}
        project={projectForm.project}
      />
    </>
  );
}

export default WorkspaceDialogStack;
