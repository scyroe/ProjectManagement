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
import { useStrings } from '@/lib/i18n';

function WorkspaceCreateDialog({ onOpenChange, open, workspaces }) {
  const t = useStrings().workspaceManagement;
  const [name, setName] = useState('');

  const handleCreate = async (event) => {
    event.preventDefault();
    const created = await workspaces.createWorkspace(name);
    if (!created) return;
    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onClick={() => onOpenChange(false)}
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
  );
}

export default WorkspaceCreateDialog;
