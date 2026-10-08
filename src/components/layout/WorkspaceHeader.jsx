import {
  Building2,
  ChevronDown,
  FolderPlus,
  ListPlus,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import TaskWorkspaceHeader from '@/components/pages/tasks/TaskWorkspaceHeader';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStrings } from '@/lib/i18n';
import WorkspaceCreateDialog from './WorkspaceCreateDialog';

const WorkspaceHeader = ({
  accountPanelCollapsed,
  activeRoute,
  currentPage,
  onAccountPanelToggle,
  onAddUser,
  onNewClient,
  onNewProject,
  onNewTask,
  onSearch,
  onSidebarToggle,
  sidebarCollapsed,
  taskMetrics,
  workspaces,
}) => {
  const strings = useStrings();
  const t = strings.layout.workspaceHeader;
  const workspaceT = strings.workspaceManagement;
  const CurrentIcon = currentPage?.icon;
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const compact = !sidebarCollapsed && !accountPanelCollapsed;

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon-lg"
            className="lg:hidden"
            aria-label={sidebarCollapsed ? t.openNavigation : t.closeNavigation}
            title={sidebarCollapsed ? t.openNavigation : t.closeNavigation}
            onClick={onSidebarToggle}
          >
            {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          <div className="hidden min-w-0 items-center gap-2 text-sm font-medium sm:flex">
            {CurrentIcon && (
              <CurrentIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">
              {currentPage && strings.routes[currentPage.id]}
            </span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2">
          {activeRoute === 'tasks' && (
            <TaskWorkspaceHeader {...taskMetrics} compact={compact} />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={t.createMenu}
                  size={compact ? 'icon' : 'default'}
                  className={compact ? 'shrink-0' : 'gap-2'}
                >
                  <Plus aria-hidden="true" />
                  {!compact && (
                    <>
                      <span className="hidden sm:inline">{t.createMenu}</span>
                      <ChevronDown
                        aria-hidden="true"
                        className="hidden size-3.5 sm:inline"
                      />
                    </>
                  )}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={onNewTask}>
                <ListPlus aria-hidden="true" />
                {t.newTask}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNewProject}>
                <FolderPlus aria-hidden="true" />
                {t.newProject}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNewClient}>
                <UserPlus aria-hidden="true" />
                {t.newClient}
              </DropdownMenuItem>
              {workspaces && (
                <DropdownMenuItem onClick={() => setWorkspaceDialogOpen(true)}>
                  <Building2 aria-hidden="true" />
                  {workspaceT.create}
                </DropdownMenuItem>
              )}
              {workspaces?.canManageMembers && (
                <DropdownMenuItem onClick={onAddUser}>
                  <UserPlus aria-hidden="true" />
                  {t.newUser}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={t.openSearch}
            title={t.searchTitle}
            className="shrink-0"
            onClick={onSearch}
          >
            <Search />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon-lg"
          className="lg:hidden"
          aria-label={
            accountPanelCollapsed ? t.openAccountPanel : t.closeAccountPanel
          }
          title={
            accountPanelCollapsed ? t.openAccountPanel : t.closeAccountPanel
          }
          onClick={onAccountPanelToggle}
        >
          {accountPanelCollapsed ? <PanelRightOpen /> : <PanelRightClose />}
        </Button>
      </header>
      {workspaces && (
        <WorkspaceCreateDialog
          open={workspaceDialogOpen}
          onOpenChange={setWorkspaceDialogOpen}
          workspaces={workspaces}
        />
      )}
    </>
  );
};

export default WorkspaceHeader;
