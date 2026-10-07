import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import VirtualSelect from '@/components/ui/virtual-select';
import { useStrings } from '@/lib/i18n';

function WorkspaceSwitcher({ workspaces }) {
  const t = useStrings().workspaceManagement;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const activeId = workspaces.activeWorkspaceId ?? '';
  const workspaceOptions = workspaces.memberships.map((membership) => ({
    value: membership.workspace_id,
    label: membership.workspace?.name ?? t.unnamed,
  }));

  const handleCreate = async (event) => {
    event.preventDefault();
    const created = await workspaces.createWorkspace(name);
    if (!created) return;
    setName('');
    setOpen(false);
  };

  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <VirtualSelect
          id="workspace-select"
          ariaLabel={t.switchLabel}
          searchLabel={t.searchWorkspaces}
          emptyLabel={t.noWorkspacesFound}
          placeholder={workspaces.activeWorkspace?.name ?? t.loading}
          triggerClassName="w-48 max-w-[40vw]"
          disabled={!workspaces.isReady || workspaceOptions.length < 2}
          value={activeId}
          options={workspaceOptions}
          onChange={workspaces.setActiveWorkspace}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          {t.create}
        </Button>
      </div>
      {workspaces.error && (
        <span className="sr-only" role="alert">
          {workspaces.error.message}
        </span>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-1 pr-8">
            <DialogTitle className="text-xl font-semibold">
              {t.createTitle}
            </DialogTitle>
            <DialogDescription>{t.createDescription}</DialogDescription>
          </div>
          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label htmlFor="new-workspace-name">{t.nameLabel}</Label>
              <Input
                id="new-workspace-name"
                autoFocus
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t.cancel}
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                {t.create}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default WorkspaceSwitcher;
