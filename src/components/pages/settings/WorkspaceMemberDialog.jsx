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

function WorkspaceMemberDialog({ open, onOpenChange, workspaces }) {
  const t = workspaces.strings;
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('editor');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || !username.trim()) return;
    setSaving(true);
    try {
      const added = await workspaces.handleAddMember(username.trim(), role);
      if (!added) return;
      setUsername('');
      setRole('editor');
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="space-y-1 pr-8">
          <DialogTitle className="text-xl font-semibold">
            {t.addMember}
          </DialogTitle>
          <DialogDescription>{t.addMemberDescription}</DialogDescription>
        </div>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="workspace-member-username">{t.username}</Label>
            <Input
              id="workspace-member-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={t.usernamePlaceholder}
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspace-member-role">{t.role}</Label>
            <VirtualSelect
              id="workspace-member-role"
              ariaLabel={t.role}
              searchLabel={t.role}
              value={role}
              onChange={setRole}
              options={['admin', 'editor', 'viewer'].map((value) => ({
                value,
                label: t.roles[value],
              }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              {t.cancel}
            </Button>
            <Button type="submit" disabled={saving || !username.trim()}>
              {saving ? t.addingMember : t.addMember}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default WorkspaceMemberDialog;
