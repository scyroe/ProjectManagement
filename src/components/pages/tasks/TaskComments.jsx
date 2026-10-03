import { MessageSquare, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';

const TaskComments = ({ history, onAddComment, profiles }) => {
  const t = useStrings().taskComments;
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const mentionQuery = note.match(/@([a-z0-9_.-]*)$/i)?.[1];
  const mentionMatches =
    mentionQuery === undefined
      ? []
      : profiles
          .filter((profile) =>
            profile.username
              .toLowerCase()
              .startsWith(mentionQuery.toLowerCase()),
          )
          .slice(0, 5);
  const comments = useMemo(
    () => history.filter((entry) => entry.action === 'commented'),
    [history],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    const saved = await onAddComment(note);
    if (saved) setNote('');
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {comments.length ? (
        <VirtualList
          ariaLabel={t.commentLabel}
          className="max-h-96"
          estimateSize={120}
          getItemKey={(entry) => entry.id}
          itemClassName="pb-2"
          items={comments}
          renderItem={(entry) => (
            <article className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" />
                  <p className="text-sm font-medium">{t.commentLabel}</p>
                </div>
                <time className="text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {entry.note}
              </p>
            </article>
          )}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <MessageSquare className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="text-sm font-medium">{t.empty}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.emptyDescription}
          </p>
        </div>
      )}
      <form className="space-y-3 border-t pt-4" onSubmit={handleSubmit}>
        <Label htmlFor="task-comment">{t.commentLabel}</Label>
        <Textarea
          id="task-comment"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t.placeholder}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">{t.mentionHint}</p>
        {mentionMatches.length > 0 && (
          <ul
            aria-label={t.mentionSuggestions}
            className="max-h-36 overflow-y-auto rounded-lg border bg-card p-1"
          >
            {mentionMatches.map((profile) => (
              <li key={profile.id}>
                <button
                  type="button"
                  className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  onClick={() =>
                    setNote((current) =>
                      current.replace(
                        /@[a-z0-9_.-]*$/i,
                        `@${profile.username} `,
                      ),
                    )
                  }
                >
                  <span className="font-medium">{profile.display_name}</span>
                  <span className="ml-2 text-muted-foreground">
                    @{profile.username}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !note.trim()}>
            <Send />
            {saving ? t.posting : t.submit}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaskComments;
