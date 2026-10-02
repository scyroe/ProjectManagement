import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useStrings } from '@/lib/i18n';

const TaskActionNoteDialog = ({ request, onOpenChange }) => {
  const t = useStrings().taskActionNote;
  const [note, setNote] = useState('');
  const isCompletion = request?.type === 'complete';

  useEffect(() => {
    if (request) setNote('');
  }, [request]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    await request.onConfirm(note.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(request)} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5 pr-8">
            <DialogTitle>
              {isCompletion ? t.completeTitle : t.stopTitle}
            </DialogTitle>
            <DialogDescription>
              {isCompletion ? t.completeDescription : t.stopDescription}
            </DialogDescription>
          </div>
          <Textarea
            autoFocus
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={
              isCompletion ? t.completePlaceholder : t.stopPlaceholder
            }
            rows={4}
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t.cancel}
            </Button>
            <Button type="submit" disabled={!note.trim()}>
              {isCompletion ? t.completeSubmit : t.stopSubmit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskActionNoteDialog;
