import { Pencil, UserPlus } from 'lucide-react';
import { Badge } from '@/components/reui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStrings } from '@/lib/i18n';
import ClientFormEditor from './ClientFormEditor';

const ClientFormDialog = ({
  client,
  onCreateProject,
  onOpenChange,
  onSaved,
  open,
}) => {
  const t = useStrings().clientForm;

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
        <ClientFormEditor
          autoFocus
          onCancel={() => onOpenChange(false)}
          onCreateProject={onCreateProject}
          onSaved={(savedClient) => {
            onSaved(savedClient);
            onOpenChange(false);
          }}
          open={open}
          client={client}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ClientFormDialog;
