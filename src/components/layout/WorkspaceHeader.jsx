import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
} from 'lucide-react';
import TaskWorkspaceHeader from '@/components/pages/tasks/TaskWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { useStrings } from '@/lib/i18n';

const WorkspaceHeader = ({
  accountPanelCollapsed,
  activeRoute,
  currentPage,
  onAccountPanelToggle,
  onNewClient,
  onNewProject,
  onNewTask,
  onSearch,
  onSidebarToggle,
  sidebarCollapsed,
  taskMetrics,
}) => {
  const strings = useStrings();
  const t = strings.layout.workspaceHeader;
  const CurrentIcon = currentPage?.icon;
  const quickAdd = {
    projects: { onClick: onNewProject, label: t.newProject },
    clients: { onClick: onNewClient, label: t.newClient },
  }[activeRoute] ?? { onClick: onNewTask, label: t.newTask };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
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
        <div className="hidden items-center gap-2 text-sm font-medium sm:flex">
          {CurrentIcon && (
            <CurrentIcon className="size-4 text-muted-foreground" />
          )}
          {currentPage && strings.routes[currentPage.id]}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {activeRoute === 'tasks' && <TaskWorkspaceHeader {...taskMetrics} />}
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={quickAdd.label}
          title={quickAdd.label}
          onClick={quickAdd.onClick}
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={t.openSearch}
          title={t.searchTitle}
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
        title={accountPanelCollapsed ? t.openAccountPanel : t.closeAccountPanel}
        onClick={onAccountPanelToggle}
      >
        {accountPanelCollapsed ? <PanelRightOpen /> : <PanelRightClose />}
      </Button>
    </header>
  );
};

export default WorkspaceHeader;
