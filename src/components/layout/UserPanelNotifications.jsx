function UserPanelNotifications({
  notifications,
  onOpenNotification,
  t,
  unreadCount,
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t.notifications}</h3>
        {unreadCount > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            {unreadCount}
          </span>
        )}
      </div>
      <div className="space-y-2" aria-live="polite">
        {notifications.length ? (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              className={`w-full rounded-lg border bg-card p-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 ${
                notification.read_at ? '' : 'border-primary/40 bg-primary/5'
              }`}
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
          ))
        ) : (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            {t.noNotifications}
          </p>
        )}
      </div>
    </section>
  );
}

export default UserPanelNotifications;
