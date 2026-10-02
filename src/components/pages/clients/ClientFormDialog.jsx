import { Pencil, Save, UserPlus } from 'lucide-react';
import { Badge } from '@/components/reui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useClientForm } from '@/hooks/clients/use-client-form';
import { useStrings } from '@/lib/i18n';

const ClientFormDialog = ({ client, onOpenChange, onSaved, open }) => {
  const t = useStrings().clientForm;
  const { form, handleSubmit, saving, updateField } = useClientForm({
    client,
    onSaved: (savedClient) => {
      onSaved(savedClient);
      onOpenChange(false);
    },
    open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2 text-primary">
            {client ? (
              <Pencil className="size-4" />
            ) : (
              <UserPlus className="size-4" />
            )}
            <Badge variant="secondary" size="sm">
              {client ? t.editBadge : t.badge}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-semibold">
            {client ? t.editTitle : t.title}
          </DialogTitle>
          <DialogDescription>
            {client ? t.editDescription : t.description}
          </DialogDescription>
        </div>
        <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="new-client-name">{t.nameLabel}</Label>
            <Input
              id="client-name"
              autoFocus
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-client-company">{t.companyLabel}</Label>
              <Input
                id="client-company"
                value={form.company}
                onChange={(event) => updateField('company', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-client-email">{t.emailLabel}</Label>
              <Input
                id="client-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-client-phone">{t.phoneLabel}</Label>
              <Input
                id="client-phone"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-notes">{t.notesLabel}</Label>
            <Textarea
              id="client-notes"
              value={form.notes}
              placeholder={t.notesPlaceholder}
              onChange={(event) => updateField('notes', event.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t.cancel}
            </Button>
            <Button type="submit" disabled={saving}>
              <Save />
              {saving ? t.saving : client ? t.save : t.create}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientFormDialog;
