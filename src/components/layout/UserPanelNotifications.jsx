import { Check, CheckCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

function UserPanelNotifications({
  hasMoreNotifications,
  loadingMoreNotifications,
  notifications,
  onLoadMoreNotifications,
  onMarkAllNotificationsRead,
  onMarkNotificationRead,
  onOpenNotification,
  t,
  unreadCount,
}) {
  const loadMorePending = useRef(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    if (!loadingMoreNotifications) loadMorePending.current = false;
  }, [loadingMoreNotifications]);

  const handleLoadMore = () => {
    if (
      !hasMoreNotifications ||
      loadingMoreNotifications ||
      loadMorePending.current
    ) {
      return;
    }
    loadMorePending.current = true;
    onLoadMoreNotifications();
  };

  const handleMarkAllRead = async () => {
    if (markingAllRead) return;
    setMarkingAllRead(true);
    try {
      await onMarkAllNotificationsRead();
    } finally {
      setMarkingAllRead(false);
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-6">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h3 className="text-sm font-semibold">{t.notifications}</h3>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <span className="rounded-full border border-warning/30 bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning-foreground">
              {unreadCount}
            </span>
          )}
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={markingAllRead}
              onClick={handleMarkAllRead}
            >
              <CheckCheck aria-hidden="true" />
              {markingAllRead ? t.markingAllRead : t.markAllRead}
            </Button>
          )}
        </div>
      </div>
      <div
        className="min-h-0 flex-1 space-y-2 overflow-y-auto"
        aria-live="polite"
        onScroll={(event) => {
          const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
          if (scrollHeight - scrollTop - clientHeight <= 24) {
            handleLoadMore();
          }
        }}
      >
        {notifications.length ? (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`relative rounded-lg border bg-card p-3 ${
                notification.read_at ? '' : 'border-primary/40 bg-primary/5'
              }`}
            >
              <button
                type="button"
                className="w-full rounded-md pr-7 text-left focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() => onOpenNotification(notification)}
              >
                <span className="block text-sm font-medium">
                  {t.notificationKinds[notification.kind] ?? notification.title}
                </span>
                {notification.body && (
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {notification.body}
                  </span>
                )}
              </button>
              {!notification.read_at && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-2 top-2 text-muted-foreground hover:text-success"
                  aria-label={t.markNotificationRead}
                  title={t.markNotificationRead}
                  onClick={() => onMarkNotificationRead(notification)}
                >
                  <Check />
                </Button>
              )}
            </article>
          ))
        ) : (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            {t.noNotifications}
          </p>
        )}
        {hasMoreNotifications && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={loadingMoreNotifications}
            onClick={handleLoadMore}
          >
            {loadingMoreNotifications
              ? t.loadingMoreNotifications
              : t.loadMoreNotifications}
          </Button>
        )}
      </div>
    </section>
  );
}

export default UserPanelNotifications;
