import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStrings } from '@/lib/i18n';

const KeyboardShortcutsDialog = ({ onOpenChange, open }) => {
  const t = useStrings().layout.shortcutsDialog;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <div className="space-y-1 pr-8">
          <DialogTitle className="text-xl font-semibold">{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </div>
        <ul className="mt-5 space-y-2">
          {t.entries.map(({ action, keys }) => (
            <li
              key={action}
              className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5"
            >
              <span className="text-sm">{action}</span>
              <kbd className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {keys}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;
