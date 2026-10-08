import VirtualSelect from '@/components/ui/virtual-select';
import { useStrings } from '@/lib/i18n';

function WorkspaceSwitcher({ workspaces }) {
  const t = useStrings().workspaceManagement;
  const activeId = workspaces.activeWorkspaceId ?? '';
  const workspaceOptions = workspaces.memberships.map((membership) => ({
    value: membership.workspace_id,
    label: membership.workspace?.name ?? t.unnamed,
  }));

  return (
    <div className="min-w-0">
      <VirtualSelect
        id="workspace-select"
        ariaLabel={t.switchLabel}
        searchLabel={t.searchWorkspaces}
        emptyLabel={t.noWorkspacesFound}
        placeholder={workspaces.activeWorkspace?.name ?? t.loading}
        triggerClassName="w-full max-w-sm"
        disabled={!workspaces.isReady || workspaceOptions.length < 2}
        value={activeId}
        options={workspaceOptions}
        onChange={workspaces.setActiveWorkspace}
      />
      {workspaces.error && (
        <span className="sr-only" role="alert">
          {workspaces.error.message}
        </span>
      )}
    </div>
  );
}

export default WorkspaceSwitcher;
