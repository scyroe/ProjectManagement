import { Bell, Keyboard, Settings2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

function UserPanelActions({
  collapsed,
  onExpand,
  onSettings,
  onShortcuts,
  t,
  unreadCount = 0,
}) {
  if (collapsed) {
    const notificationsLabel =
      unreadCount > 0
        ? `${t.expandNotifications}, ${t.unreadNotifications.replace('{count}', String(unreadCount))}`
        : t.expandNotifications;

    return (
      <div className="flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="mx-auto"
          aria-label={notificationsLabel}
          title={notificationsLabel}
          onClick={onExpand}
        >
          <span className="relative inline-flex">
            <Bell className={unreadCount > 0 ? 'text-warning' : undefined} />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-warning/30 bg-warning/20 px-1 text-[10px] leading-none font-semibold text-warning-foreground"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="mx-auto"
          aria-label={t.expand}
          title={t.account}
          onClick={onExpand}
        >
          <UserRound />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="mx-auto"
          aria-label={t.keyboardShortcuts}
          title={t.keyboardShortcuts}
          onClick={onShortcuts}
        >
          <Keyboard />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid w-full gap-2">
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        aria-label={t.keyboardShortcuts}
        onClick={onShortcuts}
      >
        <Keyboard />
        {t.keyboardShortcuts}
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        aria-label={t.settings}
        onClick={onSettings}
      >
        <Settings2 />
        {t.settings}
      </Button>
    </div>
  );
}

export default UserPanelActions;
