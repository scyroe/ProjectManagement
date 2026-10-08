import { MessageSquare, Send } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStrings } from '@/lib/i18n';

const TaskComments = ({
  comments,
  error,
  hasMore,
  loading,
  loadingMore,
  onAddComment,
  onLoadMore,
  onRetry,
  profiles,
}) => {
  const t = useStrings().taskComments;
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const mentionQuery = note.match(/@([a-z0-9_.-]*)$/i)?.[1];
  const handleScroll = useCallback(
    (event) => {
      const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
      if (hasMore && !error && scrollHeight - scrollTop - clientHeight < 80) {
        onLoadMore();
      }
    },
    [error, hasMore, onLoadMore],
  );
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
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    const saved = await onAddComment(note);
    if (saved) setNote('');
    setSaving(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto" onScroll={handleScroll}>
        {comments.length ? (
          <div className="space-y-2">
            <ul aria-label={t.commentLabel} className="space-y-2">
              {comments.map((entry) => (
                <li key={entry.id}>
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
                </li>
              ))}
            </ul>
            {error && (
              <p role="alert" className="text-center text-sm text-destructive">
                {t.loadError}
              </p>
            )}
            {error && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={loadingMore}
                onClick={onRetry}
              >
                {t.retry}
              </Button>
            )}
            {hasMore && !error && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={loadingMore || Boolean(error)}
                onClick={onLoadMore}
              >
                {loadingMore ? t.loadingMore : t.loadMore}
              </Button>
            )}
          </div>
        ) : loading ? (
          <p
            role="status"
            className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"
          >
            {t.loading}
          </p>
        ) : error ? (
          <div className="space-y-2 rounded-lg border border-dashed p-6 text-center">
            <p role="alert" className="text-sm text-destructive">
              {t.loadError}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loadingMore}
              onClick={onRetry}
            >
              {t.retry}
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <MessageSquare className="mx-auto mb-2 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">{t.empty}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.emptyDescription}
            </p>
          </div>
        )}
      </div>
      <form
        className="shrink-0 space-y-3 border-t pt-4"
        onSubmit={handleSubmit}
      >
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
