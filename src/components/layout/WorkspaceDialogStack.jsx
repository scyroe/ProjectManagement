import ClientFormDialog from '@/components/pages/clients/ClientFormDialog';
import ProjectFormDialog from '@/components/pages/projects/ProjectFormDialog';
import WorkspaceMemberDialog from '@/components/pages/settings/WorkspaceMemberDialog';
import TaskFormDialog from '@/components/pages/tasks/TaskFormDialog';
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog';
import SearchDialog from './SearchDialog';

function WorkspaceDialogStack({ dialogs, workspace, workspaces, workspaceId }) {
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
    memberDialogOpen,
    setMemberDialogOpen,
    setShortcutsOpen,
    setTaskFormDialog,
    shortcutsOpen,
    taskFormDialog,
  } = dialogs;

  return (
    <>
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
      <WorkspaceMemberDialog
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
        workspaces={workspaces}
      />
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        tasks={workspace.searchResults}
        searchError={workspace.searchError}
        searchHasMore={workspace.searchHasMore}
        searchLoading={workspace.searchLoading}
        onLoadMoreSearchResults={workspace.loadMoreSearchResults}
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
        workspaceId={workspaceId}
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
        workspaceId={workspaceId}
      />
    </>
  );
}

export default WorkspaceDialogStack;
